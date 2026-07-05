import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";

export function HomeworkSubmissionForm() {
  return (
    <Card
      title="הגשת שיעורי בית"
      description="בעתיד תלמידים יוכלו להוסיף פתרון או הערה למורה."
      action={<PrimaryButton disabled>הגשה בקרוב</PrimaryButton>}
    />
  );
}
