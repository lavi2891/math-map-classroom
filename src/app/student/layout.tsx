import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { appMode, profile } = await requireAuth("student");

  return (
    <AppShell navigationRole={appMode} user={profile}>
      {children}
    </AppShell>
  );
}
