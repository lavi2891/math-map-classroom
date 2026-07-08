"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { StudentHomeworkCard } from "@/components/student/StudentHomeworkCard";
import type { HomeworkAssignment } from "@/types";

type StudentHomeworkHistoryProps = {
  assignments: HomeworkAssignment[];
};

const HOMEWORK_PAGE_SIZE = 10;

export function StudentHomeworkHistory({ assignments }: StudentHomeworkHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(HOMEWORK_PAGE_SIZE);
  const visibleAssignments = useMemo(
    () => assignments.slice(0, visibleCount),
    [assignments, visibleCount],
  );
  const hasMore = visibleCount < assignments.length;

  return (
    <section className="grid gap-3" id="homework-history">
      <h2 className="text-lg font-bold text-stone-950">שיעורי בית</h2>

      {assignments.length > 0 ? (
        <>
          <div className="grid gap-3">
            {visibleAssignments.map((assignment) => (
              <StudentHomeworkCard assignment={assignment} key={assignment.id} />
            ))}
          </div>
          {hasMore ? (
            <button
              className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-stone-50 sm:w-fit"
              onClick={() =>
                setVisibleCount((current) => current + HOMEWORK_PAGE_SIZE)
              }
              type="button"
            >
              טען עוד
            </button>
          ) : visibleCount > HOMEWORK_PAGE_SIZE ? (
            <p className="text-sm font-bold text-stone-500">
              אין עוד שיעורי בית להצגה
            </p>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="אין שיעורי בית להצגה"
          description="שיעורי בית גלויים יופיעו כאן."
        />
      )}
    </section>
  );
}
