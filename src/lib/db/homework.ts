import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentClasses } from "@/lib/db/classes";
import { getCurrentUserManageableMemberships } from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppCard,
  HomeworkAssignment,
  HomeworkFile,
  HomeworkStatus,
  HomeworkSubmissionSummary,
  UnderstandingLevel,
} from "@/types";

const HOMEWORK_BUCKET = "homework-submissions";
const SIGNED_URL_SECONDS = 60 * 10;

type HomeworkRow = {
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  description: string;
  due_at: string | null;
  id: string;
  title: string;
  visible_from: string;
};

type HomeworkFileRow = {
  file_name: string | null;
  file_path: string;
  id: string;
  mime_type: string | null;
  size_bytes: number | null;
  submission_id: string;
};

type HomeworkSubmissionRow = {
  homework_id: string;
  id: string;
  note: string | null;
  profiles:
    | { display_name: string | null; username: string | null }
    | { display_name: string | null; username: string | null }[]
    | null;
  status: HomeworkStatus;
  student_id: string;
  submitted_at: string | null;
  understanding: UnderstandingLevel;
};

type HomeworkSummary = {
  doneCount: number;
  noUnderstandingCount: number;
  partialUnderstandingCount: number;
  submissionCount: number;
};

function getClassName(row: HomeworkRow) {
  const joinedClass = Array.isArray(row.classes) ? row.classes[0] : row.classes;

  return joinedClass?.name;
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "אין תאריך הגשה";
  }

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function emptySummary(): HomeworkSummary {
  return {
    doneCount: 0,
    noUnderstandingCount: 0,
    partialUnderstandingCount: 0,
    submissionCount: 0,
  };
}

function emptySubmissionMap() {
  return new Map<string, HomeworkSubmissionSummary[]>();
}

async function createSignedUrl(filePath: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from(HOMEWORK_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_SECONDS);

  return data?.signedUrl;
}

async function toHomeworkFile(row: HomeworkFileRow): Promise<HomeworkFile> {
  return {
    fileName: row.file_name ?? undefined,
    filePath: row.file_path,
    id: row.id,
    mimeType: row.mime_type ?? undefined,
    signedUrl: await createSignedUrl(row.file_path),
    sizeBytes: row.size_bytes ?? undefined,
  };
}

