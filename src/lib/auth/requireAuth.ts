import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getAppMode } from "@/lib/auth/getAppMode";
import { getCurrentMemberships } from "@/lib/auth/getCurrentMemberships";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { AppRole } from "@/types";

export const NO_CLASS_MEMBERSHIP_ERROR =
  "לא נמצא שיוך לכיתה. פנה למורה.";

function homeRouteForMode(mode: AppRole) {
  return mode === "teacher" ? ROUTES.teacherClasses : ROUTES.studentHome;
}

export async function requireAuth(expectedMode?: AppRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const [profile, memberships] = await Promise.all([
    getCurrentProfile(user.id),
    getCurrentMemberships(user.id),
  ]);
  const appMode = getAppMode(memberships);

  if (!appMode) {
    redirect(`${ROUTES.login}?error=no-membership`);
  }

  if (expectedMode && appMode !== expectedMode) {
    redirect(homeRouteForMode(appMode));
  }

  return {
    appMode,
    memberships,
    profile: profile ?? {
      id: user.id,
      name: user.email ?? "משתמש",
    },
    user,
  };
}
