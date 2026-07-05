import { PageHeader } from "@/components/app/PageHeader";
import { TeacherStatusCard } from "@/components/teacher/TeacherStatusCard";
import { getTeacherStatusCards } from "@/lib/db/knowledge";

export default function TeacherStatusPage() {
  const cards = getTeacherStatusCards();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מצב"
        title="מצב"
        description="תמונת מצב כיתתית עם מוקדים להמשך עבודה."
      />

      <div className="grid gap-3">
        {cards.map((card) => (
          <TeacherStatusCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
