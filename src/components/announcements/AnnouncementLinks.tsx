import type { AnnouncementLink } from "@/types";

export function AnnouncementLinks({ links }: { links: AnnouncementLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-bold text-stone-950">קישורים</p>
      <div className="grid gap-2">
        {links.map((link) => (
          <a
            className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-teal-700"
            href={link.url}
            key={link.id}
            rel="noreferrer"
            target="_blank"
          >
            {link.title}
          </a>
        ))}
      </div>
    </div>
  );
}
