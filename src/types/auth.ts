export type AppRole = "student" | "teacher";

export type ClassMembershipRole = "owner" | "teacher" | "viewer" | "student";

export type Profile = {
  id: string;
  name: string;
};

export type ClassMembership = {
  classId: string;
  userId: string;
  role: ClassMembershipRole;
  active: boolean;
};
