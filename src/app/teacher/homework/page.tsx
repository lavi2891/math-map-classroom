import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { HomeworkCard } from "@/components/homework/HomeworkCard";
import { getManageableHomeworkAssignments } from "@/lib/db/homework";

export default async function TeacherHomeworkPage() {
  const assignments = await getManageableHomeworkAssignments();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="משימות"
        title="שיעורי בית"
        description="משימות בכיתות שבהן יש לך הרשאת ניהול."
      />

      <div className="grid gap-3">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <HomeworkCard key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <EmptyState
            title="אין שיעורי בית להצגה"
            description="שיעורי בית לכיתות שבהן יש לך הרשאת ניהול יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
