export function AnnouncementPlainBody({ body }: { body: string }) {
  return (
    <p className="whitespace-pre-line text-sm leading-6 text-stone-700">
      {body}
    </p>
  );
}
