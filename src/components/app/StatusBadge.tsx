import type { ReactNode } from "react";

export type StatusBadgeTone = "danger" | "neutral" | "success" | "warning";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  danger: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-stone-200 bg-stone-50 text-stone-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-sm font-bold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
