import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getCurrentUserManageableMemberships,
  getCurrentUserStudentMemberships,
} from "@/lib/db/memberships";
import { getTagsForHomeworkIds, replaceHomeworkTags } from "@/lib/db/tags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppCard,
  ClassSummary,
  HomeworkFile,
  HomeworkAssignment,
  HomeworkStatus,
  HomeworkSubmissionDetail,
  HomeworkSubmissionSummary,
  HomeworkTag,
  HomeworkTagInput,
  UnderstandingLevel,
} from "@/types";

export type HomeworkAssignmentInput = {
  allowLateSubmission: boolean;
  allowExternalUrl: boolean;
  classId: string;
  description: string;
  dueAt?: string;
  externalUrl?: string;
  lateSubmissionUntil?: string;
  requirePhoto: boolean;
  requireStatus: boolean;
  requireUnderstanding: boolean;
  tags?: HomeworkTagInput[];
  title: string;
  visibleFrom?: string;
};

export type HomeworkSubmissionInput = {
  hasSelectedPhotoUpload?: boolean;
  homeworkId: string;
  note?: string;
  status: HomeworkStatus;
  understanding: UnderstandingLevel;
};

export type HomeworkSubmissionResult = {
  errorMessage?: string;
  submissionId?: string;
  success: boolean;
  userId?: string;
};

export type HomeworkMutationResult = {
  errorMessage?: string;
  success: boolean;
};

