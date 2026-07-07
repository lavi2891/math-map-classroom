import { submitHomework } from "@/app/student/homework/actions";

type HomeworkSubmissionFormProps = {
  homeworkId?: string;
};

const statusOptions = [
  { label: "לא התחלתי", value: "not_started" },
  { label: "התחלתי", value: "started" },
  { label: "סיימתי", value: "done" },
];

const understandingOptions = [
  { label: "הבנתי", value: "good" },
  { label: "חלקית", value: "partial" },
  { label: "לא הבנתי", value: "no" },
  { label: "לא בטוח/ה", value: "unknown" },
];

export function HomeworkSubmissionForm({
  homeworkId,
}: HomeworkSubmissionFormProps) {
  if (!homeworkId) {
    return null;
  }

  return (
    <form action={submitHomework} className="grid gap-3">
      <input name="homeworkId" type="hidden" value={homeworkId} />

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        מצב עבודה
        <select
          className="min-h-11 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950"
          defaultValue="not_started"
          name="status"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        הבנה
        <select
          className="min-h-11 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950"
          defaultValue="unknown"
          name="understanding"
        >
          {understandingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        הערה
        <textarea
          className="min-h-24 rounded-md border border-stone-200 bg-white px-3 py-2 text-base text-stone-950"
          name="note"
          placeholder="אפשר לכתוב מה היה קל או קשה"
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-stone-700">
        צילום מחברת
        <input
          accept="image/*"
          capture="environment"
          className="min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
          name="photo"
          type="file"
        />
      </label>

      <button
        className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
        type="submit"
      >
        שמירת הגשה
      </button>
    </form>
  );
}
