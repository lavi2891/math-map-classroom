export type HomeworkStatus = "not_started" | "started" | "done";

export type UnderstandingLevel = "good" | "partial" | "no" | "unknown";

export type HomeworkFile = {
  id: string;
  filePath: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  signedUrl?: string;
};

export type HomeworkSubmissionSummary = {
  id: string;
  studentId: string;
  studentName: string;
  status: HomeworkStatus;
  understanding: UnderstandingLevel;
  note?: string;
  submittedAt?: string;
  files: HomeworkFile[];
};

export type HomeworkAssignment = {
  id: string;
  classId?: string;
  className?: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedCount: number;
  doneCount?: number;
  files?: HomeworkFile[];
  noUnderstandingCount?: number;
  partialUnderstandingCount?: number;
  submissionCount?: number;
  submissions?: HomeworkSubmissionSummary[];
  totalCount: number;
};
