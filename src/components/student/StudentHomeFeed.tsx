/* eslint-disable @next/next/no-img-element */
import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import { HomeworkSubmissionForm } from "@/components/homework/HomeworkSubmissionForm";
import { StudentAnnouncementCard } from "@/components/student/StudentAnnouncementCard";
import type {
  Announcement,
  ClassSummary,
  HomeworkAssignment,
  HomeworkFile,
} from "@/types";

type StudentHomeFeedProps = {
  announcements: Announcement[];
  classes: ClassSummary[];
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

export function StudentHomeFeed({
  announcements,
  classes,
  homework,
}: StudentHomeFeedProps) {
  return (
    <div className="grid gap-3">
      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-stone-950">הכיתות שלי</h2>
        {classes.length > 0 ? (
          classes.map((classSummary) => (
            <Card
              key={classSummary.id}
              title={`כיתה ${classSummary.name}`}
              description={`שכבה ${classSummary.grade} · קוד ${classSummary.classCode}`}
            />
          ))
        ) : (
          <EmptyState
            title="אין כיתות פעילות"
            description="לא נמצאו כיתות פעילות לחשבון הזה."
          />
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-stone-950">הודעות אחרונות</h2>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <StudentAnnouncementCard
              announcement={announcement}
              key={announcement.id}
            />
          ))
        ) : (
          <EmptyState
            title="אין הודעות חדשות"
            description="הודעות מהמורה יופיעו כאן."
          />
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-stone-950">שיעורי בית פתוחים</h2>
        {homework.length > 0 ? (
          homework.map((assignment) => (
            <Card
              key={assignment.id}
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
          ))
        ) : (
          <EmptyState
            title="אין שיעורי בית פתוחים"
            description="משימות פתוחות יופיעו כאן."
          />
        )}
      </section>
    </div>
  );
}