type HomeworkRow = {
  allow_late_submission: boolean | null;
  allow_external_url: boolean | null;
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  description: string;
  deleted_at: string | null;
  due_at: string | null;
  external_url: string | null;
  id: string;
  is_hidden: boolean | null;
  late_submission_until: string | null;
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

type HomeworkFileRow = {
  file_name: string;
  file_path: string;
  id: string;
  mime_type: string | null;
  size_bytes: number | null;
  submission_id: string;
};

type HomeworkFileOwnerRow = HomeworkFileRow & {
  homework_submissions:
    | {
        homework_assignments:
          | { require_photo: boolean | null }
          | { require_photo: boolean | null }[]
          | null;
        id: string;
        status: HomeworkStatus;
        student_id: string;
      }
    | {
        homework_assignments:
          | { require_photo: boolean | null }
          | { require_photo: boolean | null }[]
          | null;
        id: string;
        status: HomeworkStatus;
        student_id: string;
      }[]
    | null;
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

const PHOTO_REQUIRED_DONE_ERROR =
  "כדי לסמן שסיימת, צריך לצרף צילום מחברת.";
const LAST_REQUIRED_PHOTO_DELETE_ERROR =
  "אי אפשר להסיר את הצילום האחרון כשההגשה מסומנת כסיימתי.";
const PARTIAL_HOMEWORK_FILE_DELETE_ERROR =
  "הצילום נמחק מהאחסון אבל לא הצלחנו לעדכן את ההגשה. נסה לרענן.";
const HOMEWORK_SUBMISSION_CLOSED_ERROR =
  "עבר תאריך ההגשה ולא ניתן להגיש.";

function getJoined<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function isStorageObjectMissingError(error: { message?: string } | null) {
  if (!error?.message) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("no such")
  );
}

function getClassName(row: HomeworkRow) {
  return getJoined(row.classes)?.name;
}

function canSubmitHomework(
  dueAt: string | undefined,
  allowLateSubmission: boolean,
  lateSubmissionUntil: string | undefined,
) {
  const now = Date.now();

  if (!dueAt || now <= Date.parse(dueAt)) {
    return true;
  }

  if (!allowLateSubmission) {
    return false;
  }

  return !lateSubmissionUntil || now <= Date.parse(lateSubmissionUntil);
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

function toSubmissionDetail(
  row: HomeworkSubmissionRow,
  files: HomeworkFile[] = [],
): HomeworkSubmissionDetail {
  return {
    files,
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
  tags: HomeworkTag[] = [],
): HomeworkAssignment {
  const totalStudentCount = submissionDetails.length;
  const dueAt = row.due_at ?? undefined;
  const allowLateSubmission = row.allow_late_submission ?? true;
  const lateSubmissionUntil = row.late_submission_until ?? undefined;
  const details = dueAt
    ? submissionDetails.map((detail) => ({
        ...detail,
        isLate: detail.submittedAt
          ? Date.parse(detail.submittedAt) > Date.parse(dueAt)
          : false,
      }))
    : submissionDetails;
  const studentSubmission =
    dueAt && submission
      ? {
          ...submission,
          isLate: submission.submittedAt
            ? Date.parse(submission.submittedAt) > Date.parse(dueAt)
            : false,
        }
      : submission;

  return {
    allowLateSubmission,
    allowExternalUrl: row.allow_external_url ?? false,
    canSubmit: canSubmitHomework(dueAt, allowLateSubmission, lateSubmissionUntil),
    classId: row.class_id,
    className: getClassName(row),
    description: row.description,
    dueAt,
    dueDate: dueAt ? formatDateTime(dueAt) : undefined,
    deletedAt: row.deleted_at ?? undefined,
    externalUrl: row.external_url ?? undefined,
    id: row.id,
    isHidden: row.is_hidden ?? false,
    isOverdue: dueAt ? Date.parse(dueAt) < Date.now() : false,
    lateSubmissionUntil,
    lateSubmissionUntilDate: lateSubmissionUntil
      ? formatDateTime(lateSubmissionUntil)
      : undefined,
    requirePhoto: row.require_photo ?? false,
    requireStatus: row.require_status ?? true,
    requireUnderstanding: row.require_understanding ?? true,
    submission: studentSubmission,
    submissionDetails: details,
    submissionSummary: summarize(details, totalStudentCount),
    tags,
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

  const rows = data as unknown as HomeworkSubmissionRow[];
  const filesBySubmission = await getHomeworkFilesBySubmissionIds(
    rows.map((row) => row.id),
  );

  rows.forEach((row) => {
    const submissions = submissionsByHomework.get(row.homework_id) ?? [];
    submissions.push(toSubmissionDetail(row, filesBySubmission.get(row.id) ?? []));
    submissionsByHomework.set(row.homework_id, submissions);
  });

  return submissionsByHomework;
}

async function getHomeworkFilesBySubmissionIds(submissionIds: string[]) {
  const filesBySubmission = new Map<string, HomeworkFile[]>();

  if (submissionIds.length === 0) {
    return filesBySubmission;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_files")
    .select("id, submission_id, file_path, file_name, mime_type, size_bytes")
    .in("submission_id", submissionIds)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return filesBySubmission;
  }

  const rows = data as HomeworkFileRow[];
  const signedUrls = await createHomeworkFileSignedUrls(
    rows.map((row) => row.file_path),
  );

  rows.forEach((row) => {
    const signedUrl = signedUrls.get(row.file_path);

    if (!signedUrl) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Skipping inaccessible homework file", {
          file_id: row.id,
          file_path: row.file_path,
          submission_id: row.submission_id,
        });
      }

      return;
    }

    const files = filesBySubmission.get(row.submission_id) ?? [];
    files.push({
      fileName: row.file_name,
      filePath: row.file_path,
      id: row.id,
      mimeType: row.mime_type ?? undefined,
      signedUrl,
      sizeBytes: row.size_bytes ?? undefined,
    });
    filesBySubmission.set(row.submission_id, files);
  });

  return filesBySubmission;
}

export async function createHomeworkFileSignedUrl(filePath: string) {
  const signedUrls = await createHomeworkFileSignedUrls([filePath]);

  return signedUrls.get(filePath);
}

export async function createHomeworkFileSignedUrls(filePaths: string[]) {
  const signedUrls = new Map<string, string>();

  if (filePaths.length === 0) {
    return signedUrls;
  }

  const supabase = await createSupabaseServerClient();

  await Promise.all(
    filePaths.map(async (filePath) => {
      const { data, error } = await supabase.storage
        .from("homework-submissions")
        .createSignedUrl(filePath, 60 * 10);

      if (!error && data?.signedUrl) {
        signedUrls.set(filePath, data.signedUrl);
      }
    }),
  );

  return signedUrls;
}

