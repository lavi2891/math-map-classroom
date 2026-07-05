import { Card } from "@/components/app/Card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return <Card title={title} description={description} />;
}
