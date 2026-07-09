import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getCurrentUserStaffMemberships,
  getCurrentUserStudentMemberships,
  getStudentMemberships,
} from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassMembership, ClassSummary } from "@/types";

export const SELECTED_STUDENT_CLASS_COOKIE = "selectedStudentClassId";

type ClassRow = {
  active: boolean | null;
  archived_at: string | null;
  class_code: string;
  display_name: string | null;
  grade: number;
  id: string;
  name: string;
  school_year: string | null;
};

type MembershipClassRow = {
  class_id: string;
  role: ClassMembership["role"];
  classes: ClassRow | ClassRow[] | null;
};

export type ClassFormInput = {
  classCode: string;
  displayName?: string;
  grade: number;
  id?: string;
  name: string;
  schoolYear?: string;
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

export async function getClassStudentCount(classId: string) {
  const counts = await getActiveStudentCounts([classId]);

  return counts.get(classId) ?? 0;
}

async function getClassesForMemberships(memberships: ClassMembership[]) {
  if (memberships.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const classIds = memberships.map((membership) => membership.classId);
  const { data, error } = await supabase
    .from("class_memberships")
    .select(
      "class_id, role, classes(id, name, display_name, grade, class_code, school_year, active, archived_at)",
    )
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
          active: classRow.active ?? true,
          archivedAt: classRow.archived_at ?? undefined,
          displayName: classRow.display_name ?? undefined,
          grade: classRow.grade,
          id: classRow.id,
          name: classRow.name,
          role: row.role,
          schoolYear: classRow.school_year ?? undefined,
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

  const classes = await getClassesForMemberships(memberships);

  return classes.filter((classSummary) => classSummary.active);
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

function normalizeClassCode(classCode: string) {
  return classCode.trim().toUpperCase();
}

function normalizeNullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed || null;
}

function validateClassInput(input: ClassFormInput) {
  const name = input.name.trim();
  const classCode = normalizeClassCode(input.classCode);

  if (!name) {
    return { error: "יש להזין שם כיתה." };
  }

  if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 12) {
    return { error: "יש להזין שכבה תקינה." };
  }

  if (!classCode) {
    return { error: "יש להזין קוד כיתה." };
  }

  if (!/^[A-Z0-9]+$/.test(classCode)) {
    return { error: "קוד הכיתה יכול לכלול אותיות באנגלית ומספרים בלבד." };
  }

  return {
    classCode,
    displayName: normalizeNullableText(input.displayName) ?? name,
    grade: input.grade,
    name,
    schoolYear: normalizeNullableText(input.schoolYear),
  };
}

async function isClassOwner(classId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_memberships")
    .select("class_id")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .eq("active", true)
    .maybeSingle();

  return Boolean(data);
}

export async function createClassWithOwner(input: ClassFormInput, userId?: string) {
  const currentUser = userId ? { id: userId } : await getCurrentUser();

  if (!currentUser) {
    return { error: "יש להתחבר כדי ליצור כיתה.", success: false };
  }

  const validated = validateClassInput(input);

  if ("error" in validated) {
    return { error: validated.error, success: false };
  }

  const supabase = await createSupabaseServerClient();
  const classId = crypto.randomUUID();
  const { error: classError } = await supabase
    .from("classes")
    .insert({
      active: true,
      archived_at: null,
      class_code: validated.classCode,
      display_name: validated.displayName,
      grade: validated.grade,
      id: classId,
      name: validated.name,
      school_year: validated.schoolYear,
    });

  if (classError) {
    const message =
      classError?.code === "23505"
        ? "קוד הכיתה כבר קיים."
        : "לא הצלחנו ליצור את הכיתה.";

    return { error: message, success: false };
  }

  const { error: membershipError } = await supabase
    .from("class_memberships")
    .insert({
      active: true,
      class_id: classId,
      role: "owner",
      user_id: currentUser.id,
    });

  if (membershipError) {
    console.error("createClassWithOwner membership insert failed", {
      classId,
      errorMessage: membershipError.message,
      userId: currentUser.id,
    });

    return { error: "הכיתה נוצרה, אבל לא הצלחנו לשייך אותך כבעלים.", success: false };
  }

  return { classId, success: true };
}

export async function updateClass(input: ClassFormInput, userId?: string) {
  const currentUser = userId ? { id: userId } : await getCurrentUser();

  if (!currentUser || !input.id || !(await isClassOwner(input.id, currentUser.id))) {
    return { error: "רק בעל הכיתה יכול לערוך את הכיתה.", success: false };
  }

  const validated = validateClassInput(input);

  if ("error" in validated) {
    return { error: validated.error, success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("classes")
    .update({
      class_code: validated.classCode,
      display_name: validated.displayName,
      grade: validated.grade,
      name: validated.name,
      school_year: validated.schoolYear,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    const message =
      error.code === "23505" ? "קוד הכיתה כבר קיים." : "לא הצלחנו לעדכן את הכיתה.";

    return { error: message, success: false };
  }

  return { success: true };
}

export async function archiveClass(classId: string, userId?: string) {
  const currentUser = userId ? { id: userId } : await getCurrentUser();

  if (!currentUser || !(await isClassOwner(classId, currentUser.id))) {
    return { error: "רק בעל הכיתה יכול להעביר כיתה לארכיון.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("classes")
    .update({
      active: false,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);

  if (error) {
    return { error: "לא הצלחנו להעביר את הכיתה לארכיון.", success: false };
  }

  return { success: true };
}

export async function unarchiveClass(classId: string, userId?: string) {
  const currentUser = userId ? { id: userId } : await getCurrentUser();

  if (!currentUser || !(await isClassOwner(classId, currentUser.id))) {
    return { error: "רק בעל הכיתה יכול להחזיר כיתה לפעילות.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("classes")
    .update({
      active: true,
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);

  if (error) {
    return { error: "לא הצלחנו להחזיר את הכיתה לפעילות.", success: false };
  }

  return { success: true };
}
