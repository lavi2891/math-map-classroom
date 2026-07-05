import { PageSection } from "@/components/app/PageSection";
import { getTeacherProfileCards } from "@/lib/db/knowledge";

export default function TeacherProfilePage() {
  const cards = getTeacherProfileCards();

  return (
    <PageSection
      eyebrow="פרופיל"
      title="פרופיל"
      description="פרטי מורה, כיתות פעילות והגדרות תצוגה."
      cards={cards}
    />
  );
}
