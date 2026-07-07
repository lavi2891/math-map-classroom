import Link from "next/link";
import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard";
import { StudentHomeworkCard } from "@/components/student/StudentHomeworkCard";
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

      <section className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-stone-950">שיעורי בית פתוחים</h2>
          <Link
            className="text-sm font-bold text-teal-700 hover:text-teal-800"
            href="/student/class#homework-history"
          >
            היסטוריית שיעורי בית
          </Link>
        </div>
        {homework.length > 0 ? (
          homework.map((assignment) => (
            <StudentHomeworkCard assignment={assignment} key={assignment.id} />
          ))
        ) : (
          <EmptyState
            title="אין שיעורי בית פתוחים כרגע."
            description="משימות פתוחות יופיעו כאן."
          />
        )}
      </section>
    </div>
  );
}
