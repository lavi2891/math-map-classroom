import type { ReactNode } from "react";
import { BottomNav } from "@/components/app/BottomNav";
import type { Profile } from "@/types";

type AppShellProps = {
  children: ReactNode;
  user: Profile;
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-700">
              {user.role === "student" ? "תלמיד/ה" : "מורה"}
            </p>
            <h1 className="text-lg font-bold text-stone-950">{user.name}</h1>
          </div>
          <span className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
            Mock
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">{children}</main>
      <BottomNav role={user.role} />
    </div>
  );
}
