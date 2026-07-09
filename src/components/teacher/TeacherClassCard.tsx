"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  archiveClassAction,
  unarchiveClassAction,
  type ClassManagementActionState,
} from "@/app/teacher/classes/actions";
import { ClassStatusBadge } from "@/components/classes/ClassStatusBadge";
import { ClassForm } from "@/components/teacher/ClassForm";
import type { ClassSummary } from "@/types";

type TeacherClassCardProps = {
  summary: ClassSummary;
};

const initialState: ClassManagementActionState = {};

const roleLabel: Record<string, string> = {
  owner: "בעלים",
  teacher: "מורה",
  viewer: "צפייה",
};

export function TeacherClassCard({ summary }: TeacherClassCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveClassAction,
    initialState,
  );
  const [unarchiveState, unarchiveAction, unarchivePending] = useActionState(
    unarchiveClassAction,
    initialState,
  );
  const canManageStudents = summary.role === "owner" || summary.role === "teacher";
  const canManageClass = summary.role === "owner";
  const title = summary.displayName || summary.name;
  const statusMessage = archiveState.message ?? unarchiveState.message;
  const errorMessage = archiveState.error ?? unarchiveState.error;

  if (editing) {
    return (
      <ClassForm
        classSummary={summary}
        mode="edit"
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <article className="relative rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      {canManageClass ? (
        <div className="absolute left-3 top-3 flex gap-1">
          <button
            aria-label="עריכת כיתה"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-sm font-bold text-stone-700"
            onClick={() => setEditing(true)}
            title="עריכת כיתה"
            type="button"
          >
            ✎
          </button>
          {summary.active ? (
            <button
              aria-label="העברה לארכיון"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-xs font-bold text-stone-700"
              onClick={() => setConfirmArchive(true)}
              title="העברה לארכיון"
              type="button"
            >
              אר
            </button>
          ) : (
            <form action={unarchiveAction}>
              <input name="classId" type="hidden" value={summary.id} />
              <button
                aria-label="החזרה לפעילות"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-teal-200 bg-white text-xs font-bold text-teal-700 disabled:bg-stone-100"
                disabled={unarchivePending}
                title="החזרה לפעילות"
                type="submit"
              >
                פע
              </button>
            </form>
          )}
        </div>
      ) : null}

      <div className="min-w-0 pe-20">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-stone-950">כיתה {title}</h2>
          <ClassStatusBadge active={summary.active} />
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          שכבה {summary.grade} · קוד {summary.classCode}
          {summary.schoolYear ? ` · ${summary.schoolYear}` : ""}
        </p>
      </div>

      <div className="mt-3 grid gap-1 text-sm text-stone-600">
        <p>תפקיד בכיתה: {roleLabel[summary.role ?? ""] ?? summary.role}</p>
        <p>תלמידים פעילים: {summary.studentCount}</p>
      </div>

      {confirmArchive ? (
        <form
          action={archiveAction}
          className="mt-4 grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3"
        >
          <input name="classId" type="hidden" value={summary.id} />
          <p className="text-sm font-bold text-amber-950">
            להעביר את הכיתה לארכיון?
          </p>
          <p className="text-sm leading-6 text-amber-900">
            הכיתה לא תוצג לתלמידים כברירת מחדל ולא תשמש למשימות חדשות. ניתן
            להחזיר אותה לפעילות בהמשך.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="min-h-11 rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700"
              onClick={() => setConfirmArchive(false)}
              type="button"
            >
              ביטול
            </button>
            <button
              className="min-h-11 rounded-md bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
              disabled={archivePending}
              type="submit"
            >
              העבר לארכיון
            </button>
          </div>
        </form>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
          {statusMessage}
        </p>
      ) : null}

      {canManageStudents ? (
        <Link
          className="mt-4 block min-h-11 rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-teal-800"
          href={`/teacher/classes/${summary.id}/students`}
        >
          ניהול תלמידים
        </Link>
      ) : null}
    </article>
  );
}
