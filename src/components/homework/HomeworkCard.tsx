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
      description={`להגשה: ${assignment.dueDate}`}
      action={<PrimaryButton>ניהול משימה</PrimaryButton>}
    >
      <p className="text-sm text-stone-600">
        הושלם: {assignment.completedCount}/{assignment.totalCount}
      </p>
    </Card>
  );
}
