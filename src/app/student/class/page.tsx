import { PageHeader } from "@/components/app/PageHeader";
import { StudentClassFeed } from "@/components/student/StudentClassFeed";
import { StudentHomeworkHistory } from "@/components/student/StudentHomeworkHistory";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getStudentClasses } from "@/lib/db/classes";
import {
  getOpenStudentHomework,
  getStudentHomeworkHistory,
} from "@/lib/db/homework";

const HOMEWORK_HISTORY_LIMIT = 100;

export default async function StudentClassPage() {
  const classes = await getStudentClasses();
  const classIds = classes.map((classSummary) => classSummary.id);
  const [announcements, homework, homeworkHistory] = await Promise.all([
    getStudentAnnouncements(classIds, 10),
    getOpenStudentHomework(10, classIds),
    getStudentHomeworkHistory(HOMEWORK_HISTORY_LIMIT, classIds),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="כיתה"
        title="כיתה"
        description="הודעות ושיעורי בית מהכיתות הפעילות שלך."
      />
      <StudentClassFeed announcements={announcements} homework={homework} />
      <StudentHomeworkHistory assignments={homeworkHistory} />
    </div>
  );
}
