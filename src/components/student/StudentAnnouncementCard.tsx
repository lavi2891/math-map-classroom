import { markAnnouncementReadAction } from "@/app/student/class/actions";
import { AnnouncementLinks } from "@/components/announcements/AnnouncementLinks";
import { AnnouncementPlainBody } from "@/components/announcements/AnnouncementPlainBody";
import { announcementCategoryLabels } from "@/components/announcements/announcementLabels";
import { Card } from "@/components/app/Card";
import { StatusBadge } from "@/components/app/StatusBadge";
import type { Announcement } from "@/types";

export function StudentAnnouncementCard({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Card
      title={announcement.title}
      description={`${announcementCategoryLabels[announcement.category]} · ${
        announcement.audience
      }`}
    >
      <div className="grid gap-3">
        <AnnouncementPlainBody body={announcement.body} />
        <AnnouncementLinks links={announcement.links} />
        {announcement.requireReadConfirmation ? (
          announcement.readAt ? (
            <div>
              <StatusBadge tone="success">סומן כנקרא</StatusBadge>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="warning">דורש אישור קריאה</StatusBadge>
              <form action={markAnnouncementReadAction}>
                <input
                  name="announcementId"
                  type="hidden"
                  value={announcement.id}
                />
                <button
                  className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
                  type="submit"
                >
                  סמן שקראתי
                </button>
              </form>
            </div>
          )
        ) : null}
      </div>
    </Card>
  );
}
