"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteHomeworkFileAction } from "@/app/student/homework/actions";
import type { HomeworkFile } from "@/types";

type HomeworkFileListProps = {
  files?: HomeworkFile[];
  onFileDeleted?: (fileId: string) => void;
  removable?: boolean;
};

export function HomeworkFileList({
  files = [],
  onFileDeleted,
  removable = false,
}: HomeworkFileListProps) {
  const [deleteFile, setDeleteFile] = useState<HomeworkFile | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (files.length === 0) {
    return null;
  }

  function handleDelete() {
    if (!deleteFile) {
      return;
    }

    const formData = new FormData();
    formData.set("fileId", deleteFile.id);
    setError(undefined);

    startTransition(async () => {
      const result = await deleteHomeworkFileAction(formData);

      if (!result.success) {
        setError(result.error ?? "לא הצלחנו להסיר את הצילום. נסה שוב.");
        return;
      }

      onFileDeleted?.(deleteFile.id);
      setDeleteFile(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-bold text-stone-700">צילומים שצורפו</p>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {files.map((file) => (
          <div
            className="relative grid gap-2 rounded-md border border-stone-200 bg-stone-50 p-2"
            key={file.id}
          >
            <a
              className="grid gap-2 text-sm font-bold text-teal-700 transition hover:text-teal-800"
              href={file.signedUrl}
              rel="noreferrer"
              target="_blank"
            >
              {file.signedUrl && file.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={file.fileName}
                  className="h-28 w-full rounded-md object-cover"
                  src={file.signedUrl}
                />
              ) : null}
              <span>פתח צילום: {file.fileName}</span>
            </a>
            {removable ? (
              <button
                aria-label="הסר צילום"
                className="absolute left-3 top-3 grid min-h-10 min-w-10 place-items-center rounded-full border border-stone-200 bg-white text-lg font-bold leading-none text-stone-700 shadow-sm transition hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteFile(file)}
                title="הסר צילום"
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {deleteFile ? (
        <div
          aria-labelledby="remove-homework-photo-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
            <h2
              className="text-lg font-bold text-stone-950"
              id="remove-homework-photo-title"
            >
              להסיר את הצילום?
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              הצילום יוסר מההגשה. אם תרצה, תוכל להעלות צילום חדש.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                disabled={isPending}
                onClick={() => setDeleteFile(null)}
                type="button"
              >
                ביטול
              </button>
              <button
                className="min-h-11 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-60"
                disabled={isPending}
                onClick={handleDelete}
                type="button"
              >
                {isPending ? "מסיר..." : "הסר"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
