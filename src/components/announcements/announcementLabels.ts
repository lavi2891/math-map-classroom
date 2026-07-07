import type { Announcement, AnnouncementCategory } from "@/types";

export const announcementCategoryLabels: Record<AnnouncementCategory, string> = {
  exam: "מבחן",
  general: "כללי",
  material: "חומר לימוד",
  reminder: "תזכורת",
};

export function getAnnouncementStatusLabel(announcement: Announcement) {
  const now = Date.now();
  const visibleFrom = Date.parse(announcement.visibleFrom);
  const visibleUntil = announcement.visibleUntil
    ? Date.parse(announcement.visibleUntil)
    : undefined;

  if (announcement.deletedAt) {
    return "נמחקה";
  }

  if (announcement.isHidden) {
    return "מוסתרת";
  }

  if (visibleFrom > now) {
    return "עתידית";
  }

  if (visibleUntil && visibleUntil < now) {
    return "פגה";
  }

  return "גלויה";
}

export function formatDateTimeInput(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}
