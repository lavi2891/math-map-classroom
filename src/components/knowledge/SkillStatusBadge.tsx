import type { UnderstandingLevel } from "@/types";

type SkillStatusBadgeProps = {
  type: "taught" | "self" | "performance";
  value?: boolean | UnderstandingLevel;
};

const selfAssessmentLabels: Record<UnderstandingLevel, string> = {
  good: "הבנתי טוב",
  partial: "הבנתי חלקית",
  no: "לא הבנתי",
  unknown: "לא דיווחתי",
};

export function getSelfAssessmentLabel(level?: UnderstandingLevel) {
  return selfAssessmentLabels[level ?? "unknown"];
}

export function SkillStatusBadge({ type, value }: SkillStatusBadgeProps) {
  if (type === "taught") {
    const isTaught = value === true;

    return (
      <span
        className={
          isTaught
            ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
            : "rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600"
        }
      >
        {isTaught ? "נלמד בכיתה" : "טרם נלמד בכיתה"}
      </span>
    );
  }

  if (type === "performance") {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        אין עדיין נתוני ביצוע
      </span>
    );
  }

  const level = typeof value === "string" ? value : "unknown";

  return (
    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
      {getSelfAssessmentLabel(level)}
    </span>
  );
}