async function getFilesBySubmissionIds(submissionIds: string[]) {
  const filesBySubmission = new Map<string, HomeworkFile[]>();

  if (submissionIds.length === 0) {
    return filesBySubmission;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_files")
    .select("id, submission_id, file_path, file_name, mime_type, size_bytes")
    .in("submission_id", submissionIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return filesBySubmission;
  }

  await Promise.all(
    (data as HomeworkFileRow[]).map(async (row) => {
      const files = filesBySubmission.get(row.submission_id) ?? [];
      files.push(await toHomeworkFile(row));
      filesBySubmission.set(row.submission_id, files);
    }),
  );

  return filesBySubmission;
}

function getStudentName(submission: HomeworkSubmissionRow) {
  const profile = Array.isArray(submission.profiles)
    ? submission.profiles[0]
    : submission.profiles;

  return (
    profile?.display_name ??
    profile?.username ??
    "תלמיד/ה"
  );
}

async function getSubmissionsByHomeworkIds(homeworkIds: string[]) {
  const submissionsByHomework = emptySubmissionMap();

  if (homeworkIds.length === 0) {
    return submissionsByHomework;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .select(
      "id, homework_id, student_id, status, understanding, note, submitted_at, profiles(display_name, username)",
    )
    .in("homework_id", homeworkIds)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return submissionsByHomework;
  }

  const rows = data as unknown as HomeworkSubmissionRow[];
  const filesBySubmission = await getFilesBySubmissionIds(
    rows.map((submission) => submission.id),
  );

  rows.forEach((submission) => {
    const submissions = submissionsByHomework.get(submission.homework_id) ?? [];
    submissions.push({
      files: filesBySubmission.get(submission.id) ?? [],
      id: submission.id,
      note: submission.note ?? undefined,
      status: submission.status,
      studentId: submission.student_id,
      studentName: getStudentName(submission),
      submittedAt: submission.submitted_at ?? undefined,
      understanding: submission.understanding,
    });
    submissionsByHomework.set(submission.homework_id, submissions);
  });

  return submissionsByHomework;
}

async function getCurrentStudentFilesByHomeworkIds(homeworkIds: string[]) {
  const filesByHomework = new Map<string, HomeworkFile[]>();
  const user = await getCurrentUser();

  if (!user || homeworkIds.length === 0) {
    return filesByHomework;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .select("id, homework_id")
    .eq("student_id", user.id)
    .in("homework_id", homeworkIds);

  if (error || !data) {
    return filesByHomework;
  }

  const submissions = data as { homework_id: string; id: string }[];
  const filesBySubmission = await getFilesBySubmissionIds(
    submissions.map((submission) => submission.id),
  );

  submissions.forEach((submission) => {
    filesByHomework.set(
      submission.homework_id,
      filesBySubmission.get(submission.id) ?? [],
    );
  });

  return filesByHomework;
}

function getSubmissionSummary(
  submissions: HomeworkSubmissionSummary[],
): HomeworkSummary {
  return submissions.reduce<HomeworkSummary>((summary, submission) => {
    summary.submissionCount += 1;

    if (submission.status === "done") {
      summary.doneCount += 1;
    }

    if (submission.understanding === "partial") {
      summary.partialUnderstandingCount += 1;
    }

    if (submission.understanding === "no") {
      summary.noUnderstandingCount += 1;
    }

    return summary;
  }, emptySummary());
}

function toHomework(
  row: HomeworkRow,
  submissions: HomeworkSubmissionSummary[],
  files: HomeworkFile[],
): HomeworkAssignment {
  const summary = getSubmissionSummary(submissions);

  return {
    classId: row.class_id,
    className: getClassName(row),
    completedCount: summary.doneCount,
    description: row.description,
    doneCount: summary.doneCount,
    dueDate: formatDueDate(row.due_at),
    files,
    id: row.id,
    noUnderstandingCount: summary.noUnderstandingCount,
    partialUnderstandingCount: summary.partialUnderstandingCount,
    submissionCount: summary.submissionCount,
    submissions,
    title: row.title,
    totalCount: summary.submissionCount,
  };
}

async function getHomeworkRows(classIds?: string[]) {
  if (classIds && classIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("homework_assignments")
    .select("id, class_id, title, description, visible_from, due_at, classes(name)")
    .lte("visible_from", new Date().toISOString())
    .order("visible_from", { ascending: false });

  if (classIds && classIds.length > 0) {
    query = query.in("class_id", classIds);
  }

  const { data, error } = await query.limit(30);

  if (error || !data) {
    return [];
  }

  const now = Date.now();

  return (data as HomeworkRow[]).filter(
    (assignment) => !assignment.due_at || Date.parse(assignment.due_at) >= now,
  );
}

export async function getHomeworkAssignments(classIds?: string[]) {
  const rows = await getHomeworkRows(classIds);
  const submissionsByHomework = await getSubmissionsByHomeworkIds(
    rows.map((assignment) => assignment.id),
  );

  return rows.map((row) =>
    toHomework(row, submissionsByHomework.get(row.id) ?? [], []),
  );
}

export async function getStudentHomeworkAssignments(classIds?: string[]) {
  const rows = await getHomeworkRows(classIds);
  const filesByHomework = await getCurrentStudentFilesByHomeworkIds(
    rows.map((assignment) => assignment.id),
  );

  return rows.map((row) => toHomework(row, [], filesByHomework.get(row.id) ?? []));
}

export async function getManageableHomeworkAssignments() {
  const memberships = await getCurrentUserManageableMemberships();

  return getHomeworkAssignments(
    memberships.map((membership) => membership.classId),
  );
}

export async function getOpenStudentHomework(limit = 5) {
  const classes = await getStudentClasses();
  const homework = await getStudentHomeworkAssignments(
    classes.map((classSummary) => classSummary.id),
  );

  return homework.slice(0, limit);
}

export function getStudentPracticeCards(): AppCard[] {
  return [
    {
      id: "practice-placeholder-1",
      title: "תרגול מותאם",
      description: "תרגול אמיתי יחובר בהמשך לנתוני מיומנויות.",
      actionLabel: "בקרוב",
    },
  ];
}
