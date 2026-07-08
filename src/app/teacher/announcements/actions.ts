"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import {
  createAnnouncement,
  setAnnouncementHidden,
  softDeleteAnnouncement,
  updateAnnouncement,
  type AnnouncementInput,
  type AnnouncementLinkInput,
} from "@/lib/db/announcements";
import type { AnnouncementCategory } from "@/types";

export type AnnouncementActionState = {
  error?: string;
  success: boolean;
};

const CATEGORIES: AnnouncementCategory[] = [
  "general",
  "exam",
  "reminder",
  "material",
];

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

function getCategory(value: string): AnnouncementCategory {
  return CATEGORIES.includes(value as AnnouncementCategory)
    ? (value as AnnouncementCategory)
    : "general";
}

function getDateTime(formData: FormData, field: string) {
  const value = getString(formData, field);

  return value ? new Date(value).toISOString() : undefined;
}

function getLinks(formData: FormData): AnnouncementLinkInput[] {
  const titles = formData.getAll("linkTitle");
  const urls = formData.getAll("linkUrl");

  return titles.flatMap<AnnouncementLinkInput>((title, index) => {
    const linkTitle = typeof title === "string" ? title.trim() : "";
    const url = typeof urls[index] === "string" ? urls[index].trim() : "";

    return linkTitle && url ? [{ title: linkTitle, url }] : [];
  });
}

function getAnnouncementInput(formData: FormData): AnnouncementInput | null {
  const classId = getString(formData, "classId");
  const title = getString(formData, "title");
  const body = getString(formData, "body");

  if (!classId || !title || !body) {
    return null;
  }

  return {
    body,
    category: getCategory(getString(formData, "category")),
    classId,
    isHidden: getBoolean(formData, "isHidden"),
    isPinned: getBoolean(formData, "isPinned"),
    links: getLinks(formData),
    requireReadConfirmation: getBoolean(formData, "requireReadConfirmation"),
    title,
    visibleFrom: getDateTime(formData, "visibleFrom"),
    visibleUntil: getDateTime(formData, "visibleUntil"),
  };
}

export async function createAnnouncementAction(
  _state: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const input = getAnnouncementInput(formData);

  if (!input) {
    return {
      error: "חסרים פרטים לשמירת ההודעה.",
      success: false,
    };
  }

  const success = await createAnnouncement(input);

  if (!success) {
    return {
      error: "לא הצלחנו לשמור את ההודעה.",
      success: false,
    };
  }

  revalidatePath(ROUTES.teacherAnnouncements);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentAnnouncements);
  revalidatePath(ROUTES.studentHome);

  return { success: true };
}

export async function updateAnnouncementAction(
  _state: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const id = getString(formData, "announcementId");
  const input = getAnnouncementInput(formData);

  if (!id || !input) {
    return {
      error: "חסרים פרטים לשמירת ההודעה.",
      success: false,
    };
  }

  const success = await updateAnnouncement(id, input);

  if (!success) {
    return {
      error: "לא הצלחנו לשמור את ההודעה.",
      success: false,
    };
  }

  revalidatePath(ROUTES.teacherAnnouncements);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentAnnouncements);
  revalidatePath(ROUTES.studentHome);

  return { success: true };
}

export async function hideAnnouncementAction(formData: FormData) {
  const id = getString(formData, "announcementId");

  if (id) {
    await setAnnouncementHidden(id, true);
  }

  revalidatePath(ROUTES.teacherAnnouncements);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentAnnouncements);
  revalidatePath(ROUTES.studentHome);
}

export async function unhideAnnouncementAction(formData: FormData) {
  const id = getString(formData, "announcementId");

  if (id) {
    await setAnnouncementHidden(id, false);
  }

  revalidatePath(ROUTES.teacherAnnouncements);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentAnnouncements);
  revalidatePath(ROUTES.studentHome);
}

export async function deleteAnnouncementAction(formData: FormData) {
  const id = getString(formData, "announcementId");

  if (id) {
    await softDeleteAnnouncement(id);
  }

  revalidatePath(ROUTES.teacherAnnouncements);
  revalidatePath(ROUTES.studentClass);
  revalidatePath(ROUTES.studentAnnouncements);
  revalidatePath(ROUTES.studentHome);
}
