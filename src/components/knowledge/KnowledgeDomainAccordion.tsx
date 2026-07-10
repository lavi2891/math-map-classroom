import { KnowledgeSkillRow } from "@/components/knowledge/KnowledgeSkillRow";
import type { KnowledgeDomain } from "@/types";

type KnowledgeDomainAccordionProps = {
  canManage?: boolean;
  classId: string;
  domain: KnowledgeDomain;
  mode: "student" | "teacher";
};

export function KnowledgeDomainAccordion({
  canManage,
  classId,
  domain,
  mode,
}: KnowledgeDomainAccordionProps) {
  return (
    <details
      className="rounded-lg border border-stone-200 bg-stone-50 p-3"
      open
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-stone-950">{domain.title}</h3>
            {domain.description ? (
              <p className="mt-1 text-sm text-stone-600">{domain.description}</p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600">
            {domain.skills.length}
          </span>
        </div>
      </summary>

      <div className="mt-3 grid gap-3">
        {domain.skills.map((skill) => (
          <KnowledgeSkillRow
            canManage={canManage}
            classId={classId}
            key={skill.id}
            mode={mode}
            skill={skill}
          />
        ))}
      </div>
    </details>
  );
}
