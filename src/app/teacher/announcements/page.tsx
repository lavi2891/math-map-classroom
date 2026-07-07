import { PageHeader } from "@/components/app/PageHeader";
import { TeacherAnnouncementsPanel } from "@/components/teacher/TeacherAnnouncementsPanel";
import {
  getManageableAnnouncementClasses,
  getManageableAnnouncements,
} from "@/lib/db/announcements";

export default async function TeacherAnnouncementsPage() {
  const [classes, announcements] = await Promise.all([
    getManageableAnnouncementClasses(),
    getManageableAnnouncements(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תקשורת"
        title="הודעות"
        description="הודעות לכיתות שבהן יש לך גישה."
      />

      <TeacherAnnouncementsPanel announcements={announcements} classes={classes} />
    </div>
  );
}
