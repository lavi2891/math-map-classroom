"use server";

import { revalidatePath } from "next/cache";
import { markSkillTaught, unmarkSkillTaught } from "@/lib/db/knowledge";

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

export async function markSkillTaughtAction(formData: FormData) {
  const classId = getString(formData, "classId");
  const skillId = getString(formData, "skillId");

  if (!classId || !skillId) {
    return;
  }

  const success = await markSkillTaught(classId, skillId);

  if (success) {
    revalidatePath("/teacher/status");
    revalidatePath("/student/knowledge");
  }
}

export async function unmarkSkillTaughtAction(formData: FormData) {
  const classId = getString(formData, "classId");
  const skillId = getString(formData, "skillId");

  if (!classId || !skillId) {
    return;
  }

  const success = await unmarkSkillTaught(classId, skillId);

  if (success) {
    revalidatePath("/teacher/status");
    revalidatePath("/student/knowledge");
  }
}
