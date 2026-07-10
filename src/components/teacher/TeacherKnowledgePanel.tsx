import { EmptyState } from "@/components/app/EmptyState";
import { SkillTypeSection } from "@/components/knowledge/SkillTypeSection";
import type { ClassSummary, TeacherKnowledgeStatus } from "@/types";

type TeacherKnowledgePanelProps = {
  classes: ClassSummary[];
  selectedClassId?: string;
  status: TeacherKnowledgeStatus | null;
};

export function TeacherKnowledgePanel({
  classes,
  selectedClassId,
  status,
}: TeacherKnowledgePanelProps) {
  if (classes.length === 0) {
    return (
      <EmptyState
        title="לא נמצאו כיתות"
        description="צריך שיוך פעיל לכיתה כדי לראות את מפת הידע."
      />
    );
  }

  return (
    <div className="space-y-4">
      <form className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          כיתה
          <select
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
            defaultValue={selectedClassId ?? classes[0]?.id}
            name="classId"
          >
            {classes.map((classSummary) => (
              <option key={classSummary.id} value={classSummary.id}>
                {classSummary.displayName ?? classSummary.name} ·{" "}
                {classSummary.classCode}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mt-3 w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          type="submit"
        >
          הצג כיתה
        </button>
      </form>

      {!status ? (
        <EmptyState
          title="לא ניתן להציג מפת ידע"
          description="לא נמצאה מפת ידע מתאימה לכיתה שנבחרה."
        />
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-stone-950">
              {status.className}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              שכבה {status.grade} · ביצועים בפועל: אין עדיין נתוני ביצוע
            </p>
            {!status.canManage ? (
              <p className="mt-2 text-sm font-semibold text-amber-700">
                צפייה בלבד
              </p>
            ) : null}
          </div>

          {status.sections.length === 0 ? (
            <EmptyState
              title="אין מיומנויות להצגה"
              description="אפשר להריץ את seed שכבה ז כדי להתחיל."
            />
          ) : (
            status.sections.map((section) => (
              <SkillTypeSection
                canManage={status.canManage}
                classId={status.classId}
                key={section.skillType}
                mode="teacher"
                section={section}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
