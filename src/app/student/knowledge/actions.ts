"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { upsertStudentSkillSelfAssessment } from "@/lib/db/knowledge";
import type { UnderstandingLevel } from "@/types";

const LEVELS: UnderstandingLevel[] = ["good", "partial", "no", "unknown"];

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getLevel(value: string): UnderstandingLevel | null {
  return LEVELS.includes(value as UnderstandingLevel)
    ? (value as UnderstandingLevel)
    : null;
}

export async function updateSkillSelfAssessmentAction(formData: FormData) {
  const user = await getCurrentUser();
  const classId = getString(formData, "classId");
  const skillId = getString(formData, "skillId");
  const level = getLevel(getString(formData, "level"));

  if (!user || !classId || !skillId || !level) {
    return;
  }

  const success = await upsertStudentSkillSelfAssessment(
    classId,
    user.id,
    skillId,
    level,
  );

  if (success) {
    revalidatePath("/student/knowledge");
    revalidatePath("/teacher/status");
  }
}
