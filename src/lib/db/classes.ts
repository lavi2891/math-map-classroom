import { cookies } from "next/headers";
import {
  getCurrentUserStaffMemberships,
  getCurrentUserStudentMemberships,
  getStudentMemberships,
} from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassMembership, ClassSummary } from "@/types";

export const SELECTED_STUDENT_CLASS_COOKIE = "selectedStudentClassId";

type ClassRow = {
  class_code: string;
  grade: number;
  id: string;
  name: string;
};

type MembershipClassRow = {
  class_id: string;
  role: ClassMembership["role"];
  classes: ClassRow | ClassRow[] | null;
};

function getJoinedClass(row: MembershipClassRow) {
  return Array.isArray(row.classes) ? row.classes[0] : row.classes;
}

async function getActiveStudentCounts(classIds: string[]) {
  if (classIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createSupabaseServerClient();
  const counts = new Map<string, number>();

  await Promise.all(
    classIds.map(async (classId) => {
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

async function getClassesForMemberships(memberships: ClassMembership[]) {
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

  const currentUserClassRows = (data as MembershipClassRow[]).filter((row) =>
    memberships.some(
      (membership) =>
        membership.classId === row.class_id && membership.role === row.role,
    ),
  );
  const studentCounts = await getActiveStudentCounts(classIds);

  return currentUserClassRows.flatMap<ClassSummary>((row) => {
    const classRow = getJoinedClass(row);

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
        studentCount: studentCounts.get(classRow.id) ?? 0,
      },
    ];
  });
}

export async function getTeacherClasses() {
  const memberships = await getCurrentUserStaffMemberships();

  return getClassesForMemberships(memberships);
}

export async function getStudentClasses(userId?: string) {
  const memberships = userId
    ? await getStudentMemberships(userId)
    : await getCurrentUserStudentMemberships();

  return getClassesForMemberships(memberships);
}

export async function getSelectedStudentClass(userId: string) {
  const classes = await getStudentClasses(userId);

  if (classes.length === 0) {
    return {
      classes,
      selectedClass: undefined,
    };
  }

  const cookieStore = await cookies();
  const selectedClassId = cookieStore.get(SELECTED_STUDENT_CLASS_COOKIE)?.value;
  const selectedClass =
    classes.find((classSummary) => classSummary.id === selectedClassId) ??
    classes[0];

  return {
    classes,
    selectedClass,
  };
}
