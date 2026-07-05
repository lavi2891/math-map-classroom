import type { KnowledgeSkill } from "@/types";

type StudentProgressCardProps = {
  skill: KnowledgeSkill;
};

export function StudentProgressCard({ skill }: StudentProgressCardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-stone-950">{skill.title}</h2>
        <span className="text-sm font-bold text-teal-700">{skill.progress}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-stone-100">
        <div
          className="h-2 rounded-full bg-teal-700"
          style={{ width: `${skill.progress}%` }}
        />
      </div>
    </section>
  );
}