export async function deleteHomeworkFile(fileId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_files")
    .select(
      "id, submission_id, file_path, file_name, mime_type, size_bytes, homework_submissions!inner(id, student_id, status, homework_assignments!inner(require_photo))",
    )
    .eq("id", fileId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("deleteHomeworkFile select failed", {
        error: {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
        },
        payload: { file_id: fileId },
      });
    }

    return { success: false };
  }

  const row = data as unknown as HomeworkFileOwnerRow;
  const submission = Array.isArray(row.homework_submissions)
    ? row.homework_submissions[0]
    : row.homework_submissions;

  if (!submission || submission.student_id !== user.id) {
    console.error("deleteHomeworkFile ownership check failed", {
      payload: {
        file_id: fileId,
        user_id: user.id,
      },
    });

    return { success: false };
  }

  const assignment = Array.isArray(submission.homework_assignments)
    ? submission.homework_assignments[0]
    : submission.homework_assignments;

  if (submission.status === "done" && assignment?.require_photo) {
    const { count, error: countError } = await supabase
      .from("homework_files")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", row.submission_id);

    if (countError) {
      console.error("deleteHomeworkFile count failed", {
        error: {
          code: countError.code,
          details: countError.details,
          hint: countError.hint,
          message: countError.message,
        },
        payload: {
          file_id: fileId,
          submission_id: row.submission_id,
        },
      });

      return { success: false };
    }

    if ((count ?? 0) <= 1) {
      return {
        errorMessage: LAST_REQUIRED_PHOTO_DELETE_ERROR,
        success: false,
      };
    }
  }

  const { error: storageError } = await supabase.storage
    .from("homework-submissions")
    .remove([row.file_path]);

  if (storageError && !isStorageObjectMissingError(storageError)) {
    console.error("deleteHomeworkFile storage delete failed", {
      error: {
        message: storageError.message,
      },
      payload: {
        file_id: fileId,
      },
    });

    return { success: false };
  }

  if (storageError && process.env.NODE_ENV === "development") {
    console.warn("Deleting orphaned homework file metadata", {
      file_id: fileId,
      file_path: row.file_path,
      storage_error: storageError.message,
    });
  }

  const { error: metadataError } = await supabase
    .from("homework_files")
    .delete()
    .eq("id", fileId);

  if (metadataError) {
    console.error("deleteHomeworkFile metadata delete failed", {
      error: {
        code: metadataError.code,
        details: metadataError.details,
        hint: metadataError.hint,
        message: metadataError.message,
      },
      payload: {
        file_id: fileId,
      },
    });

    return {
      errorMessage: PARTIAL_HOMEWORK_FILE_DELETE_ERROR,
      success: false,
    };
  }

  return { success: true };
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

