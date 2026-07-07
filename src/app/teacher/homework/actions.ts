"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import {
  createHomeworkAssignment,
  updateHomeworkAssignment,
  type HomeworkAssignmentInput,
} from "@/lib/db/homework";

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

function getDateTime(formData: FormData, field: string) {
  const value = getString(formData, field);

  return value ? new Date(value).toISOString() : undefined;
}

function getHomeworkInput(formData: FormData): HomeworkAssignmentInput | null {
  const classId = getString(formData, "classId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const externalUrl = getString(formData, "externalUrl");

  if (!classId || !title || !description) {
    return null;
  }

  return {
    allowExternalUrl: Boolean(externalUrl) || getBoolean(formData, "allowExternalUrl"),
    classId,
    description,
    dueAt: getDateTime(formData, "dueAt"),
    externalUrl: externalUrl || undefined,
    requirePhoto: getBoolean(formData, "requirePhoto"),
    requireStatus: getBoolean(formData, "requireStatus"),
    requireUnderstanding: getBoolean(formData, "requireUnderstanding"),
    title,
    visibleFrom: getDateTime(formData, "visibleFrom"),
  };
}

export async function createHomeworkAction(formData: FormData) {
  const input = getHomeworkInput(formData);

  if (input) {
    await createHomeworkAssignment(input);
  }

  revalidatePath(ROUTES.teacherHomework);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHome);
}

export async function updateHomeworkAction(formData: FormData) {
  const id = getString(formData, "homeworkId");
  const input = getHomeworkInput(formData);

  if (id && input) {
    await updateHomeworkAssignment(id, input);
  }

  revalidatePath(ROUTES.teacherHomework);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHome);
}
