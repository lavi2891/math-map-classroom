import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { ClassSummary } from "@/types";

type TeacherClassCardProps = {
  summary: ClassSummary;
};

export function TeacherClassCard({ summary }: TeacherClassCardProps) {
  return (
    <Card
      title={`כיתה ${summary.name}`}
      description={`${summary.studentCount} תלמידים · מוקד: ${summary.focus}`}
      action={<PrimaryButton>פתיחת כיתה</PrimaryButton>}
    />
  );
}
