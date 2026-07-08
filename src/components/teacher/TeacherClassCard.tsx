import Link from "next/link";
import { Card } from "@/components/app/Card";
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
  const canManageStudents = summary.role === "owner" || summary.role === "teacher";

  return (
    <Card
      title={`כיתה ${summary.name}`}
      description={`שכבה ${summary.grade} · קוד ${summary.classCode}`}
      action={
        canManageStudents ? (
          <Link
            className="block min-h-11 rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-teal-800"
            href={`/teacher/classes/${summary.id}/students`}
          >
            ניהול תלמידים
          </Link>
        ) : null
      }
    >
      <div className="grid gap-1 text-sm text-stone-600">
        <p>תפקיד בכיתה: {roleLabel[summary.role ?? ""] ?? summary.role}</p>
        <p>תלמידים פעילים: {summary.studentCount}</p>
      </div>
    </Card>
  );
}
