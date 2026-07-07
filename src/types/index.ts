export type {
  AppRole,
  ClassMembership,
  ClassMembershipRole,
  Profile,
} from "./auth";
export type { ClassFeedItem, ClassSummary } from "./classes";
export type {
  HomeworkAssignment,
  HomeworkSubmissionDetail,
  HomeworkSubmissionSummary,
  HomeworkStatus,
  UnderstandingLevel,
} from "./homework";
export type {
  Announcement,
  AnnouncementCategory,
  AnnouncementLink,
  AnnouncementReadDetails,
  AnnouncementReadParticipant,
} from "./announcements";
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
