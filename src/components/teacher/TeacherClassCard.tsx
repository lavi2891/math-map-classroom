import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { ClassSummary } from "@/types";

type TeacherClassCardProps = {
  summary: ClassSummary;
};

const roleLabel: Record<string, string> = {
  owner: "בעלים",
  teacher: "מורה",
  viewer: "צפייה",
};

export function TeacherClassCard({ summary }: TeacherClassCardProps) {
  return (
    <Card
      title={`כיתה ${summary.name}`}
      description={`שכבה ${summary.grade} · קוד ${summary.classCode}`}
      action={<PrimaryButton>פתיחת כיתה</PrimaryButton>}
    >
      <div className="grid gap-1 text-sm text-stone-600">
        <p>תפקיד בכיתה: {roleLabel[summary.role ?? ""] ?? summary.role}</p>
        <p>תלמידים פעילים: {summary.studentCount}</p>
      </div>
    </Card>
  );
}
