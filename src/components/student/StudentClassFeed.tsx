/* eslint-disable @next/next/no-img-element */
import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import { HomeworkSubmissionForm } from "@/components/homework/HomeworkSubmissionForm";
import type { Announcement, HomeworkAssignment, HomeworkFile } from "@/types";

type StudentClassFeedProps = {
  announcements: Announcement[];
  homework: HomeworkAssignment[];
};

function homeworkDescription(assignment: HomeworkAssignment) {
  return `${assignment.description ?? ""} להגשה: ${
    assignment.dueDate ?? "אין תאריך"
  }`;
}

function UploadedFiles({ files }: { files: HomeworkFile[] }) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-bold text-stone-950">קבצים שהועלו</p>
      {files.map((file) =>
        file.signedUrl ? (
          <a
            className="rounded-md border border-stone-200 bg-stone-50 p-2 text-sm font-semibold text-teal-700"
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
            className="rounded-md border border-stone-200 bg-stone-50 p-2 text-sm font-semibold text-stone-600"
            key={file.id}
          >
            {file.fileName ?? "צילום מחברת"}
          </div>
        ),
      )}
    </div>
  );
}

export function StudentClassFeed({
  announcements,
  homework,
}: StudentClassFeedProps) {
  const hasFeedItems = announcements.length > 0 || homework.length > 0;

  if (!hasFeedItems) {
    return (
      <EmptyState
        title="אין פעילות להצגה"
        description="הודעות ושיעורי בית יופיעו כאן כאשר יהיו זמינים."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {announcements.map((announcement) => (
        <Card
          key={`announcement-${announcement.id}`}
          title={announcement.title}
          description={`${announcement.body} ${announcement.audience}`}
        />
      ))}
      {homework.map((assignment) => (
        <Card
          key={`homework-${assignment.id}`}
          title={assignment.title}
          description={homeworkDescription(assignment)}
        >
          <div className="grid gap-3">
            <UploadedFiles files={assignment.files ?? []} />
            <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
              <summary className="cursor-pointer text-sm font-bold text-teal-700">
                פתח הגשה
              </summary>
              <div className="mt-3">
                <HomeworkSubmissionForm homeworkId={assignment.id} />
              </div>
            </details>
          </div>
        </Card>
      ))}
    </div>
  );
}
