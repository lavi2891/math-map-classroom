"use client";

import { useState } from "react";
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

function AnnouncementActions({
  announcement,
  onDeleteRequest,
  onEdit,
}: {
  announcement: Announcement;
  onDeleteRequest: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="min-h-10 rounded-md border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
        onClick={onEdit}
        type="button"
      >
        עריכה
      </button>
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
      <button
        className="min-h-10 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
        onClick={onDeleteRequest}
        type="button"
      >
        מחק
      </button>
    </div>
  );
}

function DeleteAnnouncementDialog({
  announcement,
  onCancel,
}: {
  announcement: Announcement;
  onCancel: () => void;
}) {
  return (
    <div
      aria-labelledby="delete-announcement-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
        <h2
          className="text-lg font-bold text-stone-950"
          id="delete-announcement-title"
        >
          למחוק את ההודעה?
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          ההודעה תוסר מהכיתה והתלמידים לא יוכלו לראות אותה. לא ניתן לשחזר אותה
          מהממשק כרגע.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            onClick={onCancel}
            type="button"
          >
            ביטול
          </button>
          <form action={deleteAnnouncementAction}>
            <input name="announcementId" type="hidden" value={announcement.id} />
            <button
              className="min-h-11 w-full rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 sm:w-auto"
              type="submit"
            >
              מחק
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function TeacherAnnouncementsPanel({
  announcements,
  classes,
}: TeacherAnnouncementsPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<
    string | null
  >(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(
    null,
  );
  const deleteAnnouncement =
    announcements.find((announcement) => announcement.id === deleteAnnouncementId) ??
    null;

  if (classes.length === 0) {
    return (
      <EmptyState
        title="אין כיתות לניהול"
        description="רק בעלים ומורים של כיתה יכולים לנהל הודעות."
      />
    );
  }

  return (
    <div className="grid gap-4" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 sm:self-start"
          onClick={() => {
            setEditingAnnouncementId(null);
            setIsCreateOpen((current) => !current);
          }}
          type="button"
        >
          + הודעה חדשה
        </button>
      </div>

      {isCreateOpen ? (
        <Card title="הודעה חדשה">
          <AnnouncementForm
            action={createAnnouncementAction}
            classes={classes}
            onCancel={() => setIsCreateOpen(false)}
            submitLabel="פרסם הודעה"
          />
        </Card>
      ) : null}

      <div className="grid gap-3">
        {announcements.length > 0 ? (
          announcements.map((announcement) => {
            const isEditing = editingAnnouncementId === announcement.id;

            return (
              <Card
                key={announcement.id}
                title={announcement.title}
                description={`כיתה ${announcement.className ?? ""}`}
              >
                {isEditing ? (
                  <AnnouncementForm
                    action={updateAnnouncementAction}
                    announcement={announcement}
                    classes={classes}
                    onCancel={() => setEditingAnnouncementId(null)}
                    submitLabel="שמור שינויים"
                  />
                ) : (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2 text-sm font-semibold text-stone-700">
                      <span>
                        {announcementCategoryLabels[announcement.category]}
                      </span>
                      <span>
                        {announcement.isPinned ? "נעוצה" : "לא נעוצה"}
                      </span>
                      <span>{getAnnouncementStatusLabel(announcement)}</span>
                    </div>
                    <ReadCount announcement={announcement} />
                    <AnnouncementPlainBody body={announcement.body} />
                    <AnnouncementLinks links={announcement.links} />
                    {announcement.readDetails ? (
                      <AnnouncementReadDetails details={announcement.readDetails} />
                    ) : null}
                    <AnnouncementActions
                      announcement={announcement}
                      onDeleteRequest={() =>
                        setDeleteAnnouncementId(announcement.id)
                      }
                      onEdit={() => {
                        setIsCreateOpen(false);
                        setEditingAnnouncementId(announcement.id);
                      }}
                    />
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <EmptyState
            title="אין הודעות להצגה"
            description="הודעות לכיתות שבהן יש לך הרשאת ניהול יופיעו כאן."
          />
        )}
      </div>

      {deleteAnnouncement ? (
        <DeleteAnnouncementDialog
          announcement={deleteAnnouncement}
          onCancel={() => setDeleteAnnouncementId(null)}
        />
      ) : null}
    </div>
  );
}
