import { getStudentClasses } from "@/lib/db/classes";
import { getCurrentUserManageableMemberships } from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppCard,
  HomeworkAssignment,
  HomeworkStatus,
  UnderstandingLevel,
} from "@/types";

type HomeworkRow = {
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  description: string;
  due_at: string | null;
  id: string;
  title: string;
  visible_from: string;
};

type HomeworkSubmissionRow = {
  homework_id: string;
  status: HomeworkStatus;
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

async function getSubmissionSummaries(homeworkIds: string[]) {
  const summaries = new Map<string, HomeworkSummary>();

  if (homeworkIds.length === 0) {
    return summaries;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .select("homework_id, status, understanding")
    .in("homework_id", homeworkIds);

  if (error || !data) {
    return summaries;
  }

  (data as HomeworkSubmissionRow[]).forEach((submission) => {
    const summary = summaries.get(submission.homework_id) ?? emptySummary();

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

    summaries.set(submission.homework_id, summary);
  });

  return summaries;
}

function toHomework(
  row: HomeworkRow,
  summaries: Map<string, HomeworkSummary>,
): HomeworkAssignment {
  const summary = summaries.get(row.id) ?? emptySummary();

  return {
    classId: row.class_id,
    className: getClassName(row),
    completedCount: summary.doneCount,
    description: row.description,
    doneCount: summary.doneCount,
    dueDate: formatDueDate(row.due_at),
    id: row.id,
    noUnderstandingCount: summary.noUnderstandingCount,
    partialUnderstandingCount: summary.partialUnderstandingCount,
    submissionCount: summary.submissionCount,
    title: row.title,
    totalCount: summary.submissionCount,
  };
}

export async function getHomeworkAssignments(classIds?: string[]) {
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
  const rows = (data as HomeworkRow[]).filter(
    (assignment) => !assignment.due_at || Date.parse(assignment.due_at) >= now,
  );
  const summaries = await getSubmissionSummaries(
    rows.map((assignment) => assignment.id),
  );

  return rows.map((row) => toHomework(row, summaries));
}

export async function getManageableHomeworkAssignments() {
  const memberships = await getCurrentUserManageableMemberships();

  return getHomeworkAssignments(
    memberships.map((membership) => membership.classId),
  );
}

export async function getOpenStudentHomework(limit = 5) {
  const classes = await getStudentClasses();
  const homework = await getHomeworkAssignments(
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
