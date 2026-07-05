export type KnowledgeSkillStatus = "strong" | "practice" | "new";

export type KnowledgeSkill = {
  id: string;
  title: string;
  status: KnowledgeSkillStatus;
  progress: number;
};

export type KnowledgeDomain = {
  id: string;
  title: string;
  description: string;
  skills: KnowledgeSkill[];
};
