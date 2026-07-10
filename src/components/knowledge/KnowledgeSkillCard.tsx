import { Card } from "@/components/app/Card";
import type { KnowledgeSkill } from "@/types";

type KnowledgeSkillCardProps = {
  skill: KnowledgeSkill;
};

export function KnowledgeSkillCard({ skill }: KnowledgeSkillCardProps) {
  return (
    <Card
      title={skill.title}
      description={`ביצועים בפועל: ${skill.performanceLabel}`}
    />
  );
}
