import Link from "next/link";
import { EmptyState } from "@/components/app/EmptyState";
import { StudentHomeworkCard } from "@/components/student/StudentHomeworkCard";
import type {
  HomeworkAssignment,
  StudentHomeworkHistoryFilter,
} from "@/types";

type StudentHomeworkHistoryProps = {
  assignments: HomeworkAssignment[];
  activeFilter: StudentHomeworkHistoryFilter;
};

const filterLabels: Record<StudentHomeworkHistoryFilter, string> = {
  all: "הכל",
  open: "פתוחים",
  overdue: "עברו מועד",
  submitted: "הוגשו",
};

const filters: StudentHomeworkHistoryFilter[] = [
  "open",
  "overdue",
  "submitted",
  "all",
];

export function StudentHomeworkHistory({
  activeFilter,
  assignments,
}: StudentHomeworkHistoryProps) {
  return (
    <section className="grid gap-3" id="homework-history">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-stone-950">
          היסטוריית שיעורי בית
        </h2>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              className={`min-h-10 rounded-md border px-3 py-2 text-sm font-bold transition ${
                activeFilter === filter
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
              href={`/student/class?homeworkFilter=${filter}#homework-history`}
              key={filter}
            >
              {filterLabels[filter]}
            </Link>
          ))}
        </div>
      </div>

      {assignments.length > 0 ? (
        <>
          <div className="grid gap-3">
            {assignments.map((assignment) => (
              <StudentHomeworkCard assignment={assignment} key={assignment.id} />
            ))}
          </div>
          {/* TODO: implement cursor pagination for homework history. */}
          {assignments.length >= 30 ? (
            <button
              className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-500 sm:w-fit"
              disabled
              type="button"
            >
              טען עוד
            </button>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="אין שיעורי בית להצגה"
          description="אפשר לבחור מסנן אחר כדי לראות משימות נוספות."
        />
      )}
    </section>
  );
}
