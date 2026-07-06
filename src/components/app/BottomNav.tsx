"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  STUDENT_NAV_ITEMS,
  TEACHER_NAV_ITEMS,
} from "@/lib/constants/navigation";
import type { AppRole } from "@/types";

type BottomNavProps = {
  role: AppRole;
};

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = role === "student" ? STUDENT_NAV_ITEMS : TEACHER_NAV_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-10px_30px_rgba(23,23,23,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 items-center justify-center rounded-md px-1 text-center text-xs font-semibold transition ${
                isActive
                  ? "bg-teal-700 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
