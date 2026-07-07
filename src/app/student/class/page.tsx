import { PageHeader } from "@/components/app/PageHeader";
import { StudentClassFeed } from "@/components/student/StudentClassFeed";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getStudentClasses } from "@/lib/db/classes";
import { getStudentHomeworkAssignments } from "@/lib/db/homework";

export default async function StudentClassPage() {
  const classes = await getStudentClasses();
  const classIds = classes.map((classSummary) => classSummary.id);
  const [announcements, homework] = await Promise.all([
    getStudentAnnouncements(classIds),
    getStudentHomeworkAssignments(classIds),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="כיתה"
        title="כיתה"
        description="הודעות ושיעורי בית מהכיתות הפעילות שלך."
      />
      <StudentClassFeed announcements={announcements} homework={homework} />
    </div>
  );
}
