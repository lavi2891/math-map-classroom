import type { Profile, Role } from "@/types";

export function requireRole(profile: Profile, role: Role) {
  if (profile.role !== role) {
    throw new Error(`Expected mock role "${role}" but received "${profile.role}".`);
  }

  return profile;
}
