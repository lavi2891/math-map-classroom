import { PageSection } from "@/components/app/PageSection";
import { getStudentProfileCards } from "@/lib/db/knowledge";

export default function StudentProfilePage() {
  const cards = getStudentProfileCards();

  return (
    <PageSection
      eyebrow="פרופיל"
      title="פרופיל"
      description="פרטי תלמיד/ה, יעדים אישיים והעדפות למידה."
      cards={cards}
    />
  );
}
