import { EmptyState } from "@/components/app/EmptyState";
import { SkillTypeSection } from "@/components/knowledge/SkillTypeSection";
import type { StudentKnowledgeMap } from "@/types";

type StudentKnowledgePanelProps = {
  map: StudentKnowledgeMap | null;
};

export function StudentKnowledgePanel({ map }: StudentKnowledgePanelProps) {
  if (!map) {
    return (
      <EmptyState
        title="לא נמצאה מפת ידע"
        description="לא הצלחנו למצוא מפת ידע לכיתה הנבחרת."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-stone-950">{map.className}</h2>
        <p className="mt-1 text-sm text-stone-600">
          שכבה {map.grade} · ביצועים בפועל: אין עדיין נתונים
        </p>
      </div>

      {map.sections.length === 0 ? (
        <EmptyState
          title="אין מיומנויות להצגה"
          description="מפת הידע לשכבה הזו עדיין לא הוגדרה."
        />
      ) : (
        map.sections.map((section) => (
          <SkillTypeSection
            classId={map.classId}
            key={section.skillType}
            mode="student"
            section={section}
          />
        ))
      )}
    </div>
  );
}
