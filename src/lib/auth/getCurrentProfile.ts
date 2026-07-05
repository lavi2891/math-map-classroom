import { mockStudentProfile, mockTeacherProfile } from "@/data/mock";
import type { Profile, Role } from "@/types";

export function getMockProfile(role: Role): Profile {
  return role === "student" ? mockStudentProfile : mockTeacherProfile;
}

export function getCurrentProfile(): Profile {
  return mockStudentProfile;
}
