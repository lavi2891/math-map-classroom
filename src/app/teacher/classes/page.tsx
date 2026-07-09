import { PageHeader } from "@/components/app/PageHeader";
import { TeacherClassesPanel } from "@/components/teacher/TeacherClassesPanel";
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

      <TeacherClassesPanel classes={classes} />
    </div>
  );
}
