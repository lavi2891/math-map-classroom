import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { mockStudent } from "@/shared/mockAuth";
import { studentNavItems } from "@/shared/navigation";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navItems={studentNavItems} user={mockStudent}>
      {children}
    </AppShell>
  );
}
