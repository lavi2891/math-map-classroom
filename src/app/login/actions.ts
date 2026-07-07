"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getAppMode } from "@/lib/auth/getAppMode";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { NO_CLASS_MEMBERSHIP_ERROR } from "@/lib/auth/requireAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassMembership, ClassMembershipRole } from "@/types";

export type LoginActionState = {
  debug?: LoginDebugInfo;
  error?: string;
};

type LoginDebugInfo = {
  authEmail?: string;
  authUserId?: string;
  memberships: ClassMembership[];
  queryError?: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ClassMembershipRow = {
  active: boolean;
  class_id: string;
  role: ClassMembershipRole;
  user_id: string;
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

function toMembership(row: ClassMembershipRow): ClassMembership {
  return {
    active: row.active,
    classId: row.class_id,
    role: row.role,
    userId: row.user_id,
  };
}

function getDevelopmentDebug(debug: LoginDebugInfo) {
  return process.env.NODE_ENV === "development" ? debug : undefined;
}

function logMembershipDebug(debug: LoginDebugInfo) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("[login] membership debug", debug);
}

async function getLoggedInMemberships(
  supabase: SupabaseServerClient,
): Promise<LoginDebugInfo> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      authEmail: user?.email,
      authUserId: user?.id,
      memberships: [],
      queryError: userError?.message ?? "No authenticated Supabase user found.",
    };
  }

  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, user_id, role, active")
    .eq("user_id", user.id)
    .eq("active", true);

  const debug = {
    authEmail: user.email,
    authUserId: user.id,
    memberships: data
      ? (data as unknown as ClassMembershipRow[]).map(toMembership)
      : [],
    queryError: error?.message,
  };

  logMembershipDebug(debug);

  return debug;
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
  const debug = await getLoggedInMemberships(supabase);
  const appMode = getAppMode(debug.memberships);

  if (!appMode) {
    await supabase.auth.signOut();

    return {
      debug: getDevelopmentDebug(debug),
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
