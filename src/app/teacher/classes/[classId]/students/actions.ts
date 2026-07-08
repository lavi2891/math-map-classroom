"use server";

import { revalidatePath } from "next/cache";
import {
  createManagedStudent,
  forceManagedStudentPasswordChange,
  generateTemporaryPassword,
  resetManagedStudentPassword,
  type StudentLoginSlip,
} from "@/lib/db/studentManagement";

export type StudentManagementActionState = {
  error?: string;
  message?: string;
  slip?: StudentLoginSlip;
  temporaryPassword?: string;
};

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function getClassPath(classId: string) {
  return `/teacher/classes/${classId}/students`;
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

  revalidatePath(getClassPath(classId));
  revalidatePath("/teacher/classes");

  return {
    message: "התלמיד נוצר בהצלחה.",
    slip: result.slip,
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

  revalidatePath(getClassPath(classId));

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
    return { error: result.error ?? "לא הצלחנו לדרוש החלפת סיסמה." };
  }

  revalidatePath(getClassPath(classId));

  return { message: "התלמיד יתבקש להחליף סיסמה." };
}

export async function generateTemporaryPasswordAction(): Promise<StudentManagementActionState> {
  return { temporaryPassword: generateTemporaryPassword() };
}
