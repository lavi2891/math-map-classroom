import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { mockStudentProfile } from "@/data/mock";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <AppShell user={mockStudentProfile}>{children}</AppShell>;
}
