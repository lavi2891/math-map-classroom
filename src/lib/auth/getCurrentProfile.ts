import {
  mockStudentMemberships,
  mockStudentProfile,
  mockTeacherMemberships,
  mockTeacherProfile,
} from "@/data/mock";
import { STAFF_CLASS_ROLES } from "@/lib/constants/roles";
import type { AppRole, ClassMembership, Profile } from "@/types";

export function getNavigationRole(memberships: ClassMembership[]): AppRole {
  const activeMemberships = memberships.filter((membership) => membership.active);

  if (
    activeMemberships.some((membership) =>
      STAFF_CLASS_ROLES.includes(membership.role),
    )
  ) {
    return "teacher";
  }

  return "student";
}

export function getMockProfile(appRole: AppRole): {
  profile: Profile;
  memberships: ClassMembership[];
  navigationRole: AppRole;
} {
  const profile = appRole === "student" ? mockStudentProfile : mockTeacherProfile;
  const memberships =
    appRole === "student" ? mockStudentMemberships : mockTeacherMemberships;

  return {
    profile,
    memberships,
    navigationRole: getNavigationRole(memberships),
  };
}

export function getCurrentProfile() {
  return getMockProfile("student");
}
