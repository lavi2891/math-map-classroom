"use client";

import { useActionState, useEffect } from "react";
import { submitHomework } from "@/app/student/homework/actions";
import type { HomeworkSubmissionActionState } from "@/app/student/homework/actions";
import {
  homeworkStatusLabels,
  understandingLabels,
} from "@/components/homework/homeworkLabels";
import type {
  HomeworkStatus,
  HomeworkSubmissionDetail,
  UnderstandingLevel,
} from "@/types";

type HomeworkSubmissionFormProps = {
  homeworkId: string;
  onSuccess: () => void;
  submission?: HomeworkSubmissionDetail;
};

const statusOptions: HomeworkStatus[] = ["not_started", "started", "done"];
const understandingOptions: UnderstandingLevel[] = [
  "good",
  "partial",
  "no",
  "unknown",
];

const controlClass =
  "box-border min-h-11 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-base text-stone-950";

export function HomeworkSubmissionForm({
  homeworkId,
  onSuccess,
  submission,
}: HomeworkSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(submitHomework, {
    success: false,
  } satisfies HomeworkSubmissionActionState);

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className="grid min-w-0 gap-3" dir="rtl">
      <input name="homeworkId" type="hidden" value={homeworkId} />

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        מצב ביצוע
        <select
          className={controlClass}
          defaultValue={submission?.status ?? "not_started"}
          name="status"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {homeworkStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        איך הבנתי?
        <select
          className={controlClass}
          defaultValue={submission?.understanding ?? "unknown"}
          name="understanding"
        >
          {understandingOptions.map((level) => (
            <option key={level} value={level}>
              {understandingLabels[level]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        הערה למורה
        <textarea
          className="box-border min-h-24 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-base text-stone-950"
          defaultValue={submission?.note}
          name="note"
        />
      </label>

      {state.error ? (
        <p className="text-sm font-bold text-red-700">{state.error}</p>
      ) : null}

      <button
        className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? "שולח..."
          : submission?.id
            ? "עדכן הגשה"
            : "שלח הגשה"}
      </button>
    </form>
  );
}
