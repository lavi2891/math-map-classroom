"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getAppMode } from "@/lib/auth/getAppMode";
import { getCurrentMemberships } from "@/lib/auth/getCurrentMemberships";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { NO_CLASS_MEMBERSHIP_ERROR } from "@/lib/auth/requireAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
};

function getRequiredString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getStudentEmail(classCode: string, studentCode: string) {
  return `${classCode.toLowerCase()}${studentCode.toLowerCase()}@students.local`;
}

function getHomeRoute(appMode: "student" | "teacher") {
  return appMode === "teacher" ? ROUTES.teacherClasses : ROUTES.studentHome;
}

async function signInAndGetRedirect(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "פרטי ההתחברות שגויים.",
    };
  }

  await getCurrentProfile(data.user.id);
  const memberships = await getCurrentMemberships(data.user.id);
  const appMode = getAppMode(memberships);

  if (!appMode) {
    await supabase.auth.signOut();

    return {
      error: NO_CLASS_MEMBERSHIP_ERROR,
    };
  }

  return {
    redirectTo: getHomeRoute(appMode),
  };
}

export async function loginTeacher(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    return {
      error: "יש להזין אימייל וסיסמה.",
    };
  }

  const result = await signInAndGetRedirect(email, password);

  if ("error" in result) {
    return {
      error: result.error,
    };
  }

  redirect(result.redirectTo);
}

export async function loginStudent(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const classCode = getRequiredString(formData, "classCode");
  const studentCode = getRequiredString(formData, "studentCode");
  const password = getRequiredString(formData, "password");

  if (!classCode || !studentCode || !password) {
    return {
      error: "יש להזין קוד כיתה, קוד תלמיד וסיסמה.",
    };
  }

  const result = await signInAndGetRedirect(
    getStudentEmail(classCode, studentCode),
    password,
  );

  if ("error" in result) {
    return {
      error: result.error,
    };
  }

  redirect(result.redirectTo);
}
