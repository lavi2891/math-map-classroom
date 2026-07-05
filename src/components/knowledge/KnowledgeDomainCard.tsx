import { Card } from "@/components/app/Card";
import type { KnowledgeDomain } from "@/types";

type KnowledgeDomainCardProps = {
  domain: KnowledgeDomain;
};

export function KnowledgeDomainCard({ domain }: KnowledgeDomainCardProps) {
  return (
    <Card title={domain.title} description={domain.description}>
      <p className="text-sm font-semibold text-teal-700">
        {domain.skills.length} מיומנויות
      </p>
    </Card>
  );
}
