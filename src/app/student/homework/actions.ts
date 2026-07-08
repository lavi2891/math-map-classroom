"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import { deleteHomeworkFile, upsertHomeworkSubmission } from "@/lib/db/homework";
import type { HomeworkStatus, UnderstandingLevel } from "@/types";

export type HomeworkSubmissionActionState = {
  error?: string;
  homeworkId?: string;
  submissionId?: string;
  success: boolean;
  userId?: string;
};

export type HomeworkFileActionState = {
  error?: string;
  success: boolean;
};

const HOMEWORK_STATUSES: HomeworkStatus[] = ["not_started", "started", "done"];
const UNDERSTANDING_LEVELS: UnderstandingLevel[] = [
  "good",
  "partial",
  "no",
  "unknown",
];

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isHomeworkStatus(value: string): value is HomeworkStatus {
  return HOMEWORK_STATUSES.includes(value as HomeworkStatus);
}

function isUnderstandingLevel(value: string): value is UnderstandingLevel {
  return UNDERSTANDING_LEVELS.includes(value as UnderstandingLevel);
}

export async function submitHomework(
  _state: HomeworkSubmissionActionState,
  formData: FormData,
): Promise<HomeworkSubmissionActionState> {
  const homeworkId = getString(formData, "homeworkId");
  const status = getString(formData, "status");
  const understanding = getString(formData, "understanding");
  const note = getString(formData, "note");
  const hasSelectedPhotoUpload =
    getString(formData, "hasSelectedPhotoUpload") === "true";

  if (
    !homeworkId ||
    !isHomeworkStatus(status) ||
    !isUnderstandingLevel(understanding)
  ) {
    return {
      error: "חסרים פרטים לשליחת ההגשה.",
      success: false,
    };
  }

  const result = await upsertHomeworkSubmission({
    hasSelectedPhotoUpload,
    homeworkId,
    note,
    status,
    understanding,
  });

  if (!result.success) {
    return {
      error: result.errorMessage ?? "לא הצלחנו לשמור את ההגשה.",
      success: false,
    };
  }

  revalidatePath(ROUTES.studentHome);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHomework);
  revalidatePath(ROUTES.teacherHomework);

  return {
    homeworkId,
    submissionId: result.submissionId,
    success: true,
    userId: result.userId,
  };
}

export async function deleteHomeworkFileAction(
  formData: FormData,
): Promise<HomeworkFileActionState> {
  const fileId = getString(formData, "fileId");

  if (!fileId) {
    return {
      error: "לא הצלחנו להסיר את הצילום. נסה שוב.",
      success: false,
    };
  }

  const result = await deleteHomeworkFile(fileId);

  if (!result.success) {
    return {
      error:
        result.errorMessage ?? "לא הצלחנו להסיר את הצילום. נסה שוב.",
      success: false,
    };
  }

  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHomework);
  revalidatePath(ROUTES.studentHome);
  revalidatePath(ROUTES.teacherHomework);

  return { success: true };
}
