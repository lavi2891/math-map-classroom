import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { AppCard } from "@/types";

type MockCardProps = {
  card: AppCard;
};

export function MockCard({ card }: MockCardProps) {
  return (
    <Card
      title={card.title}
      description={card.description}
      action={<PrimaryButton>{card.actionLabel}</PrimaryButton>}
    />
  );
}
