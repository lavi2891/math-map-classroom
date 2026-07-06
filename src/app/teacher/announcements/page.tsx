import { Card } from "@/components/app/Card";
import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryButton } from "@/components/app/PrimaryButton";
import { getAnnouncements } from "@/lib/db/announcements";

export default async function TeacherAnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="תקשורת"
        title="הודעות"
        description="הודעות לכיתות שבהן יש לך גישה."
      />

      <div className="grid gap-3">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              title={announcement.title}
              description={`${announcement.body} קהל יעד: ${announcement.audience}`}
              action={<PrimaryButton>עריכת הודעה</PrimaryButton>}
            />
          ))
        ) : (
          <EmptyState
            title="אין הודעות להצגה"
            description="הודעות לכיתות שלך יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
