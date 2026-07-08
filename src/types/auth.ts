export type AppRole = "student" | "teacher";

export type ClassMembershipRole = "owner" | "teacher" | "viewer" | "student";

export type Profile = {
  archivedAt?: string;
  createdBy?: string;
  id: string;
  mustChangePassword?: boolean;
  name: string;
  passwordChangedAt?: string;
  username?: string;
};

export type ClassMembership = {
  classId: string;
  userId: string;
  role: ClassMembershipRole;
  active: boolean;
};
