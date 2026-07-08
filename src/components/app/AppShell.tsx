import type { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/app/BottomNav";
import { APP_ROLE_LABELS } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import type { AppRole, Profile } from "@/types";

type AppShellProps = {
  children: ReactNode;
  headerControl?: ReactNode;
  headerSubtitle?: string;
  headerTitle?: string;
  navigationRole: AppRole;
  profileHref?: string;
  user: Profile;
};

export function AppShell({
  children,
  headerControl,
  headerSubtitle,
  headerTitle,
  navigationRole,
  profileHref,
  user,
}: AppShellProps) {
  const profileInitial = user.name.trim().slice(0, 1) || "פ";

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-teal-700">
              {headerSubtitle ?? APP_ROLE_LABELS[navigationRole]}
            </p>
            <h1 className="truncate text-lg font-bold text-stone-950">
              {headerTitle ?? user.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {headerControl}
            {profileHref ? (
              <Link
                aria-label="פרופיל"
                className="grid size-10 place-items-center rounded-full bg-stone-100 text-sm font-bold text-stone-700 transition hover:bg-stone-200"
                href={profileHref}
              >
                {profileInitial}
              </Link>
            ) : (
              <Link
                className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700"
                href={ROUTES.logout}
              >
                יציאה
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">{children}</main>
      <BottomNav role={navigationRole} />
    </div>
  );
}
