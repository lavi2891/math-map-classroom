import type { AnnouncementReadDetails as ReadDetails } from "@/types";

export function AnnouncementReadDetails({ details }: { details: ReadDetails }) {
  return (
    <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <summary className="cursor-pointer text-sm font-bold text-teal-700">
        פירוט אישורי קריאה
      </summary>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-stone-950">סימנו שקראו</p>
          <ul className="mt-2 grid gap-1 text-sm text-stone-600">
            {details.read.length > 0 ? (
              details.read.map((student) => (
                <li key={student.userId}>{student.name}</li>
              ))
            ) : (
              <li>אין עדיין אישורי קריאה.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-stone-950">טרם סימנו</p>
          <ul className="mt-2 grid gap-1 text-sm text-stone-600">
            {details.unread.length > 0 ? (
              details.unread.map((student) => (
                <li key={student.userId}>{student.name}</li>
              ))
            ) : (
              <li>כולם סימנו שקראו.</li>
            )}
          </ul>
        </div>
      </div>
    </details>
  );
}
