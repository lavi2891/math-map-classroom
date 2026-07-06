import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { HomeworkCard } from "@/components/homework/HomeworkCard";
import { getHomeworkAssignments } from "@/lib/db/homework";

export default async function TeacherHomeworkPage() {
  const assignments = await getHomeworkAssignments();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="משימות"
        title="שיעורי בית"
        description="משימות פתוחות, מועדי הגשה ומעקב השלמה."
      />

      <div className="grid gap-3">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <HomeworkCard key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <EmptyState
            title="אין שיעורי בית להצגה"
            description="שיעורי בית לכיתות שלך יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
