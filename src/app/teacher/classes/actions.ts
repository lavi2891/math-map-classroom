"use server";

import { revalidatePath } from "next/cache";
import {
  archiveClass,
  createClassWithOwner,
  unarchiveClass,
  updateClass,
} from "@/lib/db/classes";

export type ClassManagementActionState = {
  error?: string;
  message?: string;
};

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function getFormGrade(formData: FormData) {
  return Number.parseInt(getFormString(formData, "grade"), 10);
}

function revalidateClasses() {
  revalidatePath("/teacher/classes");
  revalidatePath("/student/home");
  revalidatePath("/student/class");
}

export async function createClassAction(
  _previousState: ClassManagementActionState,
  formData: FormData,
): Promise<ClassManagementActionState> {
  const result = await createClassWithOwner({
    classCode: getFormString(formData, "classCode"),
    displayName: getFormString(formData, "displayName"),
    grade: getFormGrade(formData),
    name: getFormString(formData, "name"),
    schoolYear: getFormString(formData, "schoolYear"),
  });

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו ליצור את הכיתה." };
  }

  revalidateClasses();

  return { message: "הכיתה נוצרה בהצלחה." };
}

export async function updateClassAction(
  _previousState: ClassManagementActionState,
  formData: FormData,
): Promise<ClassManagementActionState> {
  const result = await updateClass({
    classCode: getFormString(formData, "classCode"),
    displayName: getFormString(formData, "displayName"),
    grade: getFormGrade(formData),
    id: getFormString(formData, "classId"),
    name: getFormString(formData, "name"),
    schoolYear: getFormString(formData, "schoolYear"),
  });

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו לעדכן את הכיתה." };
  }

  revalidateClasses();

  return { message: "הכיתה עודכנה בהצלחה." };
}

export async function archiveClassAction(
  _previousState: ClassManagementActionState,
  formData: FormData,
): Promise<ClassManagementActionState> {
  const result = await archiveClass(getFormString(formData, "classId"));

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו להעביר את הכיתה לארכיון." };
  }

  revalidateClasses();

  return { message: "הכיתה הועברה לארכיון." };
}

export async function unarchiveClassAction(
  _previousState: ClassManagementActionState,
  formData: FormData,
): Promise<ClassManagementActionState> {
  const result = await unarchiveClass(getFormString(formData, "classId"));

  if (!result.success) {
    return { error: result.error ?? "לא הצלחנו להחזיר את הכיתה לפעילות." };
  }

  revalidateClasses();

  return { message: "הכיתה חזרה לפעילות." };
}
