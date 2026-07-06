import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
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
            <Card
              key={announcement.id}
              title={announcement.title}
              description={`${announcement.body} ${announcement.audience}`}
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
        <h2 className="text-lg font-bold text-stone-950">שיעורי בית פתוחים</h2>
        {homework.length > 0 ? (
          homework.map((assignment) => (
            <Card
              key={assignment.id}
              title={assignment.title}
              description={`${assignment.description ?? ""} להגשה: ${
                assignment.dueDate ?? "אין תאריך"
              }`}
            />
          ))
        ) : (
          <EmptyState
            title="אין שיעורי בית פתוחים"
            description="משימות פתוחות יופיעו כאן."
          />
        )}
      </section>
    </div>
  );
}
