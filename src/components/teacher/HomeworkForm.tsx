"use client";

import { useActionState, useEffect, useState } from "react";
import { formatDateTimeInput } from "@/components/homework/homeworkLabels";
import type { HomeworkActionState } from "@/app/teacher/homework/actions";
import type { ClassSummary, HomeworkAssignment } from "@/types";
import { HomeworkTagInput } from "./HomeworkTagInput";

type HomeworkFormProps = {
  action: (
    state: HomeworkActionState,
    formData: FormData,
  ) => Promise<HomeworkActionState>;
  assignment?: HomeworkAssignment;
  classes: ClassSummary[];
  onCancel: () => void;
};

const controlClass =
  "box-border min-h-11 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950";

export function HomeworkForm({
  action,
  assignment,
  classes,
  onCancel,
}: HomeworkFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const [allowLateSubmission, setAllowLateSubmission] = useState(
    assignment?.allowLateSubmission ?? true,
  );
  const [selectedClassId, setSelectedClassId] = useState(
    assignment?.classId ?? classes[0]?.id,
  );

  useEffect(() => {
    if (state.success) {
      onCancel();
    }
  }, [onCancel, state.success]);

  return (
    <form action={formAction} className="grid min-w-0 gap-3" dir="rtl">
      {assignment ? (
        <input name="homeworkId" type="hidden" value={assignment.id} />
      ) : null}

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        כיתה
        <select
          className={controlClass}
          defaultValue={selectedClassId}
          name="classId"
          onChange={(event) => setSelectedClassId(event.target.value)}
          required
        >
          {classes.map((classSummary) => (
            <option key={classSummary.id} value={classSummary.id}>
              {classSummary.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        כותרת
        <input
          className={controlClass}
          defaultValue={assignment?.title}
          name="title"
          required
          type="text"
        />
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        מה צריך לעשות?
        <textarea
          className="box-border min-h-28 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm leading-6 text-stone-950"
          defaultValue={assignment?.description}
          name="description"
          required
        />
      </label>

      <HomeworkTagInput
        classId={selectedClassId}
        initialTags={assignment?.tags}
      />

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
          גלוי החל מ
          <input
            className={controlClass}
            defaultValue={formatDateTimeInput(assignment?.visibleFrom)}
            name="visibleFrom"
            type="datetime-local"
          />
        </label>

        <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
          להגשה עד
          <input
            className={controlClass}
            defaultValue={formatDateTimeInput(assignment?.dueAt)}
            name="dueAt"
            type="datetime-local"
          />
        </label>
      </div>

      <div className="grid min-w-0 gap-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm font-semibold text-stone-700">
        <label className="flex min-h-11 items-center gap-2">
          <input
            className="size-4"
            checked={allowLateSubmission}
            name="allowLateSubmission"
            onChange={(event) => setAllowLateSubmission(event.target.checked)}
            type="checkbox"
          />
          אפשר הגשה באיחור
        </label>
        {allowLateSubmission ? (
          <label className="grid min-w-0 gap-1">
            הגשה באיחור עד
            <input
              className={controlClass}
              defaultValue={formatDateTimeInput(assignment?.lateSubmissionUntil)}
              name="lateSubmissionUntil"
              type="datetime-local"
            />
          </label>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm font-semibold text-stone-700">
        <label className="flex min-h-11 items-center gap-2">
          <input
            className="size-4"
            defaultChecked={assignment?.requireStatus ?? true}
            name="requireStatus"
            type="checkbox"
          />
          דרוש דיווח ביצוע
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            className="size-4"
            defaultChecked={assignment?.requireUnderstanding ?? true}
            name="requireUnderstanding"
            type="checkbox"
          />
          דרוש דיווח הבנה
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            className="size-4"
            defaultChecked={assignment?.requirePhoto ?? false}
            name="requirePhoto"
            type="checkbox"
          />
          דרוש צילום מחברת
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            className="size-4"
            defaultChecked={assignment?.allowExternalUrl ?? false}
            name="allowExternalUrl"
            type="checkbox"
          />
          קישור חיצוני מותר
        </label>
      </div>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        קישור חיצוני
        <input
          className={controlClass}
          defaultValue={assignment?.externalUrl}
          name="externalUrl"
          placeholder="https://"
          type="url"
        />
      </label>

      {state.error ? (
        <p className="text-sm font-bold text-red-700">{state.error}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "שומר..." : "שמור"}
        </button>
        <button
          className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
          onClick={onCancel}
          type="button"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
