import { SkillStatusBadge } from "@/components/knowledge/SkillStatusBadge";
import type { KnowledgeSkill } from "@/types";

type StudentProgressCardProps = {
  skill: KnowledgeSkill;
};

export function StudentProgressCard({ skill }: StudentProgressCardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-stone-950">{skill.title}</h2>
        <SkillStatusBadge type="self" value={skill.selfAssessment} />
      </div>
      <p className="mt-2 text-sm text-stone-600">
        ביצועים בפועל: {skill.performanceLabel}
      </p>
    </section>
  );
}
