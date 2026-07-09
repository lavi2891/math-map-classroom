"use client";

import { useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { ClassForm } from "@/components/teacher/ClassForm";
import { TeacherClassCard } from "@/components/teacher/TeacherClassCard";
import type { ClassSummary } from "@/types";

type TeacherClassesPanelProps = {
  classes: ClassSummary[];
};

export function TeacherClassesPanel({ classes }: TeacherClassesPanelProps) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      {!creating ? (
        <button
          className="min-h-11 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white sm:w-auto"
          onClick={() => setCreating(true)}
          type="button"
        >
          + כיתה חדשה
        </button>
      ) : null}

      {creating ? (
        <ClassForm
          mode="create"
          onCancel={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      ) : null}

      <div className="grid gap-3">
        {classes.length > 0 ? (
          classes.map((summary) => (
            <TeacherClassCard key={summary.id} summary={summary} />
          ))
        ) : (
          <EmptyState
            title="אין כיתות להצגה"
            description="כיתות שבהן יש לך שיוך צוות יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
