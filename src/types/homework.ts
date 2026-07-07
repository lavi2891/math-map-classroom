export type HomeworkStatus = "not_started" | "started" | "done";

export type UnderstandingLevel = "good" | "partial" | "no" | "unknown";

export type StudentHomeworkHistoryFilter =
  | "all"
  | "open"
  | "overdue"
  | "submitted";

export type HomeworkSubmissionSummary = {
  doneCount: number;
  goodUnderstandingCount: number;
  noUnderstandingCount: number;
  notStartedCount: number;
  partialUnderstandingCount: number;
  startedCount: number;
  submittedCount: number;
  totalStudentCount: number;
};

export type HomeworkFile = {
  fileName: string;
  filePath: string;
  id: string;
  mimeType?: string;
  signedUrl?: string;
  sizeBytes?: number;
};

export type HomeworkSubmissionDetail = {
  files?: HomeworkFile[];
  id?: string;
  isLate?: boolean;
  note?: string;
  status?: HomeworkStatus;
  studentId: string;
  studentName: string;
  submittedAt?: string;
  understanding?: UnderstandingLevel;
};

export type HomeworkAssignment = {
  id: string;
  allowLateSubmission: boolean;
  allowExternalUrl: boolean;
  canSubmit: boolean;
  classId: string;
  className?: string;
  description: string;
  dueAt?: string;
  dueDate?: string;
  deletedAt?: string;
  externalUrl?: string;
  isHidden: boolean;
  isOverdue: boolean;
  lateSubmissionUntil?: string;
  lateSubmissionUntilDate?: string;
  requirePhoto: boolean;
  requireStatus: boolean;
  requireUnderstanding: boolean;
  submission?: HomeworkSubmissionDetail;
  submissionDetails?: HomeworkSubmissionDetail[];
  submissionSummary: HomeworkSubmissionSummary;
  title: string;
  visibleFrom: string;
};
