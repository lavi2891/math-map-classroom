import { NextResponse, type NextRequest } from "next/server";
import { getAppMode } from "@/lib/auth/getAppMode";
import { ROUTES } from "@/lib/constants/routes";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import type { ClassMembership, ClassMembershipRole } from "@/types";

type MembershipRow = {
  class_id: string;
  user_id: string;
  role: ClassMembershipRole;
  active: boolean;
};

function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

function redirectWithAuthCookies(
  request: NextRequest,
  response: NextResponse,
  path: string,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = path;
  redirectUrl.search = "";

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyAuthCookies(response, redirectResponse);

  return redirectResponse;
}

function redirectToNoMembership(request: NextRequest, response: NextResponse) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = ROUTES.login;
  redirectUrl.searchParams.set("error", "no-membership");

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyAuthCookies(response, redirectResponse);

  return redirectResponse;
}

function toMembership(row: MembershipRow): ClassMembership {
  return {
    active: row.active,
    classId: row.class_id,
    role: row.role,
    userId: row.user_id,
  };
}

export async function middleware(request: NextRequest) {
  const { response, supabase } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectWithAuthCookies(request, response, ROUTES.login);
  }

  const { data, error: membershipsError } = await supabase
    .from("class_memberships")
    .select("class_id, user_id, role, active")
    .eq("user_id", user.id)
    .eq("active", true);

  if (membershipsError || !data) {
    return redirectToNoMembership(request, response);
  }

  const appMode = getAppMode((data as MembershipRow[]).map(toMembership));

  if (!appMode) {
    return redirectToNoMembership(request, response);
  }

  if (
    request.nextUrl.pathname.startsWith("/student") &&
    appMode !== "student"
  ) {
    return redirectWithAuthCookies(request, response, ROUTES.teacherClasses);
  }

  if (
    request.nextUrl.pathname.startsWith("/teacher") &&
    appMode !== "teacher"
  ) {
    return redirectWithAuthCookies(request, response, ROUTES.studentHome);
  }

  return response;
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*"],
};
