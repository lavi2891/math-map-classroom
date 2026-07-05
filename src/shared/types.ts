export type UserRole = "student" | "teacher";

export type NavItem = {
  label: string;
  href: string;
};

export type MockUser = {
  id: string;
  name: string;
  role: UserRole;
};
