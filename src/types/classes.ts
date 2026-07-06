export type ClassSummary = {
  id: string;
  name: string;
  grade: number;
  classCode: string;
  role?: string;
  studentCount: number;
  focus?: string;
};

export type ClassFeedItem = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};
