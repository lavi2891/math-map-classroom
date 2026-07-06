import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { TeacherClassCard } from "@/components/teacher/TeacherClassCard";
import { getTeacherClasses } from "@/lib/db/classes";

export default async function TeacherClassesPage() {
  const classes = await getTeacherClasses();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מורה"
        title="כיתות"
        description="כיתות שבהן יש לך תפקיד בעלים, מורה או צפייה."
      />

      <div className="grid gap-3">
        {classes.length > 0 ? (
          classes.map((summary) => (
            <TeacherClassCard key={summary.id} summary={summary} />
          ))
        ) : (
          <EmptyState
            title="אין כיתות להצגה"
            description="כיתות שבהן יש לך שיוך צוות יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
