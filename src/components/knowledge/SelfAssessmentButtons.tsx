import { updateSkillSelfAssessmentAction } from "@/app/student/knowledge/actions";
import type { UnderstandingLevel } from "@/types";
import { getSelfAssessmentLabel } from "./SkillStatusBadge";

type SelfAssessmentButtonsProps = {
  classId: string;
  currentLevel?: UnderstandingLevel;
  skillId: string;
};

const levels: UnderstandingLevel[] = ["good", "partial", "no", "unknown"];

function getButtonClass(level: UnderstandingLevel, currentLevel?: UnderstandingLevel) {
  const isSelected = (currentLevel ?? "unknown") === level;

  if (isSelected) {
    return "border-teal-700 bg-teal-700 text-white";
  }

  return "border-stone-200 bg-white text-stone-700 hover:bg-stone-50";
}

export function SelfAssessmentButtons({
  classId,
  currentLevel,
  skillId,
}: SelfAssessmentButtonsProps) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {levels.map((level) => (
        <form action={updateSkillSelfAssessmentAction} key={level}>
          <input name="classId" type="hidden" value={classId} />
          <input name="skillId" type="hidden" value={skillId} />
          <input name="level" type="hidden" value={level} />
          <button
            className={`min-h-10 w-full rounded-md border px-2 py-2 text-sm font-semibold transition ${getButtonClass(
              level,
              currentLevel,
            )}`}
            type="submit"
          >
            {getSelfAssessmentLabel(level)}
          </button>
        </form>
      ))}
    </div>
  );
}
