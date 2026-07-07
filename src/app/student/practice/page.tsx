import { PageSection } from "@/components/app/PageSection";
import { getStudentPracticeCards } from "@/lib/db/homework";

export default function StudentPracticePage() {
  const cards = getStudentPracticeCards();

  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="תרגול"
        title="תרגול"
        description="תרגולים קצרים ומותאמים לפי מצב הידע הנוכחי."
        cards={cards}
      />
    </div>
  );
}
