import { PageSection } from "@/components/app/PageSection";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { getTeacherProfileCards } from "@/lib/db/knowledge";

export default function TeacherProfilePage() {
  const cards = getTeacherProfileCards();

  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="פרופיל"
        title="פרופיל"
        description="פרטי מורה, כיתות פעילות והגדרות תצוגה."
        cards={cards}
      />
      <PasswordChangeForm />
    </div>
  );
}
