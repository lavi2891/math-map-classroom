import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { getMockProfile } from "@/lib/auth/getCurrentProfile";

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { navigationRole, profile } = getMockProfile("student");

  return (
    <AppShell navigationRole={navigationRole} user={profile}>
      {children}
    </AppShell>
  );
}
