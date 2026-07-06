import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import { HomeworkSubmissionForm } from "@/components/homework/HomeworkSubmissionForm";
import type { Announcement, HomeworkAssignment } from "@/types";

type StudentClassFeedProps = {
  announcements: Announcement[];
  homework: HomeworkAssignment[];
};

function homeworkDescription(assignment: HomeworkAssignment) {
  return `${assignment.description ?? ""} להגשה: ${
    assignment.dueDate ?? "אין תאריך"
  }`;
}

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
        <Card
          key={`announcement-${announcement.id}`}
          title={announcement.title}
          description={`${announcement.body} ${announcement.audience}`}
        />
      ))}
      {homework.map((assignment) => (
        <Card
          key={`homework-${assignment.id}`}
          title={assignment.title}
          description={homeworkDescription(assignment)}
        >
          <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-bold text-teal-700">
              פתח הגשה
            </summary>
            <div className="mt-3">
              <HomeworkSubmissionForm homeworkId={assignment.id} />
            </div>
          </details>
        </Card>
      ))}
    </div>
  );
}
