import { PageHeader } from "@/components/app/PageHeader";
import { StudentClassFeed } from "@/components/student/StudentClassFeed";
import { getStudentClassFeed } from "@/lib/db/classes";

export default function StudentClassPage() {
  const items = getStudentClassFeed();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="כיתה"
        title="כיתה"
        description="פעילות כיתתית, נושא השיעור ועדכונים מהמורה."
      />
      <StudentClassFeed items={items} />
    </div>
  );
}
