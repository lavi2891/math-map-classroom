import { EmptyState } from "@/components/app/EmptyState";
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard";
import type { Announcement } from "@/types";

type StudentClassFeedProps = {
  announcements: Announcement[];
};

export function StudentClassFeed({ announcements }: StudentClassFeedProps) {
  if (announcements.length === 0) {
    return (
      <EmptyState
        title="אין הודעות להצגה"
        description="הודעות מהמורה יופיעו כאן כאשר יהיו זמינות."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {announcements.map((announcement) => (
        <StudentAnnouncementCard
          announcement={announcement}
          key={`announcement-${announcement.id}`}
        />
      ))}
    </div>
  );
}