async function getHomeworkRows(
  classIds: string[],
  visibleOnly: boolean,
  limit: number,
) {
  if (classIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("homework_assignments")
    .select(
      "id, class_id, title, description, visible_from, due_at, allow_late_submission, late_submission_until, require_status, require_understanding, require_photo, allow_external_url, external_url, is_hidden, deleted_at, classes(name)",
    )
    .in("class_id", classIds)
    .is("deleted_at", null)
    .order("visible_from", { ascending: false });

  if (visibleOnly) {
    query = query
      .eq("is_hidden", false)
      .lte("visible_from", new Date().toISOString());
  }

  const { data, error } = await query.limit(limit);

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

function isOpenStudentHomework(assignment: HomeworkAssignment) {
  const fileCount = assignment.submission?.files?.length ?? 0;

  return (
    !assignment.submission ||
    assignment.submission.status !== "done" ||
    (assignment.requirePhoto && fileCount === 0)
  );
}

function needsStudentAction(assignment: HomeworkAssignment) {
  return assignment.canSubmit && isOpenStudentHomework(assignment);
}

function getStudentHomeworkRelevanceRank(assignment: HomeworkAssignment) {
  if (!assignment.isOverdue && needsStudentAction(assignment)) {
    return 0;
  }

  if (assignment.isOverdue && assignment.canSubmit) {
    return 1;
  }

  if (
    assignment.submission?.status === "started" ||
    assignment.submission?.status === "not_started"
  ) {
    return 2;
  }

  if (assignment.submission?.status === "done") {
    return 3;
  }

  return 4;
}

function getStudentHomeworkSortDate(assignment: HomeworkAssignment) {
  if (assignment.submission?.submittedAt) {
    return Date.parse(assignment.submission.submittedAt);
  }

  if (assignment.dueAt) {
    return Date.parse(assignment.dueAt);
  }

  return Date.parse(assignment.visibleFrom);
}

function sortStudentHomeworkByRelevance(assignments: HomeworkAssignment[]) {
  return [...assignments].sort((a, b) => {
    const rankDiff =
      getStudentHomeworkRelevanceRank(a) - getStudentHomeworkRelevanceRank(b);

    if (rankDiff !== 0) {
      return rankDiff;
    }

    return getStudentHomeworkSortDate(b) - getStudentHomeworkSortDate(a);
  });
}

export async function getTeacherHomeworkAssignments(limit = 20) {
  const classes = await getManageableHomeworkClasses();
  const rows = await getHomeworkRows(
    classes.map((classSummary) => classSummary.id),
    false,
    limit,
  );
  const [studentsByClass, submissionsByHomework] = await Promise.all([
    getActiveStudentsByClassIds([...new Set(rows.map((row) => row.class_id))]),
    getSubmissionsByHomeworkIds(rows.map((row) => row.id)),
  ]);
  const tagsByHomework = await getTagsForHomeworkIds(rows.map((row) => row.id));

  return rows.map((row) => {
    const details = mergeStudentSubmissionDetails(
      studentsByClass.get(row.class_id) ?? [],
      submissionsByHomework.get(row.id) ?? [],
    );

    return toHomeworkAssignment(row, details, undefined, tagsByHomework.get(row.id));
  });
}

export async function getStudentHomeworkAssignments(
  classIds?: string[],
  limit = 10,
) {
  const memberships = await getCurrentUserStudentMemberships();
  const membershipClassIds = memberships.map((membership) => membership.classId);
  const allowedClassIds = classIds
    ? classIds.filter((classId) => membershipClassIds.includes(classId))
    : membershipClassIds;
  const rows = await getHomeworkRows(allowedClassIds, true, limit);
  const submissionsByHomework = await getSubmissionsByHomeworkIds(
    rows.map((row) => row.id),
  );
  const tagsByHomework = await getTagsForHomeworkIds(rows.map((row) => row.id));
  const user = await getCurrentUser();

  return rows.map((row) => {
    const submission = user
      ? submissionsByHomework
          .get(row.id)
          ?.find((item) => item.studentId === user.id)
      : undefined;

    return toHomeworkAssignment(
      row,
      [],
      submission,
      tagsByHomework.get(row.id),
    );
  });
}

export async function getManageableHomeworkAssignments() {
  return getTeacherHomeworkAssignments();
}

export async function getStudentHomeworkList(
  limit = 100,
  classIds?: string[],
) {
  const homework = await getStudentHomeworkAssignments(
    classIds,
    limit,
  );

  return sortStudentHomeworkByRelevance(homework).slice(0, limit);
}

export async function createHomeworkAssignment(input: HomeworkAssignmentInput) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false };
  }

  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  if (!manageableClassIds.includes(input.classId)) {
    return { success: false };
  }

  const supabase = await createSupabaseServerClient();
  const insertPayload = {
    allow_late_submission: input.allowLateSubmission,
    allow_external_url: input.allowExternalUrl,
    class_id: input.classId,
    created_by: user.id,
    description: input.description,
    due_at: input.dueAt || null,
    external_url: input.externalUrl || null,
    late_submission_until: input.allowLateSubmission
      ? input.lateSubmissionUntil || null
      : null,
    require_photo: input.requirePhoto,
    require_status: input.requireStatus,
    require_understanding: input.requireUnderstanding,
    title: input.title,
    updated_by: user.id,
    visible_from: input.visibleFrom ?? new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("homework_assignments")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("createHomeworkAssignment failed", {
      error: {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      },
      payload: {
        allow_external_url: insertPayload.allow_external_url,
        allow_late_submission: insertPayload.allow_late_submission,
        class_id: insertPayload.class_id,
        created_by: insertPayload.created_by,
        due_at: insertPayload.due_at,
        has_external_url: Boolean(insertPayload.external_url),
        late_submission_until: insertPayload.late_submission_until,
        require_photo: insertPayload.require_photo,
        require_status: insertPayload.require_status,
        require_understanding: insertPayload.require_understanding,
        title_exists: Boolean(insertPayload.title),
        title_length: insertPayload.title.length,
        visible_from: insertPayload.visible_from,
      },
    });

    return {
      errorMessage: error?.message ?? "No homework row returned.",
      success: false,
    };
  }

  const tagsSaved = await replaceHomeworkTags(
    data.id as string,
    input.classId,
    input.tags ?? [],
  );

  if (!tagsSaved) {
    return {
      errorMessage: "Failed to save homework tags.",
      success: false,
    };
  }

  return { success: true };
}

