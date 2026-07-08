import Link from "next/link";
import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { TeacherStudentManagementPanel } from "@/components/teacher/TeacherStudentManagementPanel";
import { getTeacherClasses } from "@/lib/db/classes";
import { getManagedStudents } from "@/lib/db/studentManagement";

type TeacherClassStudentsPageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function TeacherClassStudentsPage({
  params,
}: TeacherClassStudentsPageProps) {
  const { classId } = await params;
  const classes = await getTeacherClasses();
  const classSummary = classes.find((item) => item.id === classId);

  if (!classSummary || classSummary.role === "viewer") {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="ניהול תלמידים"
          title="אין הרשאה לניהול הכיתה"
          description="רק בעלים או מורה בכיתה יכולים לנהל תלמידים וסיסמאות."
        />
        <EmptyState
          title="הכיתה לא זמינה לניהול"
          description="בדוק שנכנסת עם חשבון מורה שיש לו הרשאת ניהול בכיתה."
        />
      </div>
    );
  }

  const students = await getManagedStudents(classId);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="ניהול תלמידים"
        title={`כיתה ${classSummary.name}`}
        description="יצירת תלמידים, איפוס סיסמאות והדפסת פרטי כניסה זמניים."
      />
      <Link
        className="inline-flex min-h-11 items-center rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
        href="/teacher/classes"
      >
        חזרה לכיתות
      </Link>
      <TeacherStudentManagementPanel
        classId={classId}
        className={classSummary.name}
        students={students}
      />
    </div>
  );
}
