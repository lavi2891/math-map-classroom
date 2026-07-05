import type { KnowledgeSkill } from "@/types";

type KnowledgeSkillRowProps = {
  skill: KnowledgeSkill;
};

const statusLabel: Record<KnowledgeSkill["status"], string> = {
  strong: "חזקה",
  practice: "דורשת תרגול",
  new: "חדשה",
};

export function KnowledgeSkillRow({ skill }: KnowledgeSkillRowProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-950">{skill.title}</h2>
          <p className="mt-1 text-sm text-stone-600">{statusLabel[skill.status]}</p>
        </div>
        <span className="text-sm font-bold text-teal-700">{skill.progress}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-stone-100">
        <div
          className="h-2 rounded-full bg-teal-700"
          style={{ width: `${skill.progress}%` }}
        />
      </div>
    </div>
  );
}
