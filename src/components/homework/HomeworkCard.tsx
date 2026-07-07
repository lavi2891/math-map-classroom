/* eslint-disable @next/next/no-img-element */
import { Card } from "@/components/app/Card";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import type { HomeworkAssignment, HomeworkFile } from "@/types";

type HomeworkCardProps = {
  assignment: HomeworkAssignment;
};

const statusLabel: Record<string, string> = {
  done: "סיים/ה",
  not_started: "לא התחיל/ה",
  started: "התחיל/ה",
};

const understandingLabel: Record<string, string> = {
  good: "הבנה טובה",
  no: "לא הבין/ה",
  partial: "הבנה חלקית",
  unknown: "לא ידוע",
};

function FileLinks({ files }: { files: HomeworkFile[] }) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {files.map((file) =>
        file.signedUrl ? (
          <a
            className="block rounded-md border border-stone-200 bg-stone-50 p-2 text-sm font-semibold text-teal-700"
            href={file.signedUrl}
            key={file.id}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={file.fileName ?? "צילום מחברת"}
              className="mb-2 aspect-video w-full rounded-md object-cover"
              src={file.signedUrl}
            />
            {file.fileName ?? "צילום מחברת"}
          </a>
        ) : (
          <div
            className="block rounded-md border border-stone-200 bg-stone-50 p-2 text-sm font-semibold text-stone-600"
            key={file.id}
          >
            {file.fileName ?? "צילום מחברת"}
          </div>
        ),
      )}
    </div>
  );
}

export function HomeworkCard({ assignment }: HomeworkCardProps) {
  return (
    <Card
      title={assignment.title}
      description={`להגשה: ${assignment.dueDate ?? "אין תאריך הגשה"}`}
      action={<PrimaryButton>ניהול משימה</PrimaryButton>}
    >
      <div className="grid gap-1 text-sm text-stone-600">
        {assignment.className ? <p>כיתה: {assignment.className}</p> : null}
        <p>הגשות: {assignment.submissionCount ?? 0}</p>
        <p>סיימו: {assignment.doneCount ?? 0}</p>
        <p>הבנה חלקית: {assignment.partialUnderstandingCount ?? 0}</p>
        <p>לא הבינו: {assignment.noUnderstandingCount ?? 0}</p>
      </div>

      {assignment.submissions && assignment.submissions.length > 0 ? (
        <div className="mt-4 grid gap-3">
          <h3 className="text-sm font-bold text-stone-950">הגשות תלמידים</h3>
          {assignment.submissions.map((submission) => (
            <section
              className="rounded-md border border-stone-200 bg-stone-50 p-3"
              key={submission.id}
            >
              <p className="text-sm font-bold text-stone-950">
                {submission.studentName}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {statusLabel[submission.status]} ·{" "}
                {understandingLabel[submission.understanding]}
              </p>
              {submission.note ? (
                <p className="mt-2 text-sm text-stone-600">{submission.note}</p>
              ) : null}
              <FileLinks files={submission.files} />
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
