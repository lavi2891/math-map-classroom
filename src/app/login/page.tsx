import { RoleSwitch } from "@/components/app/RoleSwitch";

export default function LoginPage() {
  return (
    <main
      dir="rtl"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8"
    >
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">
          כניסה מדומה לפיתוח
        </p>
        <h1 className="mt-2 text-3xl font-bold text-stone-950">
          מפת מתמטיקה כיתתית
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          בחרו תפקיד כדי להיכנס למעטפת האפליקציה. הבחירה נשמרת מקומית בלבד,
          בלי אימות אמיתי, מסד נתונים או חיבור ל-Supabase.
        </p>
        <RoleSwitch />
      </section>
    </main>
  );
}
