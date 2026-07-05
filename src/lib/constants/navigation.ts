import type { NavItem } from "@/types";
import { ROUTES } from "@/lib/constants/routes";

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: "בית", href: ROUTES.studentHome },
  { label: "כיתה", href: ROUTES.studentClass },
  { label: "מפת ידע", href: ROUTES.studentKnowledge },
  { label: "תרגול", href: ROUTES.studentPractice },
  { label: "פרופיל", href: ROUTES.studentProfile },
];

export const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: "כיתות", href: ROUTES.teacherClasses },
  { label: "שיעורי בית", href: ROUTES.teacherHomework },
  { label: "הודעות", href: ROUTES.teacherAnnouncements },
  { label: "מצב", href: ROUTES.teacherStatus },
  { label: "פרופיל", href: ROUTES.teacherProfile },
];
