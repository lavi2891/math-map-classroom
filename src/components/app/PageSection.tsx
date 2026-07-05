import { MockCard } from "@/components/app/MockCard";
import { PageHeader } from "@/components/app/PageHeader";
import type { AppCard } from "@/types";

type PageSectionProps = {
  title: string;
  description: string;
  eyebrow?: string;
  cards: AppCard[];
};

export function PageSection({
  title,
  description,
  eyebrow = "מערכת כיתתית",
  cards,
}: PageSectionProps) {
  return (
    <div className="space-y-4">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <div className="grid gap-3">
        {cards.map((card) => (
          <MockCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
