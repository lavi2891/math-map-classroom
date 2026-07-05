import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { AppCard } from "@/types";

type TeacherStatusCardProps = {
  card: AppCard;
};

export function TeacherStatusCard({ card }: TeacherStatusCardProps) {
  return (
    <Card
      title={card.title}
      description={card.description}
      action={<PrimaryButton>{card.actionLabel}</PrimaryButton>}
    />
  );
}
