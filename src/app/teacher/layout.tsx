import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { appMode, profile } = await requireAuth("teacher");

  return (
    <AppShell navigationRole={appMode} user={profile}>
      {children}
    </AppShell>
  );
}
