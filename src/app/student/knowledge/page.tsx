import { PageHeader } from "@/components/app/PageHeader";
import { StudentKnowledgePanel } from "@/components/student/StudentKnowledgePanel";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSelectedStudentClass } from "@/lib/db/classes";
import { getStudentKnowledgeMap } from "@/lib/db/knowledge";

export default async function StudentKnowledgePage() {
  const user = await getCurrentUser();
  const { selectedClass } = user
    ? await getSelectedStudentClass(user.id)
    : { selectedClass: undefined };
  const map =
    user && selectedClass
      ? await getStudentKnowledgeMap(selectedClass.id, user.id)
      : null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מפת ידע"
        title="מפת ידע"
        description="מיומנויות מתמטיות, מה נלמד בכיתה ודיווח ההבנה שלך."
      />

      <StudentKnowledgePanel map={map} />
    </div>
  );
}
