import { PageHeader } from "@/components/app/PageHeader";
import { StudentHomeFeed } from "@/components/student/StudentHomeFeed";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getSelectedStudentClass } from "@/lib/db/classes";
import { getStudentHomeworkList } from "@/lib/db/homework";

const STUDENT_HOME_PREVIEW_LIMIT = 3;

export default async function StudentHomePage() {
  const user = await getCurrentUser();
  const { classes, selectedClass } = user
    ? await getSelectedStudentClass(user.id)
    : { classes: [], selectedClass: undefined };
  const selectedClassIds = selectedClass ? [selectedClass.id] : [];
  const [announcements, homework] = await Promise.all([
    getStudentAnnouncements(selectedClassIds, STUDENT_HOME_PREVIEW_LIMIT),
    getStudentHomeworkList(STUDENT_HOME_PREVIEW_LIMIT, selectedClassIds),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תלמיד/ה"
        title="בית"
        description="הכיתות שלך, הודעות אחרונות ושיעורי בית."
      />
      <StudentHomeFeed
        announcements={announcements}
        classes={classes}
        homework={homework}
      />
    </div>
  );
}
