import { getStudentClasses } from "@/lib/db/classes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppCard, HomeworkAssignment } from "@/types";

type HomeworkRow = {
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  description: string;
  due_at: string | null;
  id: string;
  title: string;
  visible_from: string;
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

function toHomework(row: HomeworkRow): HomeworkAssignment {
  return {
    classId: row.class_id,
    className: getClassName(row),
    completedCount: 0,
    description: row.description,
    dueDate: formatDueDate(row.due_at),
    id: row.id,
    title: row.title,
    totalCount: 0,
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

  return (data as HomeworkRow[])
    .filter((assignment) => !assignment.due_at || Date.parse(assignment.due_at) >= now)
    .map(toHomework);
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
