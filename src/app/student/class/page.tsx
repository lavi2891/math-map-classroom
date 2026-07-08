import { PageHeader } from "@/components/app/PageHeader";
import { StudentClassFeed } from "@/components/student/StudentClassFeed";
import { StudentHomeworkList } from "@/components/student/StudentHomeworkList";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getSelectedStudentClass } from "@/lib/db/classes";
import { getStudentHomeworkList } from "@/lib/db/homework";

const HOMEWORK_LIST_LIMIT = 100;

export default async function StudentClassPage() {
  const user = await getCurrentUser();
  const { selectedClass } = user
    ? await getSelectedStudentClass(user.id)
    : { selectedClass: undefined };
  const classIds = selectedClass ? [selectedClass.id] : [];
  const [announcements, homework] = await Promise.all([
    getStudentAnnouncements(classIds, 10),
    getStudentHomeworkList(HOMEWORK_LIST_LIMIT, classIds),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="כיתה"
        title="כיתה"
        description="הודעות ושיעורי בית מהכיתות הפעילות שלך."
      />
      <StudentClassFeed announcements={announcements} />
      <StudentHomeworkList assignments={homework} />
    </div>
  );
}
