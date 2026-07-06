import type { AppRole, ClassMembershipRole } from "@/types";

export const CLASS_MEMBERSHIP_ROLES = {
  owner: "owner",
  teacher: "teacher",
  viewer: "viewer",
  student: "student",
} as const satisfies Record<ClassMembershipRole, ClassMembershipRole>;

export const STAFF_CLASS_ROLES: ClassMembershipRole[] = [
  CLASS_MEMBERSHIP_ROLES.owner,
  CLASS_MEMBERSHIP_ROLES.teacher,
  CLASS_MEMBERSHIP_ROLES.viewer,
];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  student: "תלמיד/ה",
  teacher: "מורה",
};
