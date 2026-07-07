"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HomeworkStatus, UnderstandingLevel } from "@/types";

const HOMEWORK_BUCKET = "homework-submissions";
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

function getOptionalImage(formData: FormData) {
  const value = formData.get("photo");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  if (!value.type.startsWith("image/")) {
    return null;
  }

  return value;
}

function getSafeFileName(fileName: string) {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "homework-photo";
}

function getStoragePath(userId: string, homeworkId: string, fileName: string) {
  return `${userId}/${homeworkId}/${Date.now()}-${getSafeFileName(fileName)}`;
}

function isHomeworkStatus(value: string): value is HomeworkStatus {
  return HOMEWORK_STATUSES.includes(value as HomeworkStatus);
}

function isUnderstandingLevel(value: string): value is UnderstandingLevel {
  return UNDERSTANDING_LEVELS.includes(value as UnderstandingLevel);
}

export async function submitHomework(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const homeworkId = getString(formData, "homeworkId");
  const status = getString(formData, "status");
  const understanding = getString(formData, "understanding");
  const note = getString(formData, "note");
  const photo = getOptionalImage(formData);

  if (
    !homeworkId ||
    !isHomeworkStatus(status) ||
    !isUnderstandingLevel(understanding)
  ) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: submission, error: submissionError } = await supabase
    .from("homework_submissions")
    .upsert(
      {
        homework_id: homeworkId,
        note: note || null,
        status,
        student_id: user.id,
        submitted_at: status === "done" ? new Date().toISOString() : null,
        understanding,
      },
      {
        onConflict: "homework_id,student_id",
      },
    )
    .select("id")
    .single();

  if (submissionError || !submission || !photo) {
    revalidatePath(ROUTES.studentHome);
    revalidatePath(ROUTES.studentClass);
    return;
  }

  const filePath = getStoragePath(user.id, homeworkId, photo.name);
  const { error: uploadError } = await supabase.storage
    .from(HOMEWORK_BUCKET)
    .upload(filePath, photo, {
      contentType: photo.type,
      upsert: false,
    });

  if (!uploadError) {
    await supabase.from("homework_files").insert({
      file_name: photo.name,
      file_path: filePath,
      mime_type: photo.type,
      size_bytes: photo.size,
      submission_id: submission.id,
    });
  }

  revalidatePath(ROUTES.studentHome);
  revalidatePath(ROUTES.studentClass);
}
