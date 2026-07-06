import { LoginForm } from "@/components/app/LoginForm";
import { NO_CLASS_MEMBERSHIP_ERROR } from "@/lib/auth/requireAuth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getInitialError(error?: string) {
  if (error === "no-membership") {
    return NO_CLASS_MEMBERSHIP_ERROR;
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main
      dir="rtl"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8"
    >
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">כניסה למערכת</p>
        <h1 className="mt-2 text-3xl font-bold text-stone-950">
          מפת מתמטיקה כיתתית
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          התחברו כמורה באמצעות אימייל וסיסמה, או כתלמיד/ה באמצעות קוד כיתה,
          קוד תלמיד וסיסמה.
        </p>
        <LoginForm initialError={getInitialError(params?.error)} />
      </section>
    </main>
  );
}
