import type { UnderstandingLevel } from "./homework";

export type KnowledgeSkillType =
  | "prerequisite"
  | "curriculum"
  | "support"
  | "enrichment"
  | "system";

export type SkillResourceType =
  | "practice"
  | "video"
  | "worksheet"
  | "explanation"
  | "geogebra"
  | "form"
  | "other";

export type SkillResource = {
  id: string;
  resourceType: SkillResourceType;
  sortOrder: number;
  title: string;
  url: string;
};

export type SkillSelfAssessmentSummary = {
  good: number;
  no: number;
  partial: number;
  unreported: number;
};

export type KnowledgeSkill = {
  description?: string;
  diagnosticQuestion?: string;
  externalPracticeUrl?: string;
  id: string;
  isTaught: boolean;
  performanceLabel: string;
  requiredKnowledge?: string;
  resources: SkillResource[];
  selfAssessment?: UnderstandingLevel;
  selfAssessmentSummary?: SkillSelfAssessmentSummary;
  skillType: KnowledgeSkillType;
  sortOrder: number;
  title: string;
};

export type KnowledgeDomain = {
  description?: string;
  grade: number;
  id: string;
  skills: KnowledgeSkill[];
  sortOrder: number;
  title: string;
};

export type KnowledgeSkillTypeSection = {
  domains: KnowledgeDomain[];
  skillType: KnowledgeSkillType;
};

export type TeacherKnowledgeStatus = {
  canManage: boolean;
  classId: string;
  className: string;
  grade: number;
  sections: KnowledgeSkillTypeSection[];
};

export type StudentKnowledgeMap = {
  classId: string;
  className: string;
  grade: number;
  sections: KnowledgeSkillTypeSection[];
};
