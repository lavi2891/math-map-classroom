import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { mockTeacherProfile } from "@/data/mock";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <AppShell user={mockTeacherProfile}>{children}</AppShell>;
}
