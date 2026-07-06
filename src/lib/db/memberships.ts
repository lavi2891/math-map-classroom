import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { STAFF_CLASS_ROLES } from "@/lib/constants/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassMembership, ClassMembershipRole } from "@/types";

type MembershipRow = {
  class_id: string;
  user_id: string;
  role: ClassMembershipRole;
  active: boolean;
};

function toMembership(row: MembershipRow): ClassMembership {
  return {
    active: row.active,
    classId: row.class_id,
    role: row.role,
    userId: row.user_id,
  };
}

export async function getCurrentUserMemberships(): Promise<ClassMembership[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, user_id, role, active")
    .eq("user_id", user.id)
    .eq("active", true);

  if (error || !data) {
    return [];
  }

  return (data as MembershipRow[]).map(toMembership);
}

export async function getCurrentUserStaffMemberships() {
  const memberships = await getCurrentUserMemberships();

  return memberships.filter((membership) =>
    STAFF_CLASS_ROLES.includes(membership.role),
  );
}

export async function getCurrentUserStudentMemberships() {
  const memberships = await getCurrentUserMemberships();

  return memberships.filter((membership) => membership.role === "student");
}
