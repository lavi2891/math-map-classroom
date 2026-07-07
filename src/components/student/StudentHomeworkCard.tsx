"use client";

import { useState } from "react";
import { Card } from "@/components/app/Card";
import { HomeworkSubmissionForm } from "@/components/homework/HomeworkSubmissionForm";
import {
  homeworkStatusLabels,
  understandingLabels,
} from "@/components/homework/homeworkLabels";
import type { HomeworkAssignment } from "@/types";

export function StudentHomeworkCard({
  assignment,
}: {
  assignment: HomeworkAssignment;
}) {
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const submission = assignment.submission;

  return (
    <Card
      title={assignment.title}
      description={`כיתה ${assignment.className ?? ""}`}
    >
      <div className="grid gap-3">
        <p className="whitespace-pre-line text-sm leading-6 text-stone-700">
          {assignment.description}
        </p>
        <div className="grid gap-1 text-sm text-stone-600">
          <p>תאריך יעד: {assignment.dueDate ?? "אין תאריך יעד"}</p>
          {assignment.isOverdue ? (
            <p className="font-bold text-red-700">עבר תאריך ההגשה</p>
          ) : null}
          <p>
            סטטוס ההגשה שלי:{" "}
            {submission?.status
              ? homeworkStatusLabels[submission.status]
              : "לא הגיש"}
          </p>
          <p>
            הבנה שלי:{" "}
            {submission?.understanding
              ? understandingLabels[submission.understanding]
              : "לא מסומן"}
          </p>
        </div>
        {assignment.externalUrl ? (
          <a
            className="text-sm font-bold text-teal-700"
            href={assignment.externalUrl}
            rel="noreferrer"
            target="_blank"
          >
            קישור חיצוני
          </a>
        ) : null}
        {assignment.requirePhoto ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            המורה ביקש צילום מחברת. העלאת צילום תתווסף בשלב הבא.
          </p>
        ) : null}

        {isSubmissionOpen ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <HomeworkSubmissionForm
              homeworkId={assignment.id}
              onSuccess={() => setIsSubmissionOpen(false)}
              submission={submission}
            />
          </div>
        ) : (
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-stone-50 sm:w-fit"
            onClick={() => setIsSubmissionOpen(true)}
            type="button"
          >
            {submission?.id ? "עדכן הגשה" : "פתח הגשה"}
          </button>
        )}
      </div>
    </Card>
  );
}
