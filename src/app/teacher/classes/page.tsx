import { PageHeader } from "@/components/app/PageHeader";
import { TeacherClassCard } from "@/components/teacher/TeacherClassCard";
import { getTeacherClasses } from "@/lib/db/classes";

export default function TeacherClassesPage() {
  const classes = getTeacherClasses();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מורה"
        title="כיתות"
        description="סקירה מהירה של כיתות פעילות ומוקדי למידה."
      />

      <div className="grid gap-3">
        {classes.map((summary) => (
          <TeacherClassCard key={summary.id} summary={summary} />
        ))}
      </div>
    </div>
  );
}
