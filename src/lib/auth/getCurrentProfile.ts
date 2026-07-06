import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
};

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.display_name ?? data.username ?? "משתמש",
  };
}
