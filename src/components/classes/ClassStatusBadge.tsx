type ClassStatusBadgeProps = {
  active: boolean;
};

export function ClassStatusBadge({ active }: ClassStatusBadgeProps) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700"
          : "rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-600"
      }
    >
      {active ? "פעילה" : "בארכיון"}
    </span>
  );
}
