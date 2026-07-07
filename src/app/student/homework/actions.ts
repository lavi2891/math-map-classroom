"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import { upsertHomeworkSubmission } from "@/lib/db/homework";
import type { HomeworkStatus, UnderstandingLevel } from "@/types";

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

export async function submitHomework(formData: FormData) {
  const homeworkId = getString(formData, "homeworkId");
  const status = getString(formData, "status");
  const understanding = getString(formData, "understanding");
  const note = getString(formData, "note");

  if (
    !homeworkId ||
    !isHomeworkStatus(status) ||
    !isUnderstandingLevel(understanding)
  ) {
    return;
  }

  await upsertHomeworkSubmission({
    homeworkId,
    note,
    status,
    understanding,
  });

  revalidatePath(ROUTES.studentHome);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.teacherHomework);
}
