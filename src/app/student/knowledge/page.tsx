import { PageHeader } from "@/components/app/PageHeader";
import { KnowledgeDomainCard } from "@/components/knowledge/KnowledgeDomainCard";
import { KnowledgeSkillRow } from "@/components/knowledge/KnowledgeSkillRow";
import { SelfAssessmentButtons } from "@/components/knowledge/SelfAssessmentButtons";
import { getKnowledgeDomains, getKnowledgeSkills } from "@/lib/db/knowledge";

export default function StudentKnowledgePage() {
  const domains = getKnowledgeDomains();
  const skills = getKnowledgeSkills();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מפת ידע"
        title="מפת ידע"
        description="מיומנויות מתמטיות, מצב שליטה והצעדים הבאים לתרגול."
      />

      <div className="grid gap-3">
        {domains.map((domain) => (
          <KnowledgeDomainCard key={domain.id} domain={domain} />
        ))}
      </div>

      <div className="grid gap-3">
        {skills.map((skill) => (
          <KnowledgeSkillRow key={skill.id} skill={skill} />
        ))}
      </div>

      <SelfAssessmentButtons />
    </div>
  );
}
