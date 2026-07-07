import { markAnnouncementReadAction } from "@/app/student/class/actions";
import { AnnouncementLinks } from "@/components/announcements/AnnouncementLinks";
import { AnnouncementPlainBody } from "@/components/announcements/AnnouncementPlainBody";
import { announcementCategoryLabels } from "@/components/announcements/announcementLabels";
import { Card } from "@/components/app/Card";
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
            <p className="text-sm font-bold text-teal-700">סומן כנקרא</p>
          ) : (
            <form action={markAnnouncementReadAction}>
              <input
                name="announcementId"
                type="hidden"
                value={announcement.id}
              />
              <button
                className="min-h-10 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
                type="submit"
              >
                סמן שקראתי
              </button>
            </form>
          )
        ) : null}
      </div>
    </Card>
  );
}
