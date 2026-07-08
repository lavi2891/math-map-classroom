import type { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/app/BottomNav";
import { APP_ROLE_LABELS } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import type { AppRole, Profile } from "@/types";

type AppShellProps = {
  children: ReactNode;
  headerControl?: ReactNode;
  navigationRole: AppRole;
  user: Profile;
};

export function AppShell({
  children,
  headerControl,
  navigationRole,
  user,
}: AppShellProps) {
  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-700">
              {APP_ROLE_LABELS[navigationRole]}
            </p>
            <h1 className="text-lg font-bold text-stone-950">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {headerControl}
            <Link
              className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700"
              href={ROUTES.logout}
            >
              יציאה
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">{children}</main>
      <BottomNav role={navigationRole} />
    </div>
  );
}
