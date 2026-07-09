"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  attachExistingStudentAction,
  bulkCreateStudentsAction,
  createStudentAction,
  forcePasswordChangeAction,
  removeStudentFromClassAction,
  resetStudentPasswordAction,
  searchExistingStudentAction,
  type StudentManagementActionState,
} from "@/app/teacher/classes/[classId]/students/actions";
import type { ManagedStudent, StudentLoginSlip } from "@/lib/db/studentManagement";

type TeacherStudentManagementPanelProps = {
  canManageAccounts: boolean;
  classCode: string;
  classId: string;
  className: string;
  students: ManagedStudent[];
};

const initialState: StudentManagementActionState = {};

function generateReadablePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(10);
  window.crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "לא עודכן";
  }

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function LoginSlipPanel({ slips }: { slips: StudentLoginSlip[] }) {
  const text = useMemo(
    () =>
      slips
        .map(
          (slip) => `שם תלמיד: ${slip.displayName}
כיתה: ${slip.className} (${slip.classCode})
שם משתמש: ${slip.username}
סיסמה זמנית: ${slip.temporaryPassword}
כתובת כניסה: ${slip.loginUrl}
בכניסה הראשונה תתבקשו לבחור סיסמה חדשה`,
        )
        .join("\n\n---\n\n"),
    [slips],
  );

  if (slips.length === 0) {
    return null;
  }

  return (
    <section className="print-slips rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="space-y-2 text-sm text-amber-950">
        <h3 className="text-base font-bold">פרטי כניסה זמניים</h3>
        <p>
          הסיסמאות הזמניות מוצגות עכשיו בלבד. לאחר סגירת החלון לא ניתן לראות
          אותן שוב, רק לאפס סיסמה.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {slips.map((slip) => (
          <div
            className="login-card break-inside-avoid rounded-md border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-900"
            key={`${slip.username}-${slip.temporaryPassword}`}
          >
            <p className="text-xs font-bold text-teal-700">מפת המתמטיקה</p>
            <p className="mt-2 font-bold">{slip.displayName}</p>
            <p>
              כיתה: {slip.className} · {slip.classCode}
            </p>
            <p className="mt-2 text-left" dir="ltr">
              {slip.username}
            </p>
            <p className="text-left font-bold" dir="ltr">
              {slip.temporaryPassword}
            </p>
            <p className="mt-2 truncate text-left text-xs" dir="ltr">
              {slip.loginUrl}
            </p>
            <p className="mt-3 text-xs text-stone-600">
              בכניסה הראשונה תתבקשו לבחור סיסמה חדשה
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white"
          onClick={() => window.print()}
          type="button"
        >
          הדפס פרטי כניסה
        </button>
        <button
          className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
          onClick={() => navigator.clipboard?.writeText(text)}
          type="button"
        >
          העתק פרטים
        </button>
      </div>
    </section>
  );
}

function CreateStudentForm({
  classId,
  onCancel,
  onSlips,
}: {
  classId: string;
  onCancel: () => void;
  onSlips: (slips: StudentLoginSlip[]) => void;
}) {
  const [state, formAction, pending] = useActionState(
    createStudentAction,
    initialState,
  );
  const [temporaryPassword, setTemporaryPassword] = useState(() =>
    generateReadablePassword(),
  );

  useEffect(() => {
    if (state.slip && !state.error) {
      onSlips([state.slip]);
      onCancel();
    }
  }, [onCancel, onSlips, state.error, state.slip]);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">תלמיד חדש</h2>
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="classId" type="hidden" value={classId} />

        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          שם משתמש
          <input
            className="min-h-11 rounded-md border border-stone-200 px-3 text-left text-base font-normal"
            dir="ltr"
            name="username"
            required
            type="text"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          שם תצוגה / שם תלמיד
          <input
            className="min-h-11 rounded-md border border-stone-200 px-3 text-base font-normal"
            name="displayName"
            type="text"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          סיסמה זמנית
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="min-h-11 rounded-md border border-stone-200 px-3 text-left text-base font-normal"
              dir="ltr"
              minLength={8}
              name="temporaryPassword"
              onChange={(event) => setTemporaryPassword(event.target.value)}
              required
              type="text"
              value={temporaryPassword}
            />
            <button
              className="min-h-11 rounded-md border border-stone-200 px-3 text-sm font-bold text-stone-700"
              onClick={() => setTemporaryPassword(generateReadablePassword())}
              type="button"
            >
              צור סיסמה
            </button>
          </div>
        </label>

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
            onClick={onCancel}
            type="button"
          >
            ביטול
          </button>
          <button
            className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
            disabled={pending}
            type="submit"
          >
            יצירת תלמיד
          </button>
        </div>
      </form>
    </section>
  );
}

function BulkCreateStudentForm({
  classCode,
  classId,
  onCancel,
  onSlips,
}: {
  classCode: string;
  classId: string;
  onCancel: () => void;
  onSlips: (slips: StudentLoginSlip[]) => void;
}) {
  const [state, formAction, pending] = useActionState(
    bulkCreateStudentsAction,
    initialState,
  );

  useEffect(() => {
    if (state.slips && state.slips.length > 0) {
      onSlips(state.slips);

      if (!state.error) {
        onCancel();
      }
    }
  }, [onCancel, onSlips, state.error, state.slips]);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">יצירת תלמידים</h2>
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="classId" type="hidden" value={classId} />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
            מספר תלמידים
            <input
              className="min-h-11 w-full rounded-md border border-stone-200 px-3 text-base font-normal"
              defaultValue={10}
              max={60}
              min={1}
              name="count"
              type="number"
            />
          </label>
          <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
            קוד התחלתי
            <input
              className="min-h-11 w-full rounded-md border border-stone-200 px-3 text-left text-base font-normal"
              defaultValue="001"
              dir="ltr"
              name="startingCode"
              type="text"
            />
          </label>
          <label className="grid min-w-0 gap-1 text-sm font-semibold text-stone-800">
            קידומת שם משתמש
            <input
              className="min-h-11 w-full rounded-md border border-stone-200 px-3 text-left text-base font-normal"
              defaultValue={classCode.toLowerCase()}
              dir="ltr"
              name="usernamePrefix"
              required
              type="text"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          שמות תלמידים, אחד בכל שורה
          <textarea
            className="min-h-32 rounded-md border border-stone-200 px-3 py-2 text-base font-normal"
            name="names"
            placeholder="אפשר להשאיר ריק וליצור לפי מספר בלבד"
          />
        </label>

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
            onClick={onCancel}
            type="button"
          >
            ביטול
          </button>
          <button
            className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
            disabled={pending}
            type="submit"
          >
            צור תלמידים
          </button>
        </div>
      </form>
    </section>
  );
}

function AttachExistingUserForm({
  classId,
  onCancel,
}: {
  classId: string;
  onCancel: () => void;
}) {
  const [searchState, searchAction, searchPending] = useActionState(
    searchExistingStudentAction,
    initialState,
  );
  const [attachState, attachAction, attachPending] = useActionState(
    attachExistingStudentAction,
    initialState,
  );

  useEffect(() => {
    if (attachState.message && !attachState.error) {
      onCancel();
    }
  }, [attachState.error, attachState.message, onCancel]);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">צרף משתמש קיים</h2>
      <form action={searchAction} className="mt-4 grid gap-3">
        <input name="classId" type="hidden" value={classId} />
        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          שם משתמש
          <input
            className="min-h-11 rounded-md border border-stone-200 px-3 text-left text-base font-normal"
            dir="ltr"
            name="username"
            required
            type="text"
          />
        </label>
        <button
          className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 disabled:bg-stone-100"
          disabled={searchPending}
          type="submit"
        >
          חפש משתמש
        </button>
      </form>

      {searchState.error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {searchState.error}
        </p>
      ) : null}

      {searchState.profile ? (
        <div className="mt-3 rounded-md border border-stone-200 p-3">
          <p className="font-bold text-stone-950">
            {searchState.profile.displayName}
          </p>
          <p className="text-sm text-stone-600">
            {searchState.profile.username}
          </p>
          <form action={attachAction} className="mt-3">
            <input name="classId" type="hidden" value={classId} />
            <input
              name="username"
              type="hidden"
              value={searchState.profile.username}
            />
            <button
              className="min-h-11 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
              disabled={attachPending}
              type="submit"
            >
              צרף לכיתה
            </button>
          </form>
        </div>
      ) : null}

      {attachState.error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {attachState.error}
        </p>
      ) : null}

      <button
        className="mt-3 min-h-11 w-full rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
        onClick={onCancel}
        type="button"
      >
        ביטול
      </button>
    </section>
  );
}

