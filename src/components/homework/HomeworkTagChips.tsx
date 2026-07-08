import type { HomeworkTag } from "@/types";

type HomeworkTagChipsProps = {
  maxVisible?: number;
  tags: HomeworkTag[];
};

export function HomeworkTagChips({ maxVisible = 3, tags }: HomeworkTagChipsProps) {
  if (tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <span
          className="max-w-full truncate rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800"
          key={tag.id}
          title={`#${tag.label}`}
        >
          #{tag.label}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-600">
          ועוד {hiddenCount}
        </span>
      ) : null}
    </div>
  );
}
