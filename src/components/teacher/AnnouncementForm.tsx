import {
  announcementCategoryLabels,
  formatDateTimeInput,
} from "@/components/announcements/announcementLabels";
import type { Announcement, AnnouncementCategory, ClassSummary } from "@/types";

type AnnouncementFormProps = {
  action: (formData: FormData) => Promise<void>;
  announcement?: Announcement;
  classes: ClassSummary[];
  submitLabel: string;
};

const categories: AnnouncementCategory[] = [
  "general",
  "exam",
  "reminder",
  "material",
];

export function AnnouncementForm({
  action,
  announcement,
  classes,
  submitLabel,
}: AnnouncementFormProps) {
  const links = announcement?.links ?? [];

  return (
    <form action={action} className="grid gap-3">
      {announcement ? (
        <input name="announcementId" type="hidden" value={announcement.id} />
      ) : null}

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        כיתה
        <select
          className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
          defaultValue={announcement?.classId ?? classes[0]?.id}
          name="classId"
          required
        >
          {classes.map((classSummary) => (
            <option key={classSummary.id} value={classSummary.id}>
              {classSummary.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        כותרת
        <input
          className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
          defaultValue={announcement?.title}
          name="title"
          required
          type="text"
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        תוכן
        <textarea
          className="min-h-28 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm leading-6 text-stone-950"
          defaultValue={announcement?.body}
          name="body"
          required
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-stone-700">
          קטגוריה
          <select
            className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
            defaultValue={announcement?.category ?? "general"}
            name="category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {announcementCategoryLabels[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-semibold text-stone-700">
          גלויה החל מ
          <input
            className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
            defaultValue={formatDateTimeInput(announcement?.visibleFrom)}
            name="visibleFrom"
            type="datetime-local"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-stone-700">
          גלויה עד
          <input
            className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
            defaultValue={formatDateTimeInput(announcement?.visibleUntil)}
            name="visibleUntil"
            type="datetime-local"
          />
        </label>
      </div>

      <div className="grid gap-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm font-semibold text-stone-700">
        <label className="flex items-center gap-2">
          <input
            className="size-4"
            defaultChecked={announcement?.isPinned ?? false}
            name="isPinned"
            type="checkbox"
          />
          נעיצה בראש הרשימה
        </label>
        <label className="flex items-center gap-2">
          <input
            className="size-4"
            defaultChecked={announcement?.isHidden ?? false}
            name="isHidden"
            type="checkbox"
          />
          מוסתרת מתלמידים
        </label>
        <label className="flex items-center gap-2">
          <input
            className="size-4"
            defaultChecked={announcement?.requireReadConfirmation ?? false}
            name="requireReadConfirmation"
            type="checkbox"
          />
          דרוש אישור קריאה
        </label>
      </div>

      <div className="grid gap-2 rounded-md border border-stone-200 p-3">
        <p className="text-sm font-bold text-stone-950">קישורים מצורפים</p>
        {[0, 1, 2].map((index) => (
          <div className="grid gap-2 md:grid-cols-2" key={index}>
            <input
              className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
              defaultValue={links[index]?.title}
              name="linkTitle"
              placeholder="כותרת קישור"
              type="text"
            />
            <input
              className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
              defaultValue={links[index]?.url}
              name="linkUrl"
              placeholder="https://"
              type="url"
            />
          </div>
        ))}
      </div>

      <button
        className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
