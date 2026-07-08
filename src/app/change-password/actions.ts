"use server";

import { redirect } from "next/navigation";
import { getAppMode } from "@/lib/auth/getAppMode";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentUserMemberships } from "@/lib/db/memberships";
import { recordOwnPasswordChanged } from "@/lib/db/studentManagement";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordChangeActionState = {
  error?: string;
  message?: string;
};

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function validatePasswords(formData: FormData) {
  const newPassword = getFormString(formData, "newPassword");
  const confirmPassword = getFormString(formData, "confirmPassword");

  if (newPassword.length < 8) {
    return { error: "הסיסמה החדשה חייבת לכלול לפחות 8 תווים." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "הסיסמאות אינן תואמות." };
  }

  return { newPassword };
}

async function updatePassword(formData: FormData) {
  const validation = validatePasswords(formData);

  if ("error" in validation) {
    return { error: validation.error };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "יש להתחבר מחדש כדי להחליף סיסמה." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: validation.newPassword,
  });

  if (error) {
    return { error: "לא הצלחנו לעדכן את הסיסמה." };
  }

  const saved = await recordOwnPasswordChanged(user.id);

  if (!saved) {
    return { error: "הסיסמה עודכנה, אבל לא הצלחנו לעדכן את הפרופיל." };
  }

  return { success: true };
}

export async function changeRequiredPasswordAction(
  _previousState: PasswordChangeActionState,
  formData: FormData,
): Promise<PasswordChangeActionState> {
  const result = await updatePassword(formData);

  if (!("success" in result)) {
    return { error: result.error };
  }

  const memberships = await getCurrentUserMemberships();
  const appMode = getAppMode(memberships);

  redirect(appMode === "teacher" ? ROUTES.teacherClasses : ROUTES.studentHome);
}

export async function updateOwnPasswordAction(
  _previousState: PasswordChangeActionState,
  formData: FormData,
): Promise<PasswordChangeActionState> {
  const result = await updatePassword(formData);

  if (!("success" in result)) {
    return { error: result.error };
  }

  return { message: "הסיסמה עודכנה בהצלחה" };
}
