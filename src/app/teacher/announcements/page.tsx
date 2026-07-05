import { Card } from "@/components/app/Card";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import { getAnnouncements } from "@/lib/db/announcements";

export default function TeacherAnnouncementsPage() {
  const announcements = getAnnouncements();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תקשורת"
        title="הודעות"
        description="הודעות מדומות לכיתות ולקבוצות תלמידים."
      />

      <div className="grid gap-3">
        {announcements.map((announcement) => (
          <Card
            key={announcement.id}
            title={announcement.title}
            description={`${announcement.body} קהל יעד: ${announcement.audience}`}
            action={<PrimaryButton>עריכת הודעה</PrimaryButton>}
          />
        ))}
      </div>
    </div>
  );
}
