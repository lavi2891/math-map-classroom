import type { HomeworkAssignment, HomeworkStatus, UnderstandingLevel } from "@/types";

export const homeworkStatusLabels: Record<HomeworkStatus, string> = {
  done: "סיימתי",
  not_started: "לא התחלתי",
  started: "התחלתי",
};

export const understandingLabels: Record<UnderstandingLevel, string> = {
  good: "הבנתי טוב",
  no: "לא הבנתי",
  partial: "הבנתי חלקית",
  unknown: "לא מסומן",
};

export function getHomeworkVisibilityLabel(assignment: HomeworkAssignment) {
  const visibleFrom = Date.parse(assignment.visibleFrom);

  if (visibleFrom > Date.now()) {
    return "מוסתר בעתיד";
  }

  if (assignment.isOverdue) {
    return "עבר תאריך";
  }

  return "גלוי";
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
