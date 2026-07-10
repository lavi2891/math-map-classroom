import { KnowledgeDomainAccordion } from "@/components/knowledge/KnowledgeDomainAccordion";
import type { KnowledgeSkillType, KnowledgeSkillTypeSection } from "@/types";

type SkillTypeSectionProps = {
  canManage?: boolean;
  classId: string;
  mode: "student" | "teacher";
  section: KnowledgeSkillTypeSection;
};

const skillTypeLabels: Record<KnowledgeSkillType, string> = {
  prerequisite: "ידע קודם",
  curriculum: "תוכנית השנה",
  support: "מיומנויות תומכות",
  enrichment: "העשרה",
  system: "מערכת",
};

export function SkillTypeSection({
  canManage,
  classId,
  mode,
  section,
}: SkillTypeSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-stone-950">
          {skillTypeLabels[section.skillType]}
        </h2>
      </div>

      <div className="grid gap-3">
        {section.domains.map((domain) => (
          <KnowledgeDomainAccordion
            canManage={canManage}
            classId={classId}
            domain={domain}
            key={domain.id}
            mode={mode}
          />
        ))}
      </div>
    </section>
  );
}
