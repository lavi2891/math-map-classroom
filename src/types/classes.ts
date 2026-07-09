export type ClassSummary = {
  active: boolean;
  archivedAt?: string;
  id: string;
  name: string;
  displayName?: string;
  grade: number;
  classCode: string;
  role?: string;
  schoolYear?: string;
  studentCount: number;
  focus?: string;
};

export type ClassFeedItem = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};
