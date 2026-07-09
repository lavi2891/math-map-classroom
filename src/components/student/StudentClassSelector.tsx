"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setSelectedStudentClass } from "@/app/student/actions";
import type { ClassSummary } from "@/types";

type StudentClassSelectorProps = {
  classes: ClassSummary[];
  selectedClassId: string;
};

export function StudentClassSelector({
  classes,
  selectedClassId,
}: StudentClassSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (classes.length <= 1) {
    return null;
  }

  return (
    <label className="grid gap-1 text-xs font-semibold text-stone-600">
      כיתה
      <select
        className="min-h-10 max-w-40 rounded-md border border-stone-200 bg-white px-2 text-sm font-bold text-stone-950 outline-none focus:border-teal-700 disabled:opacity-60"
        defaultValue={selectedClassId}
        disabled={isPending}
        onChange={(event) => {
          const classId = event.currentTarget.value;

          startTransition(async () => {
            const result = await setSelectedStudentClass(classId);

            if (result.success) {
              router.refresh();
            }
          });
        }}
      >
        {classes.map((classSummary) => (
          <option key={classSummary.id} value={classSummary.id}>
            {`${classSummary.displayName ?? classSummary.name} (${classSummary.classCode})`}
          </option>
        ))}
      </select>
    </label>
  );
}
