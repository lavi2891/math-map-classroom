import { PageHeader } from "@/components/app/PageHeader";
import { HomeworkCard } from "@/components/homework/HomeworkCard";
import { getHomeworkAssignments } from "@/lib/db/homework";

export default function TeacherHomeworkPage() {
  const assignments = getHomeworkAssignments();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="משימות"
        title="שיעורי בית"
        description="משימות פתוחות, מועדי הגשה ומעקב השלמה."
      />

      <div className="grid gap-3">
        {assignments.map((assignment) => (
          <HomeworkCard key={assignment.id} assignment={assignment} />
        ))}
      </div>
    </div>
  );
}
