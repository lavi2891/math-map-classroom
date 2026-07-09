import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getAppMode } from "@/lib/auth/getAppMode";
import { SELECTED_STUDENT_CLASS_COOKIE } from "@/lib/db/classes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassMembership, ClassMembershipRole } from "@/types";

type MembershipRow = {
  active: boolean;
  class_id: string;
  role: ClassMembershipRole;
  user_id: string;
};

function toMembership(row: MembershipRow): ClassMembership {
  return {
    active: row.active,
    classId: row.class_id,
    role: row.role,
    userId: row.user_id,
  };
}

export default async function DevelopmentSecurityPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("class_memberships")
        .select("class_id, user_id, role, active")
        .eq("user_id", user.id)
        .eq("active", true)
    : { data: [] };

  const memberships = ((data ?? []) as MembershipRow[]).map(toMembership);
  const selectedClassId =
    cookieStore.get(SELECTED_STUDENT_CLASS_COOKIE)?.value ?? null;
  const appMode = getAppMode(memberships);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-4 text-right">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-amber-700">פיתוח בלבד</p>
        <h1 className="text-2xl font-bold text-slate-950">בדיקת הרשאות</h1>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-950">משתמש נוכחי</h2>
        <dl className="grid gap-2 text-sm text-slate-700">
          <div className="flex justify-between gap-3">
            <dt className="font-medium">Auth user id</dt>
            <dd className="break-all text-left" dir="ltr">
              {user?.id ?? "לא מחובר"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-medium">מצב אפליקציה</dt>
            <dd>{appMode ?? "לא זוהה"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-medium">כיתה נבחרת</dt>
            <dd className="break-all text-left" dir="ltr">
              {selectedClassId ?? "אין"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-950">שיוכים פעילים</h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-slate-600">לא נמצאו שיוכים פעילים.</p>
        ) : (
          <ul className="space-y-3">
            {memberships.map((membership) => (
              <li
                className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700"
                key={`${membership.classId}-${membership.userId}`}
              >
                <div className="flex justify-between gap-3">
                  <span className="font-medium">class_id</span>
                  <span className="break-all text-left" dir="ltr">
                    {membership.classId}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-medium">role</span>
                  <span>{membership.role}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-medium">active</span>
                  <span>{membership.active ? "true" : "false"}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