function StudentActions({
  canManageAccounts,
  classId,
  student,
}: {
  canManageAccounts: boolean;
  classId: string;
  student: ManagedStudent;
}) {
  const [resetState, resetAction, resetPending] = useActionState(
    resetStudentPasswordAction,
    initialState,
  );
  const [forceState, forceAction, forcePending] = useActionState(
    forcePasswordChangeAction,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeStudentFromClassAction,
    initialState,
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!canManageAccounts) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {confirmReset ? (
          <form
            action={resetAction}
            className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 sm:col-span-3"
          >
            <input name="classId" type="hidden" value={classId} />
            <input name="studentId" type="hidden" value={student.userId} />
            <p className="text-sm font-bold text-amber-950">לאפס סיסמה?</p>
            <p className="text-sm leading-6 text-amber-900">
              תיווצר סיסמה זמנית חדשה והתלמיד יתבקש להחליף אותה בכניסה הבאה.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="min-h-11 rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700"
                onClick={() => setConfirmReset(false)}
                type="button"
              >
                ביטול
              </button>
              <button
                className="min-h-11 rounded-md bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
                disabled={resetPending}
                type="submit"
              >
                אפס סיסמה
              </button>
            </div>
          </form>
        ) : (
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
            onClick={() => setConfirmReset(true)}
            type="button"
          >
            איפוס סיסמה
          </button>
        )}

        <form action={forceAction}>
          <input name="classId" type="hidden" value={classId} />
          <input name="studentId" type="hidden" value={student.userId} />
          <button
            className="min-h-11 w-full rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 disabled:bg-stone-100"
            disabled={forcePending}
            type="submit"
          >
            דרוש החלפת סיסמה
          </button>
        </form>

        {confirmRemove ? (
          <form
            action={removeAction}
            className="grid gap-2 rounded-md border border-red-200 bg-red-50 p-3 sm:col-span-3"
          >
            <input name="classId" type="hidden" value={classId} />
            <input name="studentId" type="hidden" value={student.userId} />
            <p className="text-sm font-bold text-red-950">
              להסיר את התלמיד מהכיתה?
            </p>
            <p className="text-sm leading-6 text-red-900">
              התלמיד יוסר מהכיתה הזו ולא יראה יותר את התוכן שלה. המשתמש
              וההיסטוריה שלו לא יימחקו מהמערכת.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="min-h-11 rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700"
                onClick={() => setConfirmRemove(false)}
                type="button"
              >
                ביטול
              </button>
              <button
                className="min-h-11 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
                disabled={removePending}
                type="submit"
              >
                הסר מהכיתה
              </button>
            </div>
          </form>
        ) : (
          <button
            className="min-h-11 rounded-md border border-red-200 px-4 py-2 text-sm font-bold text-red-700"
            onClick={() => setConfirmRemove(true)}
            type="button"
          >
            הסר מהכיתה
          </button>
        )}
      </div>

      {resetState.error || forceState.error || removeState.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {resetState.error ?? forceState.error ?? removeState.error}
        </p>
      ) : null}
      {forceState.message || removeState.message ? (
        <p className="rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
          {forceState.message ?? removeState.message}
        </p>
      ) : null}
      {resetState.slip ? <LoginSlipPanel slips={[resetState.slip]} /> : null}
    </div>
  );
}

