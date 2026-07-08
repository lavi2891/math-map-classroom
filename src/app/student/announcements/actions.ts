"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import { markAnnouncementRead } from "@/lib/db/announcements";

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

export async function markAnnouncementReadAction(formData: FormData) {
  const id = getString(formData, "announcementId");

  if (id) {
    await markAnnouncementRead(id);
  }

  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentHome);
  revalidatePath(ROUTES.studentAnnouncements);
}
