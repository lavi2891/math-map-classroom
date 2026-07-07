import type { ReactNode } from "react";

type IconButtonProps = {
  children: ReactNode;
  destructive?: boolean;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

type TeacherCardActionsProps = {
  deleteLabel?: string;
  hidden: boolean;
  idFieldName: string;
  idValue: string;
  onDeleteRequest: () => void;
  onEdit: () => void;
  unhideLabel?: string;
  hideAction: (formData: FormData) => void | Promise<void>;
  unhideAction: (formData: FormData) => void | Promise<void>;
};

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        fill="none"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="m3 3 18 18M10.7 5.2A10.2 10.2 0 0 1 12 5c6 0 9.5 7 9.5 7a15.1 15.1 0 0 1-3 3.8M6.5 6.8C3.9 8.5 2.5 12 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 4.1-.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M12 20h9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconButton({
  children,
  destructive = false,
  label,
  onClick,
  type = "button",
}: IconButtonProps) {
  const colorClass = destructive
    ? "border-red-200 text-red-700 hover:bg-red-50"
    : "border-stone-200 text-stone-700 hover:bg-stone-50";

  return (
    <button
      aria-label={label}
      className={`grid min-h-10 min-w-10 place-items-center rounded-md border bg-white transition ${colorClass}`}
      onClick={onClick}
      title={label}
      type={type}
    >
      {children}
    </button>
  );
}

export function TeacherCardActions({
  deleteLabel = "מחיקה",
  hidden,
  idFieldName,
  idValue,
  onDeleteRequest,
  onEdit,
  unhideLabel = "פרסם מחדש",
  hideAction,
  unhideAction,
}: TeacherCardActionsProps) {
  const visibilityLabel = hidden ? unhideLabel : "הסתר";

  return (
    <div
      className="absolute left-3 top-3 z-10 flex gap-1"
      dir="ltr"
    >
      <form action={hidden ? unhideAction : hideAction}>
        <input name={idFieldName} type="hidden" value={idValue} />
        <IconButton label={visibilityLabel} type="submit">
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      </form>
      <IconButton label="עריכה" onClick={onEdit}>
        <PencilIcon />
      </IconButton>
      <IconButton destructive label={deleteLabel} onClick={onDeleteRequest}>
        <TrashIcon />
      </IconButton>
    </div>
  );
}