export function TeacherStudentManagementPanel({
  canManageAccounts,
  classCode,
  classId,
  className,
  students,
}: TeacherStudentManagementPanelProps) {
  const [openPanel, setOpenPanel] = useState<
    "create" | "bulk" | "attach" | null
  >(null);
  const [latestSlips, setLatestSlips] = useState<StudentLoginSlip[]>([]);

  return (
    <div className="space-y-4">
      {canManageAccounts ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white"
            onClick={() => setOpenPanel("bulk")}
            type="button"
          >
            יצירת תלמידים
          </button>
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
            onClick={() => setOpenPanel("create")}
            type="button"
          >
            + תלמיד חדש
          </button>
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
            onClick={() => setOpenPanel("attach")}
            type="button"
          >
            צרף משתמש קיים
          </button>
        </div>
      ) : (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          רק בעל הכיתה יכול ליצור תלמידים, לאפס סיסמאות ולהדפיס פרטי כניסה.
        </p>
      )}

      {openPanel === "bulk" ? (
        <BulkCreateStudentForm
          classCode={classCode}
          classId={classId}
          onCancel={() => setOpenPanel(null)}
          onSlips={setLatestSlips}
        />
      ) : null}

      {openPanel === "create" ? (
        <CreateStudentForm
          classId={classId}
          onCancel={() => setOpenPanel(null)}
          onSlips={setLatestSlips}
        />
      ) : null}

      {openPanel === "attach" ? (
        <AttachExistingUserForm
          classId={classId}
          onCancel={() => setOpenPanel(null)}
        />
      ) : null}

      <LoginSlipPanel slips={latestSlips} />

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-teal-700">כיתה {className}</p>
          <h2 className="mt-1 text-lg font-bold text-stone-950">תלמידים</h2>
        </div>

        {students.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {students.map((student) => (
              <article
                className="rounded-md border border-stone-200 p-3"
                key={student.userId}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-950">
                      {student.displayName}
                    </h3>
                    <p className="text-sm text-stone-600">{student.username}</p>
                  </div>
                  {student.mustChangePassword ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                      נדרשת החלפת סיסמה
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  החלפת סיסמה אחרונה: {formatDate(student.passwordChangedAt)}
                </p>

                <StudentActions
                  canManageAccounts={canManageAccounts}
                  classId={classId}
                  student={student}
                />
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-stone-50 px-3 py-4 text-sm text-stone-600">
            עדיין אין תלמידים פעילים בכיתה.
          </p>
        )}
      </section>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-slips,
          .print-slips * {
            visibility: visible;
          }

          .print-slips {
            position: absolute;
            inset-block-start: 16px;
            inset-inline-start: 16px;
            width: calc(100% - 32px);
            border: 0;
            background: white;
          }

          .login-card {
            page-break-inside: avoid;
            width: 85mm;
            min-height: 55mm;
          }
        }
      `}</style>
    </div>
  );
}
