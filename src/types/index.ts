export type { Profile, Role } from "./auth";
export type { ClassFeedItem, ClassSummary } from "./classes";
export type { HomeworkAssignment } from "./homework";
export type { Announcement } from "./announcements";
export type {
  KnowledgeDomain,
  KnowledgeSkill,
  KnowledgeSkillStatus,
} from "./knowledge";

export type NavItem = {
  label: string;
  href: string;
};

export type AppCard = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};
