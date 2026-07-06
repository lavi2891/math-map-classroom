import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassMembership, ClassMembershipRole } from "@/types";

type ClassMembershipRow = {
  class_id: string;
  user_id: string;
  role: ClassMembershipRole;
  active: boolean;
};

export async function getCurrentMemberships(
  userId: string,
): Promise<ClassMembership[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, user_id, role, active")
    .eq("user_id", userId)
    .eq("active", true);

  if (error || !data) {
    return [];
  }

  return (data as ClassMembershipRow[]).map((membership) => ({
    classId: membership.class_id,
    userId: membership.user_id,
    role: membership.role,
    active: membership.active,
  }));
}
