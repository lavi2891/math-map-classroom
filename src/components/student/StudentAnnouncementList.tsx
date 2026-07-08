"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard";
import type { Announcement } from "@/types";

type StudentAnnouncementListProps = {
  announcements: Announcement[];
  initialCount?: number;
};

const DEFAULT_ANNOUNCEMENT_PAGE_SIZE = 10;

export function StudentAnnouncementList({
  announcements,
  initialCount = DEFAULT_ANNOUNCEMENT_PAGE_SIZE,
}: StudentAnnouncementListProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visibleAnnouncements = useMemo(
    () => announcements.slice(0, visibleCount),
    [announcements, visibleCount],
  );
  const hasMore = visibleCount < announcements.length;

  if (announcements.length === 0) {
    return (
      <EmptyState
        title="אין הודעות להצגה"
        description="הודעות מהמורה יופיעו כאן."
      />
    );
  }

  return (
    <section className="grid gap-3">
      {visibleAnnouncements.map((announcement) => (
        <StudentAnnouncementCard
          announcement={announcement}
          key={announcement.id}
        />
      ))}
      {hasMore ? (
        <button
          className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-stone-50 sm:w-fit"
          onClick={() =>
            setVisibleCount((current) => current + DEFAULT_ANNOUNCEMENT_PAGE_SIZE)
          }
          type="button"
        >
          טען עוד הודעות ישנות
        </button>
      ) : null}
    </section>
  );
}
