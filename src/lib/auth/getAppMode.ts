import { STAFF_CLASS_ROLES } from "@/lib/constants/roles";
import type { AppRole, ClassMembership } from "@/types";

export function getAppMode(memberships: ClassMembership[]): AppRole | null {
  const activeMemberships = memberships.filter((membership) => membership.active);

  if (
    activeMemberships.some((membership) =>
      STAFF_CLASS_ROLES.includes(membership.role),
    )
  ) {
    return "teacher";
  }

  if (activeMemberships.some((membership) => membership.role === "student")) {
    return "student";
  }

  return null;
}