export async function updateHomeworkAssignment(
  id: string,
  input: HomeworkAssignmentInput,
) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  if (!manageableClassIds.includes(input.classId)) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_assignments")
    .update({
      allow_late_submission: input.allowLateSubmission,
      allow_external_url: input.allowExternalUrl,
      class_id: input.classId,
      description: input.description,
      due_at: input.dueAt || null,
      external_url: input.externalUrl || null,
      late_submission_until: input.allowLateSubmission
        ? input.lateSubmissionUntil || null
        : null,
      require_photo: input.requirePhoto,
      require_status: input.requireStatus,
      require_understanding: input.requireUnderstanding,
      title: input.title,
      updated_by: user.id,
      visible_from: input.visibleFrom ?? new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return replaceHomeworkTags(id, input.classId, input.tags ?? []);
}

export async function setHomeworkHidden(id: string, isHidden: boolean) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("homework_assignments")
    .update({
      is_hidden: isHidden,
      updated_by: user.id,
    })
    .eq("id", id)
    .is("deleted_at", null);

  return !error;
}

export async function softDeleteHomeworkAssignment(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_assignments")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("softDeleteHomeworkAssignment failed", {
      error: {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      },
      payload: {
        homework_id: id,
        updated_by: user.id,
      },
    });

    return {
      errorMessage: error.message,
      success: false,
    };
  }

  if (!data) {
    console.error("softDeleteHomeworkAssignment updated no rows", {
      payload: {
        homework_id: id,
        updated_by: user.id,
      },
    });

    return { success: false };
  }

  return { success: true };
}

export async function upsertHomeworkSubmission(input: HomeworkSubmissionInput) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("homework_assignments")
    .select("id, due_at, allow_late_submission, late_submission_until, require_photo")
    .eq("id", input.homeworkId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    if (assignmentError) {
      console.error("upsertHomeworkSubmission assignment check failed", {
        error: {
          code: assignmentError.code,
          details: assignmentError.details,
          hint: assignmentError.hint,
          message: assignmentError.message,
        },
        payload: {
          homework_id: input.homeworkId,
          student_id: user.id,
        },
      });
    }

    return {
      errorMessage: assignmentError?.message,
      success: false,
    };
  }

  if (
    !canSubmitHomework(
      assignment.due_at ?? undefined,
      assignment.allow_late_submission ?? true,
      assignment.late_submission_until ?? undefined,
    )
  ) {
    return {
      errorMessage: HOMEWORK_SUBMISSION_CLOSED_ERROR,
      success: false,
    };
  }

  if (input.status === "done") {
    if (assignment.require_photo && !input.hasSelectedPhotoUpload) {
      const { data: existingSubmission, error: submissionError } = await supabase
        .from("homework_submissions")
        .select("id")
        .eq("homework_id", input.homeworkId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (submissionError) {
        console.error("upsertHomeworkSubmission submission check failed", {
          error: {
            code: submissionError.code,
            details: submissionError.details,
            hint: submissionError.hint,
            message: submissionError.message,
          },
          payload: {
            homework_id: input.homeworkId,
            student_id: user.id,
          },
        });

        return {
          errorMessage: submissionError.message,
          success: false,
        };
      }

      let fileCount = 0;

      if (existingSubmission?.id) {
        const { count, error: fileCountError } = await supabase
          .from("homework_files")
          .select("id", { count: "exact", head: true })
          .eq("submission_id", existingSubmission.id);

        if (fileCountError) {
          console.error("upsertHomeworkSubmission file count failed", {
            error: {
              code: fileCountError.code,
              details: fileCountError.details,
              hint: fileCountError.hint,
              message: fileCountError.message,
            },
            payload: {
              homework_id: input.homeworkId,
              student_id: user.id,
              submission_id: existingSubmission.id,
            },
          });

          return {
            errorMessage: fileCountError.message,
            success: false,
          };
        }

        fileCount = count ?? 0;
      }

      if (fileCount === 0) {
        return {
          errorMessage: PHOTO_REQUIRED_DONE_ERROR,
          success: false,
        };
      }
    }
  }

  const { data, error } = await supabase
    .from("homework_submissions")
    .upsert(
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
    )
    .select("id, student_id")
    .single();

  if (error || !data) {
    if (error) {
      console.error("upsertHomeworkSubmission failed", {
        error: {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
        },
        payload: {
          homework_id: input.homeworkId,
          student_id: user.id,
        },
      });
    }

    return {
      errorMessage: error?.message,
      success: false,
    };
  }

  return {
    submissionId: data.id as string,
    success: true,
    userId: data.student_id as string,
  };
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
