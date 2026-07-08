import Link from "next/link";
import { Card } from "@/components/app/Card";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ROUTES } from "@/lib/constants/routes";
import type { Announcement, HomeworkAssignment } from "@/types";

type StudentHomeDashboardProps = {
  announcements: Announcement[];
  homework: HomeworkAssignment[];
};

function needsHomeworkAction(assignment: HomeworkAssignment) {
  const fileCount = assignment.submission?.files?.length ?? 0;

  return (
    assignment.canSubmit &&
    (!assignment.submission ||
      assignment.submission.status !== "done" ||
      (assignment.requirePhoto && fileCount === 0))
  );
}

function getSortDate(value?: string) {
  return value ? Date.parse(value) : Number.MAX_SAFE_INTEGER;
}

function getImportantAnnouncement(announcements: Announcement[]) {
  return (
    announcements.find(
      (announcement) =>
        announcement.isPinned &&
        announcement.requireReadConfirmation &&
        !announcement.readAt,
    ) ??
    [...announcements].sort(
      (a, b) => Date.parse(b.visibleFrom) - Date.parse(a.visibleFrom),
    )[0]
  );
}

function getUrgentHomework(homework: HomeworkAssignment[]) {
  const actionNeeded = homework.filter(needsHomeworkAction);
  const candidates = actionNeeded.length > 0 ? actionNeeded : homework;

  return [...candidates].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }

    return getSortDate(a.dueAt) - getSortDate(b.dueAt);
  })[0];
}

export function StudentHomeDashboard({
  announcements,
  homework,
}: StudentHomeDashboardProps) {
  const importantAnnouncement = getImportantAnnouncement(announcements);
  const urgentHomework = getUrgentHomework(homework);
  const unreadRequiredCount = announcements.filter(
    (announcement) =>
      announcement.requireReadConfirmation && !announcement.readAt,
  ).length;
  const openHomeworkCount = homework.filter(needsHomeworkAction).length;

  return (
    <div className="grid gap-3">
      <Card
        title="מה עכשיו?"
        description="הדברים החשובים ביותר לכיתה הנוכחית."
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="font-bold text-stone-950">{openHomeworkCount}</p>
            <p className="text-stone-600">מטלות פתוחות</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="font-bold text-stone-950">{unreadRequiredCount}</p>
            <p className="text-stone-600">אישורי קריאה</p>
          </div>
        </div>
      </Card>

      <Card
        title="הודעה חשובה"
        action={
          <Link className="text-sm font-bold text-teal-700" href={ROUTES.studentAnnouncements}>
            לכל ההודעות
          </Link>
        }
      >
        {importantAnnouncement ? (
          <div className="grid gap-2 text-sm text-stone-700">
            <div className="flex flex-wrap gap-2">
              {importantAnnouncement.isPinned ? (
                <StatusBadge tone="warning">נעוץ</StatusBadge>
              ) : null}
              {importantAnnouncement.requireReadConfirmation &&
              !importantAnnouncement.readAt ? (
                <StatusBadge tone="warning">דורש אישור קריאה</StatusBadge>
              ) : null}
            </div>
            <p className="font-bold text-stone-950">
              {importantAnnouncement.title}
            </p>
            <p className="line-clamp-2 leading-6">{importantAnnouncement.body}</p>
          </div>
        ) : (
          <p className="text-sm text-stone-600">אין הודעות חדשות.</p>
        )}
      </Card>

      <Card
        title="מטלה דחופה"
        action={
          <Link className="text-sm font-bold text-teal-700" href={ROUTES.studentHomework}>
            לכל המטלות
          </Link>
        }
      >
        {urgentHomework ? (
          <div className="grid gap-2 text-sm text-stone-700">
            <p className="font-bold text-stone-950">{urgentHomework.title}</p>
            <p>תאריך יעד: {urgentHomework.dueDate ?? "אין תאריך יעד"}</p>
            {urgentHomework.isOverdue ? (
              <StatusBadge tone={urgentHomework.canSubmit ? "warning" : "danger"}>
                {urgentHomework.canSubmit
                  ? "אפשר להגיש באיחור"
                  : "לא ניתן להגיש"}
              </StatusBadge>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-stone-600">אין מטלות פתוחות כרגע.</p>
        )}
      </Card>

      <Card
        title="תרגול מומלץ"
        description="תרגול קצר לפי מצב הלמידה הנוכחי."
        action={
          <Link className="text-sm font-bold text-teal-700" href={ROUTES.studentPractice}>
            תרגול מהיר
          </Link>
        }
      />
    </div>
  );
}
