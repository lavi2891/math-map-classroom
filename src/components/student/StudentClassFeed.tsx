import { EmptyState } from "@/components/app/EmptyState";
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard";
import { StudentHomeworkCard } from "@/components/student/StudentHomeworkCard";
import type { Announcement, HomeworkAssignment } from "@/types";

type StudentClassFeedProps = {
  announcements: Announcement[];
  homework: HomeworkAssignment[];
};

export function StudentClassFeed({
  announcements,
  homework,
}: StudentClassFeedProps) {
  const hasFeedItems = announcements.length > 0 || homework.length > 0;

  if (!hasFeedItems) {
    return (
      <EmptyState
        title="אין פעילות להצגה"
        description="הודעות ושיעורי בית יופיעו כאן כאשר יהיו זמינים."
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
      {homework.length > 0 ? (
        homework.map((assignment) => (
          <StudentHomeworkCard
            assignment={assignment}
            key={`homework-${assignment.id}`}
          />
        ))
      ) : (
        <EmptyState
          title="אין שיעורי בית פתוחים כרגע."
          description="שיעורי בית גלויים יופיעו כאן."
        />
      )}
    </div>
  );
}
