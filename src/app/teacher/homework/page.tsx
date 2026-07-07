import { PageHeader } from "@/components/app/PageHeader";
import { TeacherHomeworkPanel } from "@/components/teacher/TeacherHomeworkPanel";
import {
  getManageableHomeworkClasses,
  getTeacherHomeworkAssignments,
} from "@/lib/db/homework";

export default async function TeacherHomeworkPage() {
  const [classes, assignments] = await Promise.all([
    getManageableHomeworkClasses(),
    getTeacherHomeworkAssignments(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="משימות"
        title="שיעורי בית"
        description="משימות בכיתות שבהן יש לך הרשאת ניהול."
      />

      <TeacherHomeworkPanel assignments={assignments} classes={classes} />
    </div>
  );
}
