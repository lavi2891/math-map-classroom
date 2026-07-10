import { PageHeader } from "@/components/app/PageHeader";
import { TeacherKnowledgePanel } from "@/components/teacher/TeacherKnowledgePanel";
import { getTeacherClasses } from "@/lib/db/classes";
import { getTeacherClassKnowledgeStatus } from "@/lib/db/knowledge";

type TeacherStatusPageProps = {
  searchParams?: Promise<{
    classId?: string;
  }>;
};

export default async function TeacherStatusPage({
  searchParams,
}: TeacherStatusPageProps) {
  const params = await searchParams;
  const classes = await getTeacherClasses();
  const selectedClassId =
    classes.find((classSummary) => classSummary.id === params?.classId)?.id ??
    classes[0]?.id;
  const status = selectedClassId
    ? await getTeacherClassKnowledgeStatus(selectedClassId)
    : null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מצב"
        title="מפת ידע כיתתית"
        description="מעקב אחר מיומנויות שנלמדו ודיווחי הבנה של התלמידים."
      />

      <TeacherKnowledgePanel
        classes={classes}
        selectedClassId={selectedClassId}
        status={status}
      />
    </div>
  );
}
