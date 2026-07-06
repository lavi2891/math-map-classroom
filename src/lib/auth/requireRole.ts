import type { AppRole, ClassMembership } from "@/types";
import { getNavigationRole } from "./getCurrentProfile";

export function requireNavigationRole(
  memberships: ClassMembership[],
  expectedRole: AppRole,
) {
  const actualRole = getNavigationRole(memberships);

  if (actualRole !== expectedRole) {
    throw new Error(
      `Expected mock navigation role "${expectedRole}" but received "${actualRole}".`,
    );
  }

  return actualRole;
}
