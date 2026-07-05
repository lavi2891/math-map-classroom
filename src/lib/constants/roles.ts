import type { Role } from "@/types";

export const ROLES = {
  student: "student",
  teacher: "teacher",
} as const satisfies Record<Role, Role>;

export const ROLE_LABELS: Record<Role, string> = {
  student: "תלמיד/ה",
  teacher: "מורה",
};
