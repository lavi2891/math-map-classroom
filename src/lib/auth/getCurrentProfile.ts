import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

type ProfileRow = {
  archived_at: string | null;
  created_by: string | null;
  id: string;
  display_name: string | null;
  must_change_password: boolean | null;
  password_changed_at: string | null;
  username: string | null;
};

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, must_change_password, password_changed_at, created_by, archived_at",
    )
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error || !data) {
    return null;
  }

  return {
    archivedAt: data.archived_at ?? undefined,
    createdBy: data.created_by ?? undefined,
    id: data.id,
    mustChangePassword: data.must_change_password ?? false,
    name: data.display_name ?? data.username ?? "משתמש",
    passwordChangedAt: data.password_changed_at ?? undefined,
    username: data.username ?? undefined,
  };
}
