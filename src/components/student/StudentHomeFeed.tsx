import { MockCard } from "@/components/app/MockCard";
import type { AppCard } from "@/types";

type StudentHomeFeedProps = {
  cards: AppCard[];
};

export function StudentHomeFeed({ cards }: StudentHomeFeedProps) {
  return (
    <div className="grid gap-3">
      {cards.map((card) => (
        <MockCard key={card.id} card={card} />
      ))}
    </div>
  );
}
