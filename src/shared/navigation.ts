import type { NavItem } from "./types";

export const studentNavItems: NavItem[] = [
  { label: "בית", href: "/student/home" },
  { label: "כיתה", href: "/student/class" },
  { label: "מפת ידע", href: "/student/knowledge" },
  { label: "תרגול", href: "/student/practice" },
  { label: "פרופיל", href: "/student/profile" },
];

export const teacherNavItems: NavItem[] = [
  { label: "כיתות", href: "/teacher/classes" },
  { label: "שיעורי בית", href: "/teacher/homework" },
  { label: "הודעות", href: "/teacher/announcements" },
  { label: "מצב", href: "/teacher/status" },
  { label: "פרופיל", href: "/teacher/profile" },
];
