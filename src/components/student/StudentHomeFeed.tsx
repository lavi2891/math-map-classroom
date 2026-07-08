import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard";
import { StudentHomeworkList } from "@/components/student/StudentHomeworkList";
import type { Announcement, ClassSummary, HomeworkAssignment } from "@/types";

type StudentHomeFeedProps = {
  announcements: Announcement[];
  classes: ClassSummary[];
  homework: HomeworkAssignment[];
};

export function StudentHomeFeed({
  announcements,
  classes,
  homework,
}: StudentHomeFeedProps) {
  return (
    <div className="grid gap-3">
      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-stone-950">הכיתות שלי</h2>
        {classes.length > 0 ? (
          classes.map((classSummary) => (
            <Card
              key={classSummary.id}
              title={`כיתה ${classSummary.name}`}
              description={`שכבה ${classSummary.grade} · קוד ${classSummary.classCode}`}
            />
          ))
        ) : (
          <EmptyState
            title="אין כיתות פעילות"
            description="לא נמצאו כיתות פעילות לחשבון הזה."
          />
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-stone-950">הודעות אחרונות</h2>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <StudentAnnouncementCard
              announcement={announcement}
              key={announcement.id}
            />
          ))
        ) : (
          <EmptyState
            title="אין הודעות חדשות"
            description="הודעות מהמורה יופיעו כאן."
          />
        )}
      </section>

      <StudentHomeworkList
        assignments={homework}
        enableLoadMore={false}
        initialCount={3}
      />
    </div>
  );
}
