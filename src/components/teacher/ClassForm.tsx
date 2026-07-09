"use client";

import { useActionState, useEffect } from "react";
import {
  createClassAction,
  updateClassAction,
  type ClassManagementActionState,
} from "@/app/teacher/classes/actions";
import type { ClassSummary } from "@/types";

type ClassFormProps = {
  classSummary?: ClassSummary;
  mode: "create" | "edit";
  onCancel: () => void;
  onSaved: () => void;
};

const initialState: ClassManagementActionState = {};

export function ClassForm({
  classSummary,
  mode,
  onCancel,
  onSaved,
}: ClassFormProps) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createClassAction : updateClassAction,
    initialState,
  );

  useEffect(() => {
    if (state.message && !state.error) {
      onSaved();
    }
  }, [onSaved, state.error, state.message]);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">
        {mode === "create" ? "כיתה חדשה" : "עריכת כיתה"}
      </h2>
      <form action={formAction} className="mt-4 grid gap-3">
        {classSummary ? (
          <input name="classId" type="hidden" value={classSummary.id} />
        ) : null}

        <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
          שם כיתה
          <input
            className="min-h-11 w-full max-w-full rounded-md border border-stone-200 px-3 text-base font-normal"
            defaultValue={classSummary?.name}
            name="name"
            required
            type="text"
          />
        </label>

        <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
          שם תצוגה לתלמידים
          <input
            className="min-h-11 w-full max-w-full rounded-md border border-stone-200 px-3 text-base font-normal"
            defaultValue={classSummary?.displayName ?? classSummary?.name}
            name="displayName"
            type="text"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
            שכבה
            <input
              className="min-h-11 w-full max-w-full rounded-md border border-stone-200 px-3 text-base font-normal"
              defaultValue={classSummary?.grade}
              min={1}
              name="grade"
              required
              type="number"
            />
          </label>

          <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
            קוד כיתה
            <input
              className="min-h-11 w-full max-w-full rounded-md border border-stone-200 px-3 text-left text-base font-normal uppercase"
              defaultValue={classSummary?.classCode}
              dir="ltr"
              name="classCode"
              pattern="[A-Za-z0-9]+"
              required
              type="text"
            />
          </label>

          <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
            שנת לימודים
            <input
              className="min-h-11 w-full max-w-full rounded-md border border-stone-200 px-3 text-base font-normal"
              defaultValue={classSummary?.schoolYear}
              name="schoolYear"
              type="text"
            />
          </label>
        </div>

        {/* TODO: Future: select a prepared knowledge map template for this class. */}

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
            onClick={onCancel}
            type="button"
          >
            ביטול
          </button>
          <button
            className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
            disabled={pending}
            type="submit"
          >
            {mode === "create" ? "צור כיתה" : "שמור שינויים"}
          </button>
        </div>
      </form>
    </section>
  );
}
