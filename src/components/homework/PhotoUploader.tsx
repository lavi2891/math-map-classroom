"use client";

import { useId } from "react";

type PhotoUploaderProps = {
  disabled?: boolean;
  error?: string;
  files: File[];
  onError: (error?: string) => void;
  onFilesChange: (files: File[]) => void;
  required?: boolean;
};

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function PhotoUploader({
  disabled = false,
  error,
  files,
  onError,
  onFilesChange,
  required = false,
}: PhotoUploaderProps) {
  const inputId = useId();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length > MAX_FILE_COUNT) {
      onError("אפשר לצרף עד 5 תמונות.");
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE_BYTES,
    );

    if (invalidFile) {
      onError("אפשר לצרף תמונות בלבד, עד 10MB לכל תמונה.");
      event.target.value = "";
      return;
    }

    onError(undefined);
    onFilesChange(selectedFiles);
  }

  return (
    <section className="grid min-w-0 gap-2 rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="grid min-w-0 gap-1">
        <label
          className="text-sm font-bold text-stone-950"
          htmlFor={inputId}
        >
          צילום מחברת
        </label>
        <p className="text-sm leading-6 text-stone-600">
          {required
            ? "המורה ביקש לצרף צילום של העבודה."
            : "אפשר לצרף צילום של העבודה."}
        </p>
      </div>
      <input
        accept="image/*"
        capture="environment"
        className="box-border min-h-11 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
        disabled={disabled}
        id={inputId}
        multiple
        onChange={handleChange}
        type="file"
      />
      {files.length > 0 ? (
        <ul className="grid min-w-0 gap-1 text-sm text-stone-700">
          {files.map((file) => (
            <li
              className="min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere]"
              key={`${file.name}-${file.size}`}
            >
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
    </section>
  );
}
