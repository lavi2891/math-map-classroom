import type { HomeworkSubmissionSummary as Summary } from "@/types";

export function HomeworkSubmissionSummary({ summary }: { summary: Summary }) {
  return (
    <div className="grid gap-1 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
      <p className="font-bold text-stone-950">
        הגישו: {summary.submittedCount}/{summary.totalStudentCount}
      </p>
      <p>סיימו: {summary.doneCount}</p>
      <p>התחילו: {summary.startedCount}</p>
      <p>לא התחילו: {summary.notStartedCount}</p>
      <p>הבינו טוב: {summary.goodUnderstandingCount}</p>
      <p>הבינו חלקית: {summary.partialUnderstandingCount}</p>
      <p>לא הבינו: {summary.noUnderstandingCount}</p>
    </div>
  );
}
