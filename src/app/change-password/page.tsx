import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ROUTES } from "@/lib/constants/routes";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return (
    <main
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8"
      dir="rtl"
    >
      <div className="space-y-4">
        <PageHeader
          eyebrow="אבטחה"
          title="נדרשת החלפת סיסמה"
          description="בחר/י סיסמה חדשה כדי להמשיך למערכת."
        />
        <PasswordChangeForm required />
      </div>
    </main>
  );
}
