import { PageHeader } from "@/components/app/PageHeader";
import { StudentHomeDashboard } from "@/components/student/StudentHomeDashboard";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getSelectedStudentClass } from "@/lib/db/classes";
import { getStudentHomeworkList } from "@/lib/db/homework";

const STUDENT_HOME_SUMMARY_LIMIT = 100;

export default async function StudentHomePage() {
  const user = await getCurrentUser();
  const { selectedClass } = user
    ? await getSelectedStudentClass(user.id)
    : { selectedClass: undefined };
  const selectedClassIds = selectedClass ? [selectedClass.id] : [];
  const [announcements, homework] = await Promise.all([
    getStudentAnnouncements(selectedClassIds, STUDENT_HOME_SUMMARY_LIMIT),
    getStudentHomeworkList(STUDENT_HOME_SUMMARY_LIMIT, selectedClassIds),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תלמיד/ה"
        title="בית"
        description="הכיתות שלך, הודעות אחרונות ושיעורי בית."
      />
      <StudentHomeDashboard announcements={announcements} homework={homework} />
    </div>
  );
}
