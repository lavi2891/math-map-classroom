"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import {
  createHomeworkAssignment,
  setHomeworkHidden,
  softDeleteHomeworkAssignment,
  updateHomeworkAssignment,
  type HomeworkAssignmentInput,
} from "@/lib/db/homework";

export type HomeworkActionState = {
  error?: string;
  success: boolean;
};

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

export async function createHomeworkAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const input = getHomeworkInput(formData);

  if (!input) {
    return {
      error: "חסרים פרטים לשמירת שיעורי הבית.",
      success: false,
    };
  }

  const result = await createHomeworkAssignment(input);

  if (!result.success) {
    const detail =
      process.env.NODE_ENV === "development" && result.errorMessage
        ? `: ${result.errorMessage}`
        : "";

    return {
      error: `לא הצלחנו לשמור את שיעורי הבית${detail}`,
      success: false,
    };
  }

  revalidatePath(ROUTES.teacherHomework);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHome);

  return { success: true };
}

export async function updateHomeworkAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const id = getString(formData, "homeworkId");
  const input = getHomeworkInput(formData);

  if (!id || !input) {
    return {
      error: "חסרים פרטים לשמירת שיעורי הבית.",
      success: false,
    };
  }

  const success = await updateHomeworkAssignment(id, input);

  if (!success) {
    return {
      error: "לא הצלחנו לשמור את שיעורי הבית.",
      success: false,
    };
  }

  revalidatePath(ROUTES.teacherHomework);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHome);

  return { success: true };
}

export async function hideHomeworkAction(formData: FormData) {
  const id = getString(formData, "homeworkId");

  if (!id) {
    return;
  }

  const success = await setHomeworkHidden(id, true);

  if (success) {
    revalidatePath(ROUTES.teacherHomework);
    revalidatePath(ROUTES.studentClass);
    revalidatePath(ROUTES.studentHome);
  }
}

export async function unhideHomeworkAction(formData: FormData) {
  const id = getString(formData, "homeworkId");

  if (!id) {
    return;
  }

  const success = await setHomeworkHidden(id, false);

  if (success) {
    revalidatePath(ROUTES.teacherHomework);
    revalidatePath(ROUTES.studentClass);
    revalidatePath(ROUTES.studentHome);
  }
}

export async function deleteHomeworkAction(
  formData: FormData,
): Promise<HomeworkActionState> {
  const id = getString(formData, "homeworkId");

  if (!id) {
    return {
      error: "חסרים פרטים למחיקת שיעורי הבית.",
      success: false,
    };
  }

  const result = await softDeleteHomeworkAssignment(id);

  if (result.success) {
    revalidatePath(ROUTES.teacherHomework);
    revalidatePath(ROUTES.studentClass);
    revalidatePath(ROUTES.studentHome);

    return { success: true };
  }

  const detail =
    process.env.NODE_ENV === "development" && result.errorMessage
      ? `: ${result.errorMessage}`
      : "";

  return {
    error: `לא הצלחנו למחוק את שיעורי הבית${detail}`,
    success: false,
  };
}
