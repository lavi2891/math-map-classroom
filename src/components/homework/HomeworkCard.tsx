import { HomeworkSubmissionList } from "@/components/homework/HomeworkSubmissionList";
import { HomeworkSubmissionSummary } from "@/components/homework/HomeworkSubmissionSummary";
import { getHomeworkVisibilityLabel } from "@/components/homework/homeworkLabels";
import { Card } from "@/components/app/Card";
import type { HomeworkAssignment } from "@/types";

type HomeworkCardProps = {
  assignment: HomeworkAssignment;
  className?: string;
};

export function HomeworkCard({ assignment, className }: HomeworkCardProps) {
  const summary = assignment.submissionSummary;
  const strugglingCount =
    summary.noUnderstandingCount + summary.partialUnderstandingCount;

  return (
    <Card
      className={className}
      title={assignment.title}
      description={`כיתה ${assignment.className ?? ""}`}
    >
      <div className="grid gap-3">
        <div className="grid gap-1 text-sm text-stone-600">
          <p>תאריך יעד: {assignment.dueDate ?? "אין תאריך יעד"}</p>
          <p>
            הגשה באיחור:{" "}
            {assignment.allowLateSubmission
              ? assignment.lateSubmissionUntilDate
                ? `אפשר עד ${assignment.lateSubmissionUntilDate}`
                : "אפשר"
              : "לא"}
          </p>
          <p>סטטוס: {getHomeworkVisibilityLabel(assignment)}</p>
          <p>דורש צילום: {assignment.requirePhoto ? "כן" : "לא"}</p>
          <p>מספר הגשות: {summary.submittedCount}</p>
          <p>סימנו סיימתי: {summary.doneCount}</p>
          <p>לא הבינו או הבינו חלקית: {strugglingCount}</p>
          {assignment.externalUrl ? (
            <a
              className="font-semibold text-teal-700"
              href={assignment.externalUrl}
              rel="noreferrer"
              target="_blank"
            >
              קישור חיצוני
            </a>
          ) : null}
        </div>

        <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-teal-700">
            פרטי הגשות
          </summary>
          <div className="mt-3 grid gap-3">
            <HomeworkSubmissionSummary summary={summary} />
            <HomeworkSubmissionList
              submissions={assignment.submissionDetails ?? []}
            />
          </div>
        </details>
      </div>
    </Card>
  );
}
