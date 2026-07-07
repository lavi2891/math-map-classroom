export type HomeworkStatus = "not_started" | "started" | "done";

export type UnderstandingLevel = "good" | "partial" | "no" | "unknown";

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

export type HomeworkSubmissionDetail = {
  id?: string;
  note?: string;
  status?: HomeworkStatus;
  studentId: string;
  studentName: string;
  submittedAt?: string;
  understanding?: UnderstandingLevel;
};

export type HomeworkAssignment = {
  id: string;
  allowExternalUrl: boolean;
  classId: string;
  className?: string;
  description: string;
  dueAt?: string;
  dueDate?: string;
  externalUrl?: string;
  isOverdue: boolean;
  requirePhoto: boolean;
  requireStatus: boolean;
  requireUnderstanding: boolean;
  submission?: HomeworkSubmissionDetail;
  submissionDetails?: HomeworkSubmissionDetail[];
  submissionSummary: HomeworkSubmissionSummary;
  title: string;
  visibleFrom: string;
};
