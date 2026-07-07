import { AnnouncementLinks } from "@/components/announcements/AnnouncementLinks";
import { AnnouncementPlainBody } from "@/components/announcements/AnnouncementPlainBody";
import {
  announcementCategoryLabels,
  getAnnouncementStatusLabel,
} from "@/components/announcements/announcementLabels";
import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  hideAnnouncementAction,
  unhideAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/teacher/announcements/actions";
import type { Announcement, ClassSummary } from "@/types";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementReadDetails } from "./AnnouncementReadDetails";

type TeacherAnnouncementsPanelProps = {
  announcements: Announcement[];
  classes: ClassSummary[];
};

function ReadCount({ announcement }: { announcement: Announcement }) {
  if (!announcement.requireReadConfirmation) {
    return null;
  }

  return (
    <p className="text-sm font-bold text-stone-700">
      {announcement.readCount ?? 0}/{announcement.totalStudentCount ?? 0} תלמידים
      סימנו שקראו
    </p>
  );
}

function AnnouncementActions({ announcement }: { announcement: Announcement }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form
        action={
          announcement.isHidden ? unhideAnnouncementAction : hideAnnouncementAction
        }
      >
        <input name="announcementId" type="hidden" value={announcement.id} />
        <button
          className="min-h-10 rounded-md border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
          type="submit"
        >
          {announcement.isHidden ? "בטל הסתרה" : "הסתר"}
        </button>
      </form>
      <form action={deleteAnnouncementAction}>
        <input name="announcementId" type="hidden" value={announcement.id} />
        <button
          className="min-h-10 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
          type="submit"
        >
          מחק
        </button>
      </form>
    </div>
  );
}

export function TeacherAnnouncementsPanel({
  announcements,
  classes,
}: TeacherAnnouncementsPanelProps) {
  if (classes.length === 0) {
    return (
      <EmptyState
        title="אין כיתות לניהול"
        description="רק בעלים ומורים של כיתה יכולים לנהל הודעות."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <Card title="הודעה חדשה">
        <AnnouncementForm
          action={createAnnouncementAction}
          classes={classes}
          submitLabel="פרסם הודעה"
        />
      </Card>

      <div className="grid gap-3">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              title={announcement.title}
              description={`כיתה ${announcement.className ?? ""}`}
            >
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2 text-sm font-semibold text-stone-700">
                  <span>{announcementCategoryLabels[announcement.category]}</span>
                  <span>{announcement.isPinned ? "נעוצה" : "לא נעוצה"}</span>
                  <span>{getAnnouncementStatusLabel(announcement)}</span>
                </div>
                <ReadCount announcement={announcement} />
                <AnnouncementPlainBody body={announcement.body} />
                <AnnouncementLinks links={announcement.links} />
                {announcement.readDetails ? (
                  <AnnouncementReadDetails details={announcement.readDetails} />
                ) : null}
                <AnnouncementActions announcement={announcement} />
                <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-teal-700">
                    עריכת הודעה
                  </summary>
                  <div className="mt-3">
                    <AnnouncementForm
                      action={updateAnnouncementAction}
                      announcement={announcement}
                      classes={classes}
                      submitLabel="שמור שינויים"
                    />
                  </div>
                </details>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="אין הודעות להצגה"
            description="הודעות לכיתות שבהן יש לך הרשאת ניהול יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
