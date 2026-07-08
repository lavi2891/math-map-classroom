"use client";

import { useActionState } from "react";
import {
  changeRequiredPasswordAction,
  updateOwnPasswordAction,
  type PasswordChangeActionState,
} from "@/app/change-password/actions";

type PasswordChangeFormProps = {
  required?: boolean;
};

const initialState: PasswordChangeActionState = {};

export function PasswordChangeForm({ required = false }: PasswordChangeFormProps) {
  const [state, formAction, pending] = useActionState(
    required ? changeRequiredPasswordAction : updateOwnPasswordAction,
    initialState,
  );

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">החלפת סיסמה</h2>
      <form action={formAction} className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          סיסמה חדשה
          <input
            className="min-h-11 rounded-md border border-stone-200 px-3 text-base font-normal"
            minLength={8}
            name="newPassword"
            required
            type="password"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-stone-800">
          אימות סיסמה חדשה
          <input
            className="min-h-11 rounded-md border border-stone-200 px-3 text-base font-normal"
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
        </label>

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
            {state.message}
          </p>
        ) : null}

        <button
          className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300"
          disabled={pending}
          type="submit"
        >
          עדכון סיסמה
        </button>
      </form>
    </section>
  );
}
