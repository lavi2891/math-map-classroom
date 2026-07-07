"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitHomework } from "@/app/student/homework/actions";
import type { HomeworkSubmissionActionState } from "@/app/student/homework/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/homework/PhotoUploader";
import {
  homeworkStatusLabels,
  understandingLabels,
} from "@/components/homework/homeworkLabels";
import type {
  HomeworkFile,
  HomeworkStatus,
  HomeworkSubmissionDetail,
  UnderstandingLevel,
} from "@/types";

type HomeworkSubmissionFormProps = {
  existingFiles?: HomeworkFile[];
  homeworkId: string;
  onSuccess: () => void;
  requirePhoto?: boolean;
  submission?: HomeworkSubmissionDetail;
};

const statusOptions: HomeworkStatus[] = ["not_started", "started", "done"];
const understandingOptions: UnderstandingLevel[] = [
  "good",
  "partial",
  "no",
  "unknown",
];

const controlClass =
  "box-border min-h-11 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-base text-stone-950";

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function HomeworkSubmissionForm({
  existingFiles = [],
  homeworkId,
  onSuccess,
  requirePhoto = false,
  submission,
}: HomeworkSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(submitHomework, {
    success: false,
  } satisfies HomeworkSubmissionActionState);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const handledSubmissionId = useRef<string | undefined>(undefined);

  useEffect(() => {
    async function uploadFiles() {
      if (
        !state.success ||
        !state.submissionId ||
        !state.userId ||
        handledSubmissionId.current === state.submissionId
      ) {
        return;
      }

      handledSubmissionId.current = state.submissionId;

      if (files.length === 0) {
        onSuccess();
        return;
      }

      setIsUploading(true);
      setFileError(undefined);

      const supabase = createSupabaseBrowserClient();

      for (const [index, file] of files.entries()) {
        const filePath = `${state.userId}/${homeworkId}/${Date.now()}-${index}-${
          safeFileName(file.name) || "photo"
        }`;
        const { error: uploadError } = await supabase.storage
          .from("homework-submissions")
          .upload(filePath, file, {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          setFileError("לא הצלחנו להעלות את הצילום. נסו שוב.");
          setIsUploading(false);
          handledSubmissionId.current = undefined;
          return;
        }

        const { error: metadataError } = await supabase
          .from("homework_files")
          .insert({
            file_name: file.name,
            file_path: filePath,
            mime_type: file.type || null,
            size_bytes: file.size,
            submission_id: state.submissionId,
          });

        if (metadataError) {
          setFileError("הצילום עלה, אבל לא הצלחנו לשמור את הפרטים שלו.");
          setIsUploading(false);
          handledSubmissionId.current = undefined;
          return;
        }
      }

      setIsUploading(false);
      onSuccess();
    }

    void uploadFiles();
  }, [files, homeworkId, onSuccess, state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (requirePhoto && existingFiles.length === 0 && files.length === 0) {
      event.preventDefault();
      setFileError("המורה ביקש לצרף צילום של העבודה.");
    }
  }

  const isBusy = isPending || isUploading;

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-3"
      dir="rtl"
      onSubmit={handleSubmit}
    >
      <input name="homeworkId" type="hidden" value={homeworkId} />

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        מצב ביצוע
        <select
          className={controlClass}
          defaultValue={submission?.status ?? "not_started"}
          disabled={isBusy}
          name="status"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {homeworkStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        איך הבנתי?
        <select
          className={controlClass}
          defaultValue={submission?.understanding ?? "unknown"}
          disabled={isBusy}
          name="understanding"
        >
          {understandingOptions.map((level) => (
            <option key={level} value={level}>
              {understandingLabels[level]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-700">
        הערה למורה
        <textarea
          className="box-border min-h-24 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-base text-stone-950"
          defaultValue={submission?.note}
          disabled={isBusy}
          name="note"
        />
      </label>

      {requirePhoto ? (
        <PhotoUploader
          disabled={isBusy}
          error={fileError}
          files={files}
          onError={setFileError}
          onFilesChange={setFiles}
          required
        />
      ) : null}

      {state.error ? (
        <p className="text-sm font-bold text-red-700">{state.error}</p>
      ) : null}
      {isUploading ? (
        <p className="text-sm font-bold text-teal-700">מעלה צילום...</p>
      ) : null}
      {state.success && !fileError && files.length > 0 && !isUploading ? (
        <p className="text-sm font-bold text-emerald-700">הצילום נשמר.</p>
      ) : null}

      <button
        className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
        disabled={isBusy}
        type="submit"
      >
        {isBusy
          ? "שולח..."
          : submission?.id
            ? "עדכן הגשה"
            : "שלח הגשה"}
      </button>
    </form>
  );
}
