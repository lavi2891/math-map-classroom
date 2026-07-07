"use client";

import { useActionState, useState } from "react";
import {
  loginStudent,
  loginTeacher,
  type LoginActionState,
} from "@/app/login/actions";

const initialState: LoginActionState = {};

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"teacher" | "student">("teacher");
  const [teacherState, teacherAction, teacherPending] = useActionState(
    loginTeacher,
    initialState,
  );
  const [studentState, studentAction, studentPending] = useActionState(
    loginStudent,
    initialState,
  );
  const error = teacherState.error ?? studentState.error ?? initialError;
  const debug = teacherState.debug ?? studentState.debug;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-stone-100 p-1">
        <button
          className={`min-h-11 rounded-md px-3 text-sm font-bold transition ${
            mode === "teacher"
              ? "bg-white text-stone-950 shadow-sm"
              : "text-stone-600"
          }`}
          onClick={() => setMode("teacher")}
          type="button"
        >
          מורה
        </button>
        <button
          className={`min-h-11 rounded-md px-3 text-sm font-bold transition ${
            mode === "student"
              ? "bg-white text-stone-950 shadow-sm"
              : "text-stone-600"
          }`}
          onClick={() => setMode("student")}
          type="button"
        >
          תלמיד/ה
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {debug ? (
        <div
          className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"
          dir="ltr"
        >
          <p className="mb-2 font-bold">Development auth debug</p>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      ) : null}

      {mode === "teacher" ? (
        <form action={teacherAction} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            אימייל
            <input
              autoComplete="email"
              className="min-h-12 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950 outline-none focus:border-teal-700"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            סיסמה
            <input
              autoComplete="current-password"
              className="min-h-12 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950 outline-none focus:border-teal-700"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="min-h-12 rounded-md bg-teal-700 px-4 py-3 text-center font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={teacherPending}
            type="submit"
          >
            {teacherPending ? "מתחבר..." : "כניסה כמורה"}
          </button>
        </form>
      ) : (
        <form action={studentAction} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            קוד כיתה
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className="min-h-12 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950 outline-none focus:border-teal-700"
              name="classCode"
              placeholder="Z7A"
              required
              type="text"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            קוד תלמיד
            <input
              autoComplete="username"
              className="min-h-12 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950 outline-none focus:border-teal-700"
              name="studentCode"
              placeholder="001"
              required
              type="text"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            סיסמה
            <input
              autoComplete="current-password"
              className="min-h-12 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-950 outline-none focus:border-teal-700"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="min-h-12 rounded-md bg-teal-700 px-4 py-3 text-center font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={studentPending}
            type="submit"
          >
            {studentPending ? "מתחבר..." : "כניסה כתלמיד"}
          </button>
        </form>
      )}
    </div>
  );
}
