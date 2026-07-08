import { PageHeader } from "@/components/app/PageHeader";
import { StudentAnnouncementList } from "@/components/student/StudentAnnouncementList";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentAnnouncements } from "@/lib/db/announcements";
import { getSelectedStudentClass } from "@/lib/db/classes";

const ANNOUNCEMENT_LIST_LIMIT = 100;

export default async function StudentAnnouncementsPage() {
  const user = await getCurrentUser();
  const { selectedClass } = user
    ? await getSelectedStudentClass(user.id)
    : { selectedClass: undefined };
  const classIds = selectedClass ? [selectedClass.id] : [];
  const announcements = await getStudentAnnouncements(
    classIds,
    ANNOUNCEMENT_LIST_LIMIT,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="הודעות"
        title="הודעות"
        description="הודעות ועדכונים מהכיתה הנוכחית."
      />
      <StudentAnnouncementList announcements={announcements} />
    </div>
  );
}
