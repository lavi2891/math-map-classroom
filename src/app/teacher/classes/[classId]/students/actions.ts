"use server";

import { revalidatePath } from "next/cache";
import {
  attachExistingStudentToClass,
  bulkCreateManagedStudents,
  createManagedStudent,
  forceManagedStudentPasswordChange,
  removeStudentFromClass,
  resetManagedStudentPassword,
  searchStudentProfileForClass,
  type StudentLoginSlip,
  type StudentProfileSearchResult,
} from "@/lib/db/studentManagement";

export type StudentManagementActionState = {
  error?: string;
  message?: string;
  profile?: StudentProfileSearchResult;
  slip?: StudentLoginSlip;
  slips?: StudentLoginSlip[];
};

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function getClassPath(classId: string) {
  return `/teacher/classes/${classId}/students`;
}

function revalidateStudents(classId: string) {
  revalidatePath(getClassPath(classId));
  revalidatePath("/teacher/classes");
}

export async function createStudentAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const classId = getFormString(formData, "classId");
  const result = await createManagedStudent({
    classId,
    displayName: getFormString(formData, "displayName"),
    studentCode: getFormString(formData, "studentCode"),
    temporaryPassword: getFormString(formData, "temporaryPassword"),
    username: getFormString(formData, "username"),
  });

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו ליצור תלמיד." };
  }

  revalidateStudents(classId);

  return {
    message: "התלמיד נוצר בהצלחה.",
    slip: result.slip,
  };
}

export async function bulkCreateStudentsAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const classId = getFormString(formData, "classId");
  const names = getFormString(formData, "names")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  const count = Number.parseInt(getFormString(formData, "count"), 10);
  const result = await bulkCreateManagedStudents({
    classId,
    count: Number.isFinite(count) ? count : 0,
    names,
    startingCode: getFormString(formData, "startingCode") || "001",
    usernamePrefix: getFormString(formData, "usernamePrefix"),
  });

  if (!result.success) {
    return {
      error: result.error ?? "לא הצלחנו ליצור תלמידים.",
      slips: result.slips,
    };
  }

  revalidateStudents(classId);

  return {
    message: "התלמידים נוצרו בהצלחה.",
    slips: result.slips,
  };
}

export async function searchExistingStudentAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const result = await searchStudentProfileForClass(
    getFormString(formData, "classId"),
    getFormString(formData, "username"),
  );

  if (!result.success) {
    return { error: result.error ?? "לא נמצא משתמש בשם זה." };
  }

  return { profile: result.profile };
}

export async function attachExistingStudentAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const classId = getFormString(formData, "classId");
  const result = await attachExistingStudentToClass(
    classId,
    getFormString(formData, "username"),
  );

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו לצרף את המשתמש לכיתה." };
  }

  revalidateStudents(classId);

  return {
    message: result.message ?? "המשתמש צורף לכיתה.",
    profile: result.profile,
  };
}

export async function resetStudentPasswordAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const classId = getFormString(formData, "classId");
  const studentId = getFormString(formData, "studentId");
  const result = await resetManagedStudentPassword(classId, studentId);

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו לאפס סיסמה." };
  }

  revalidateStudents(classId);

  return {
    message: "הסיסמה אופסה.",
    slip: result.slip,
  };
}

export async function forcePasswordChangeAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const classId = getFormString(formData, "classId");
  const studentId = getFormString(formData, "studentId");
  const result = await forceManagedStudentPasswordChange(classId, studentId);

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו לעדכן את חובת החלפת הסיסמה." };
  }

  revalidateStudents(classId);

  return { message: "התלמיד יתבקש להחליף סיסמה בכניסה הבאה." };
}

export async function removeStudentFromClassAction(
  _previousState: StudentManagementActionState,
  formData: FormData,
): Promise<StudentManagementActionState> {
  const classId = getFormString(formData, "classId");
  const studentId = getFormString(formData, "studentId");
  const result = await removeStudentFromClass(classId, studentId);

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו להסיר את התלמיד מהכיתה." };
  }

  revalidateStudents(classId);

  return { message: result.message ?? "התלמיד הוסר מהכיתה." };
}
