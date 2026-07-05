import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { KnowledgeSkill } from "@/types";

type KnowledgeSkillCardProps = {
  skill: KnowledgeSkill;
};

const statusLabel: Record<KnowledgeSkill["status"], string> = {
  strong: "חזקה",
  practice: "דורשת תרגול",
  new: "חדשה",
};

export function KnowledgeSkillCard({ skill }: KnowledgeSkillCardProps) {
  return (
    <Card
      title={skill.title}
      description={`מצב: ${statusLabel[skill.status]} · התקדמות: ${skill.progress}%`}
      action={<PrimaryButton>פתיחת מיומנות</PrimaryButton>}
    />
  );
}
