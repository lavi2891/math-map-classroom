import { PageHeader } from "@/components/app/PageHeader";
import { StudentClassFeed } from "@/components/student/StudentClassFeed";
import { StudentHomeworkHistory } from "@/components/student/StudentHomeworkHistory";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getStudentClasses } from "@/lib/db/classes";
import { getStudentHomeworkHistory } from "@/lib/db/homework";
import type { StudentHomeworkHistoryFilter } from "@/types";

type StudentClassPageProps = {
  searchParams?: Promise<{
    homeworkFilter?: string;
  }>;
};

function getHomeworkFilter(value?: string): StudentHomeworkHistoryFilter {
  if (
    value === "all" ||
    value === "open" ||
    value === "overdue" ||
    value === "submitted"
  ) {
    return value;
  }

  return "open";
}

export default async function StudentClassPage({
  searchParams,
}: StudentClassPageProps) {
  const params = await searchParams;
  const homeworkFilter = getHomeworkFilter(params?.homeworkFilter);
  const classes = await getStudentClasses();
  const classIds = classes.map((classSummary) => classSummary.id);
  const [announcements, homework, homeworkHistory] = await Promise.all([
    getStudentAnnouncements(classIds, 10),
    getStudentHomeworkHistory("open", 10, classIds),
    getStudentHomeworkHistory(homeworkFilter, 30, classIds),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="כיתה"
        title="כיתה"
        description="הודעות ושיעורי בית מהכיתות הפעילות שלך."
      />
      <StudentClassFeed announcements={announcements} homework={homework} />
      <StudentHomeworkHistory
        activeFilter={homeworkFilter}
        assignments={homeworkHistory}
      />
    </div>
  );
}
