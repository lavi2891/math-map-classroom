import type { ReactNode } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { AppShell } from "@/components/app/AppShell";
import { StudentClassSelector } from "@/components/student/StudentClassSelector";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getSelectedStudentClass } from "@/lib/db/classes";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { appMode, profile, user } = await requireAuth("student");
  const { classes, selectedClass } = await getSelectedStudentClass(user.id);

  if (!selectedClass) {
    return (
      <AppShell
        navigationRole={appMode}
        profileHref="/student/profile"
        user={profile}
      >
        <EmptyState
          title="לא נמצא שיוך לכיתה. פנה למורה."
          description="לא נמצאה כיתה פעילה לחשבון הזה."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      headerControl={
        <StudentClassSelector
          classes={classes}
          selectedClassId={selectedClass.id}
        />
      }
      headerSubtitle={profile.name}
      headerTitle={selectedClass.name}
      navigationRole={appMode}
      profileHref="/student/profile"
      user={profile}
    >
      {children}
    </AppShell>
  );
}
