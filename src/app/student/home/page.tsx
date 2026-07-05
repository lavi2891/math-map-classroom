import { PageHeader } from "@/components/app/PageHeader";
import { StudentHomeFeed } from "@/components/student/StudentHomeFeed";
import { getStudentHomeCards } from "@/lib/db/knowledge";

export default function StudentHomePage() {
  const cards = getStudentHomeCards();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תלמיד/ה"
        title="בית"
        description="תקציר יומי עם משימות, התקדמות ונושאים שדורשים תשומת לב."
      />
      <StudentHomeFeed cards={cards} />
    </div>
  );
}
