import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { HomeworkAssignment } from "@/types";

type HomeworkCardProps = {
  assignment: HomeworkAssignment;
};

export function HomeworkCard({ assignment }: HomeworkCardProps) {
  return (
    <Card
      title={assignment.title}
      description={`להגשה: ${assignment.dueDate ?? "אין תאריך הגשה"}`}
      action={<PrimaryButton>ניהול משימה</PrimaryButton>}
    >
      <div className="grid gap-1 text-sm text-stone-600">
        {assignment.className ? <p>כיתה: {assignment.className}</p> : null}
        <p>הגשות: {assignment.submissionCount ?? 0}</p>
        <p>סיימו: {assignment.doneCount ?? 0}</p>
        <p>הבנה חלקית: {assignment.partialUnderstandingCount ?? 0}</p>
        <p>לא הבינו: {assignment.noUnderstandingCount ?? 0}</p>
      </div>
    </Card>
  );
}
