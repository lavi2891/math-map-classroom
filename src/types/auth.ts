export type Role = "student" | "teacher";

export type Profile = {
  id: string;
  name: string;
  role: Role;
};
