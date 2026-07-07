"use client";

import { useState } from "react";
import { Card } from "@/components/app/Card";
import { StatusBadge } from "@/components/app/StatusBadge";
import { HomeworkFileList } from "@/components/homework/HomeworkFileList";
import { HomeworkSubmissionForm } from "@/components/homework/HomeworkSubmissionForm";
import {
  getHomeworkStatusLabel,
  getHomeworkStatusTone,
  getUnderstandingLabel,
  getUnderstandingTone,
} from "@/components/homework/homeworkLabels";
import type { HomeworkAssignment, HomeworkFile } from "@/types";

export function StudentHomeworkCard({
  assignment,
}: {
  assignment: HomeworkAssignment;
}) {
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const submission = assignment.submission;
  const [localFiles, setLocalFiles] = useState<HomeworkFile[]>(
    submission?.files ?? [],
  );
  const hasFiles = localFiles.length > 0;

  function getPhotoBadge() {
    if (hasFiles) {
      return <StatusBadge tone="success">צורף צילום</StatusBadge>;
    }

    if (assignment.requirePhoto && submission?.status === "started") {
      return <StatusBadge tone="warning">נדרש צילום לסיום</StatusBadge>;
    }

    if (assignment.requirePhoto) {
      return <StatusBadge tone="warning">נדרש צילום</StatusBadge>;
    }

    return null;
  }

  return (
    <Card
      title={assignment.title}
      description={`כיתה ${assignment.className ?? ""}`}
    >
      <div className="grid gap-3">
        <p className="whitespace-pre-line text-sm leading-6 text-stone-700">
          {assignment.description}
        </p>
        <div className="grid gap-2 text-sm text-stone-600">
          <p>תאריך יעד: {assignment.dueDate ?? "אין תאריך יעד"}</p>
          {assignment.isOverdue ? (
            <p className="font-bold text-red-700">עבר תאריך ההגשה</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-700">סטטוס ההגשה שלי:</span>
            <StatusBadge tone={getHomeworkStatusTone(submission?.status)}>
              {getHomeworkStatusLabel(submission?.status)}
            </StatusBadge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-700">הבנה שלי:</span>
            <StatusBadge tone={getUnderstandingTone(submission?.understanding)}>
              {getUnderstandingLabel(submission?.understanding)}
            </StatusBadge>
          </div>
          {assignment.requirePhoto || hasFiles ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-stone-700">צילום:</span>
              {getPhotoBadge()}
            </div>
          ) : null}
        </div>
        <HomeworkFileList
          files={localFiles}
          onFileDeleted={(fileId) =>
            setLocalFiles((current) =>
              current.filter((file) => file.id !== fileId),
            )
          }
          removable
        />
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

        {isSubmissionOpen ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <HomeworkSubmissionForm
              existingFiles={localFiles}
              homeworkId={assignment.id}
              onSuccess={(uploadedFiles = []) => {
                if (uploadedFiles.length > 0) {
                  setLocalFiles((current) => [...current, ...uploadedFiles]);
                }

                setIsSubmissionOpen(false);
              }}
              requirePhoto={assignment.requirePhoto}
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
