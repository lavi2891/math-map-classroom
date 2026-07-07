import {
  homeworkStatusLabels,
  understandingLabels,
} from "@/components/homework/homeworkLabels";
import type { HomeworkSubmissionDetail } from "@/types";

function formatSubmittedAt(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HomeworkSubmissionList({
  submissions,
}: {
  submissions: HomeworkSubmissionDetail[];
}) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-bold text-stone-950">פירוט תלמידים</h3>
      {submissions.map((submission) => (
        <section
          className="rounded-md border border-stone-200 bg-white p-3"
          key={submission.studentId}
        >
          <p className="text-sm font-bold text-stone-950">
            {submission.studentName}
          </p>
          {submission.id ? (
            <div className="mt-1 grid gap-1 text-sm text-stone-600">
              <p>סטטוס: {homeworkStatusLabels[submission.status ?? "not_started"]}</p>
              <p>
                הבנה: {understandingLabels[submission.understanding ?? "unknown"]}
              </p>
              {submission.note ? <p>הערה: {submission.note}</p> : null}
              {submission.submittedAt ? (
                <p>זמן הגשה: {formatSubmittedAt(submission.submittedAt)}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-stone-500">לא הגיש</p>
          )}
        </section>
      ))}
    </div>
  );
}
