export type HomeworkAssignment = {
  id: string;
  classId?: string;
  className?: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedCount: number;
  doneCount?: number;
  partialUnderstandingCount?: number;
  noUnderstandingCount?: number;
  submissionCount?: number;
  totalCount: number;
};

export type HomeworkStatus = "not_started" | "started" | "done";

export type UnderstandingLevel = "good" | "partial" | "no" | "unknown";
