import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentClasses } from "@/lib/db/classes";
import {
  getCurrentUserManageableMemberships,
  getCurrentUserStudentMemberships,
} from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppCard,
  ClassSummary,
  HomeworkAssignment,
  HomeworkStatus,
  HomeworkSubmissionDetail,
  HomeworkSubmissionSummary,
  UnderstandingLevel,
} from "@/types";

export type HomeworkAssignmentInput = {
  allowExternalUrl: boolean;
  classId: string;
  description: string;
  dueAt?: string;
  externalUrl?: string;
  requirePhoto: boolean;
  requireStatus: boolean;
  requireUnderstanding: boolean;
  title: string;
  visibleFrom?: string;
};

export type HomeworkSubmissionInput = {
  homeworkId: string;
  note?: string;
  status: HomeworkStatus;
  understanding: UnderstandingLevel;
};

type HomeworkRow = {
  allow_external_url: boolean | null;
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  description: string;
  due_at: string | null;
  external_url: string | null;
  id: string;
  require_photo: boolean | null;
  require_status: boolean | null;
  require_understanding: boolean | null;
  title: string;
  visible_from: string;
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

type MembershipStudentRow = {
  class_id: string;
  profiles:
    | { display_name: string | null; username: string | null }
    | { display_name: string | null; username: string | null }[]
    | null;
  student_code: string | null;
  user_id: string;
};

type ClassRow = {
  class_code: string;
  grade: number;
  id: string;
  name: string;
};

type MembershipClassRow = {
  class_id: string;
  role: string;
  classes: ClassRow | ClassRow[] | null;
};

function getJoined<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function getClassName(row: HomeworkRow) {
  return getJoined(row.classes)?.name;
}

function getStudentName(row: MembershipStudentRow | HomeworkSubmissionRow) {
  const profile = getJoined(row.profiles);

  return profile?.display_name ?? profile?.username ?? "תלמיד/ה";
}

function formatDateTime(value?: string) {
  if (!value) {
    return "אין תאריך";
  }

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function emptySummary(totalStudentCount = 0): HomeworkSubmissionSummary {
  return {
    doneCount: 0,
    goodUnderstandingCount: 0,
    noUnderstandingCount: 0,
    notStartedCount: 0,
    partialUnderstandingCount: 0,
    startedCount: 0,
    submittedCount: 0,
    totalStudentCount,
  };
}

function toClassSummary(row: MembershipClassRow, studentCount = 0): ClassSummary[] {
  const classRow = getJoined(row.classes);

  if (!classRow) {
    return [];
  }

  return [
    {
      classCode: classRow.class_code,
      grade: classRow.grade,
      id: classRow.id,
      name: classRow.name,
      role: row.role,
      studentCount,
    },
  ];
}

function toSubmissionDetail(row: HomeworkSubmissionRow): HomeworkSubmissionDetail {
  return {
    id: row.id,
    note: row.note ?? undefined,
    status: row.status,
    studentId: row.student_id,
    studentName: getStudentName(row),
    submittedAt: row.submitted_at ?? undefined,
    understanding: row.understanding,
  };
}

function summarize(details: HomeworkSubmissionDetail[], totalStudentCount: number) {
  return details.reduce<HomeworkSubmissionSummary>((summary, detail) => {
    if (detail.id) {
      summary.submittedCount += 1;
    }

    if (detail.status === "done") {
      summary.doneCount += 1;
    }

    if (detail.status === "started") {
      summary.startedCount += 1;
    }

    if (detail.status === "not_started") {
      summary.notStartedCount += 1;
    }

    if (detail.understanding === "good") {
      summary.goodUnderstandingCount += 1;
    }

    if (detail.understanding === "partial") {
      summary.partialUnderstandingCount += 1;
    }

    if (detail.understanding === "no") {
      summary.noUnderstandingCount += 1;
    }

    return summary;
  }, emptySummary(totalStudentCount));
}

function toHomeworkAssignment(
  row: HomeworkRow,
  submissionDetails: HomeworkSubmissionDetail[],
  submission?: HomeworkSubmissionDetail,
): HomeworkAssignment {
  const totalStudentCount = submissionDetails.length;
  const dueAt = row.due_at ?? undefined;

  return {
    allowExternalUrl: row.allow_external_url ?? false,
    classId: row.class_id,
    className: getClassName(row),
    description: row.description,
    dueAt,
    dueDate: dueAt ? formatDateTime(dueAt) : undefined,
    externalUrl: row.external_url ?? undefined,
    id: row.id,
    isOverdue: dueAt ? Date.parse(dueAt) < Date.now() : false,
    requirePhoto: row.require_photo ?? false,
    requireStatus: row.require_status ?? true,
    requireUnderstanding: row.require_understanding ?? true,
    submission,
    submissionDetails,
    submissionSummary: summarize(submissionDetails, totalStudentCount),
    title: row.title,
    visibleFrom: row.visible_from,
  };
}

async function getActiveStudentCounts(classIds: string[]) {
  const counts = new Map<string, number>();

  await Promise.all(
    classIds.map(async (classId) => {
      const supabase = await createSupabaseServerClient();
      const { count } = await supabase
        .from("class_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("class_id", classId)
        .eq("role", "student")
        .eq("active", true);

      counts.set(classId, count ?? 0);
    }),
  );

  return counts;
}

async function getActiveStudentsByClassIds(classIds: string[]) {
  const studentsByClass = new Map<string, HomeworkSubmissionDetail[]>();

  if (classIds.length === 0) {
    return studentsByClass;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, user_id, student_code, profiles(display_name, username)")
    .eq("role", "student")
    .eq("active", true)
    .in("class_id", classIds)
    .order("student_code", { ascending: true });

  if (error || !data) {
    return studentsByClass;
  }

  (data as unknown as MembershipStudentRow[]).forEach((row) => {
    const students = studentsByClass.get(row.class_id) ?? [];
    const name = getStudentName(row);
    students.push({
      studentId: row.user_id,
      studentName: row.student_code ? `${name} (${row.student_code})` : name,
    });
    studentsByClass.set(row.class_id, students);
  });

  return studentsByClass;
}

async function getSubmissionsByHomeworkIds(homeworkIds: string[]) {
  const submissionsByHomework = new Map<string, HomeworkSubmissionDetail[]>();

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

  (data as unknown as HomeworkSubmissionRow[]).forEach((row) => {
    const submissions = submissionsByHomework.get(row.homework_id) ?? [];
    submissions.push(toSubmissionDetail(row));
    submissionsByHomework.set(row.homework_id, submissions);
  });

  return submissionsByHomework;
}

function mergeStudentSubmissionDetails(
  students: HomeworkSubmissionDetail[],
  submissions: HomeworkSubmissionDetail[],
) {
  const submissionsByStudent = new Map(
    submissions.map((submission) => [submission.studentId, submission]),
  );

  return students.map((student) => ({
    ...student,
    ...submissionsByStudent.get(student.studentId),
    studentName: student.studentName,
  }));
}

async function getHomeworkRows(classIds: string[], visibleOnly: boolean) {
  if (classIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("homework_assignments")
    .select(
      "id, class_id, title, description, visible_from, due_at, require_status, require_understanding, require_photo, allow_external_url, external_url, classes(name)",
    )
    .in("class_id", classIds)
    .order("visible_from", { ascending: false });

  if (visibleOnly) {
    query = query.lte("visible_from", new Date().toISOString());
  }

  const { data, error } = await query.limit(100);

  if (error || !data) {
    return [];
  }

  return data as unknown as HomeworkRow[];
}

export async function getManageableHomeworkClasses() {
  const memberships = await getCurrentUserManageableMemberships();

  if (memberships.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const classIds = memberships.map((membership) => membership.classId);
  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, role, classes(id, name, grade, class_code)")
    .in("class_id", classIds)
    .eq("active", true);

  if (error || !data) {
    return [];
  }

  const studentCounts = await getActiveStudentCounts(classIds);

  return (data as unknown as MembershipClassRow[]).flatMap((row) => {
    const membership = memberships.find(
      (item) => item.classId === row.class_id && item.role === row.role,
    );

    return membership ? toClassSummary(row, studentCounts.get(row.class_id)) : [];
  });
}

export async function getTeacherHomeworkAssignments() {
  const classes = await getManageableHomeworkClasses();
  const rows = await getHomeworkRows(
    classes.map((classSummary) => classSummary.id),
    false,
  );
  const [studentsByClass, submissionsByHomework] = await Promise.all([
    getActiveStudentsByClassIds([...new Set(rows.map((row) => row.class_id))]),
    getSubmissionsByHomeworkIds(rows.map((row) => row.id)),
  ]);

  return rows.map((row) => {
    const details = mergeStudentSubmissionDetails(
      studentsByClass.get(row.class_id) ?? [],
      submissionsByHomework.get(row.id) ?? [],
    );

    return toHomeworkAssignment(row, details);
  });
}

export async function getStudentHomeworkAssignments(classIds?: string[]) {
  const memberships = await getCurrentUserStudentMemberships();
  const membershipClassIds = memberships.map((membership) => membership.classId);
  const allowedClassIds = classIds
    ? classIds.filter((classId) => membershipClassIds.includes(classId))
    : membershipClassIds;
  const rows = await getHomeworkRows(allowedClassIds, true);
  const submissionsByHomework = await getSubmissionsByHomeworkIds(
    rows.map((row) => row.id),
  );
  const user = await getCurrentUser();

  return rows.map((row) => {
    const submission = user
      ? submissionsByHomework
          .get(row.id)
          ?.find((item) => item.studentId === user.id)
      : undefined;

    return toHomeworkAssignment(row, [], submission);
  });
}

export async function getManageableHomeworkAssignments() {
  return getTeacherHomeworkAssignments();
}

export async function getOpenStudentHomework(limit = 5) {
  const classes = await getStudentClasses();
  const homework = await getStudentHomeworkAssignments(
    classes.map((classSummary) => classSummary.id),
  );

  return homework.slice(0, limit);
}

export async function createHomeworkAssignment(input: HomeworkAssignmentInput) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  if (!manageableClassIds.includes(input.classId)) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("homework_assignments").insert({
    allow_external_url: input.allowExternalUrl,
    class_id: input.classId,
    created_by: user.id,
    description: input.description,
    due_at: input.dueAt || null,
    external_url: input.externalUrl || null,
    require_photo: input.requirePhoto,
    require_status: input.requireStatus,
    require_understanding: input.requireUnderstanding,
    title: input.title,
    visible_from: input.visibleFrom ?? new Date().toISOString(),
  });
}

export async function updateHomeworkAssignment(
  id: string,
  input: HomeworkAssignmentInput,
) {
  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  if (!manageableClassIds.includes(input.classId)) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("homework_assignments")
    .update({
      allow_external_url: input.allowExternalUrl,
      class_id: input.classId,
      description: input.description,
      due_at: input.dueAt || null,
      external_url: input.externalUrl || null,
      require_photo: input.requirePhoto,
      require_status: input.requireStatus,
      require_understanding: input.requireUnderstanding,
      title: input.title,
      visible_from: input.visibleFrom ?? new Date().toISOString(),
    })
    .eq("id", id);
}

export async function upsertHomeworkSubmission(input: HomeworkSubmissionInput) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("homework_submissions").upsert(
    {
      homework_id: input.homeworkId,
      note: input.note || null,
      status: input.status,
      student_id: user.id,
      submitted_at: new Date().toISOString(),
      understanding: input.understanding,
    },
    {
      onConflict: "homework_id,student_id",
    },
  );
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
