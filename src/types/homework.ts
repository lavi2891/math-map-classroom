export type HomeworkAssignment = {
  id: string;
  classId?: string;
  className?: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedCount: number;
  totalCount: number;
};
