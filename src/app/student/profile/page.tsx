import Link from "next/link";
import { PageSection } from "@/components/app/PageSection";
import { ROUTES } from "@/lib/constants/routes";
import { getStudentProfileCards } from "@/lib/db/knowledge";

export default function StudentProfilePage() {
  const cards = getStudentProfileCards();

  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="פרופיל"
        title="פרופיל"
        description="פרטי תלמיד/ה, יעדים אישיים והעדפות למידה."
        cards={cards}
      />
      <Link
        className="block min-h-11 rounded-md border border-stone-200 px-4 py-2 text-center text-sm font-bold text-stone-700 transition hover:bg-stone-50"
        href={ROUTES.logout}
      >
        יציאה
      </Link>
    </div>
  );
}
