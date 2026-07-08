"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { StudentHomeworkCard } from "@/components/student/StudentHomeworkCard";
import type { HomeworkAssignment } from "@/types";

type StudentHomeworkListProps = {
  assignments: HomeworkAssignment[];
  enableLoadMore?: boolean;
  initialCount?: number;
  loadMoreLabel?: string;
};

const DEFAULT_HOMEWORK_PAGE_SIZE = 10;

export function StudentHomeworkList({
  assignments,
  enableLoadMore = true,
  initialCount = DEFAULT_HOMEWORK_PAGE_SIZE,
  loadMoreLabel = "טען עוד",
}: StudentHomeworkListProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visibleAssignments = useMemo(
    () => assignments.slice(0, visibleCount),
    [assignments, visibleCount],
  );
  const hasMore = enableLoadMore && visibleCount < assignments.length;

  return (
    <section className="grid gap-3" id="homework-list">
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
                setVisibleCount((current) => current + DEFAULT_HOMEWORK_PAGE_SIZE)
              }
              type="button"
            >
              {loadMoreLabel}
            </button>
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
