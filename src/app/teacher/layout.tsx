import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { mockTeacher } from "@/shared/mockAuth";
import { teacherNavItems } from "@/shared/navigation";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navItems={teacherNavItems} user={mockTeacher}>
      {children}
    </AppShell>
  );
}
