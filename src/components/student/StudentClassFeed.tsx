import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { ClassFeedItem } from "@/types";

type StudentClassFeedProps = {
  items: ClassFeedItem[];
};

export function StudentClassFeed({ items }: StudentClassFeedProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card
          key={item.id}
          title={item.title}
          description={item.description}
          action={<PrimaryButton>{item.actionLabel}</PrimaryButton>}
        />
      ))}
    </div>
  );
}
