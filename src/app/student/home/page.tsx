import { PageHeader } from "@/components/app/PageHeader";
import { StudentHomeFeed } from "@/components/student/StudentHomeFeed";
import { getLatestStudentAnnouncements } from "@/lib/db/announcements";
import { getStudentClasses } from "@/lib/db/classes";
import { getOpenStudentHomework } from "@/lib/db/homework";

export default async function StudentHomePage() {
  const [classes, announcements, homework] = await Promise.all([
    getStudentClasses(),
    getLatestStudentAnnouncements(),
    getOpenStudentHomework(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תלמיד/ה"
        title="בית"
        description="הכיתות שלך, הודעות אחרונות ושיעורי בית פתוחים."
      />
      <StudentHomeFeed
        announcements={announcements}
        classes={classes}
        homework={homework}
      />
    </div>
  );
}
