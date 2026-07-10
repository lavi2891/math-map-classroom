import { markSkillTaughtAction, unmarkSkillTaughtAction } from "@/app/teacher/status/actions";
import { SelfAssessmentButtons } from "@/components/knowledge/SelfAssessmentButtons";
import { SkillResourcesList } from "@/components/knowledge/SkillResourcesList";
import { SkillStatusBadge } from "@/components/knowledge/SkillStatusBadge";
import type { KnowledgeSkill } from "@/types";

type KnowledgeSkillRowProps = {
  canManage?: boolean;
  classId: string;
  mode: "student" | "teacher";
  skill: KnowledgeSkill;
};

function TeacherSummary({ skill }: { skill: KnowledgeSkill }) {
  const summary = skill.selfAssessmentSummary;

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
      <span>הבנתי טוב: {summary.good}</span>
      <span>הבנתי חלקית: {summary.partial}</span>
      <span>לא הבנתי: {summary.no}</span>
      <span>לא דיווחו: {summary.unreported}</span>
    </div>
  );
}

function TeacherTaughtAction({
  canManage,
  classId,
  skill,
}: {
  canManage?: boolean;
  classId: string;
  skill: KnowledgeSkill;
}) {
  if (!canManage) {
    return null;
  }

  return (
    <form action={skill.isTaught ? unmarkSkillTaughtAction : markSkillTaughtAction}>
      <input name="classId" type="hidden" value={classId} />
      <input name="skillId" type="hidden" value={skill.id} />
      <button
        className="mt-3 w-full rounded-md border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
        type="submit"
      >
        {skill.isTaught ? "סמן כטרם נלמד" : "סמן כנלמד"}
      </button>
    </form>
  );
}

export function KnowledgeSkillRow({
  canManage,
  classId,
  mode,
  skill,
}: KnowledgeSkillRowProps) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 text-base font-bold text-stone-950">
            {skill.title}
          </h3>
          <SkillStatusBadge type="taught" value={skill.isTaught} />
        </div>

        {skill.description ? (
          <p className="text-sm leading-6 text-stone-600">{skill.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {mode === "student" ? (
            <SkillStatusBadge type="self" value={skill.selfAssessment} />
          ) : null}
          <SkillStatusBadge type="performance" />
        </div>
      </div>

      <SkillResourcesList resources={skill.resources} />
      {mode === "teacher" ? <TeacherSummary skill={skill} /> : null}
      {mode === "teacher" ? (
        <TeacherTaughtAction canManage={canManage} classId={classId} skill={skill} />
      ) : (
        <SelfAssessmentButtons
          classId={classId}
          currentLevel={skill.selfAssessment}
          skillId={skill.id}
        />
      )}
    </article>
  );
}
