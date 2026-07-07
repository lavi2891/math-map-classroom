import type { HomeworkFile } from "@/types";

type HomeworkFileListProps = {
  files?: HomeworkFile[];
};

export function HomeworkFileList({ files = [] }: HomeworkFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-bold text-stone-700">צילומים שצורפו</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {files.map((file) => (
          <a
            className="grid gap-2 rounded-md border border-stone-200 bg-stone-50 p-2 text-sm font-bold text-teal-700 transition hover:bg-stone-100"
            href={file.signedUrl}
            key={file.id}
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
        ))}
      </div>
    </div>
  );
}
