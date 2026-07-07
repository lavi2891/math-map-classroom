export type AnnouncementCategory = "general" | "exam" | "reminder" | "material";

export type AnnouncementLink = {
  id: string;
  title: string;
  url: string;
  sortOrder: number;
};

export type AnnouncementReadParticipant = {
  userId: string;
  name: string;
  readAt?: string;
};

export type AnnouncementReadDetails = {
  read: AnnouncementReadParticipant[];
  unread: AnnouncementReadParticipant[];
};

export type Announcement = {
  id: string;
  classId: string;
  className?: string;
  title: string;
  body: string;
  audience: string;
  category: AnnouncementCategory;
  isHidden: boolean;
  isPinned: boolean;
  requireReadConfirmation: boolean;
  visibleFrom: string;
  visibleUntil?: string;
  deletedAt?: string;
  links: AnnouncementLink[];
  readAt?: string;
  readCount?: number;
  totalStudentCount?: number;
  readDetails?: AnnouncementReadDetails;
};
