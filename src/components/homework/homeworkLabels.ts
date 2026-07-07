import type { StatusBadgeTone } from "@/components/app/StatusBadge";
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
  unknown: "לא דווח",
};

export function getHomeworkStatusLabel(status?: HomeworkStatus) {
  return status ? homeworkStatusLabels[status] : "לא הוגש";
}

export function getHomeworkStatusTone(status?: HomeworkStatus): StatusBadgeTone {
  if (status === "done") {
    return "success";
  }

  if (status === "started") {
    return "warning";
  }

  return "danger";
}

export function getUnderstandingLabel(understanding?: UnderstandingLevel) {
  return understanding ? understandingLabels[understanding] : "לא דווח";
}

export function getUnderstandingTone(
  understanding?: UnderstandingLevel,
): StatusBadgeTone {
  if (understanding === "good") {
    return "success";
  }

  if (understanding === "partial") {
    return "warning";
  }

  if (understanding === "no") {
    return "danger";
  }

  return "neutral";
}

export function getHomeworkVisibilityLabel(assignment: HomeworkAssignment) {
  const visibleFrom = Date.parse(assignment.visibleFrom);

  if (assignment.deletedAt) {
    return "נמחק";
  }

  if (assignment.isHidden) {
    return "מוסתר";
  }

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
