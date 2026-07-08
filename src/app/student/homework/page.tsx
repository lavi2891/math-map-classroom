import { PageHeader } from "@/components/app/PageHeader";
import { StudentHomeworkList } from "@/components/student/StudentHomeworkList";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSelectedStudentClass } from "@/lib/db/classes";
import { getStudentHomeworkList } from "@/lib/db/homework";

const HOMEWORK_LIST_LIMIT = 100;

export default async function StudentHomeworkPage() {
  const user = await getCurrentUser();
  const { selectedClass } = user
    ? await getSelectedStudentClass(user.id)
    : { selectedClass: undefined };
  const classIds = selectedClass ? [selectedClass.id] : [];
  const homework = await getStudentHomeworkList(HOMEWORK_LIST_LIMIT, classIds);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="מטלות"
        title="מטלות"
        description="כל שיעורי הבית וההגשות לכיתה הנוכחית."
      />
      <StudentHomeworkList
        assignments={homework}
        loadMoreLabel="טען עוד מטלות ישנות"
      />
    </div>
  );
}
