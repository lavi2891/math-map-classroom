import Link from "next/link";
import { mockStudent, mockTeacher } from "@/shared/mockAuth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">כניסה מדומה</p>
        <h1 className="mt-2 text-3xl font-bold text-stone-950">
          מפת מתמטיקה כיתתית
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          בחרו תפקיד כדי להיכנס למעטפת האפליקציה. אין כאן חיבור למסד נתונים,
          Supabase או אימות אמיתי.
        </p>

        <div className="mt-6 grid gap-3">
          <Link
            href="/student/home"
            className="rounded-md bg-teal-700 px-4 py-3 text-center font-bold text-white transition hover:bg-teal-800"
          >
            כניסה כתלמיד/ה - {mockStudent.name}
          </Link>
          <Link
            href="/teacher/classes"
            className="rounded-md bg-stone-900 px-4 py-3 text-center font-bold text-white transition hover:bg-stone-800"
          >
            כניסה כמורה - {mockTeacher.name}
          </Link>
        </div>
      </section>
    </main>
  );
}
