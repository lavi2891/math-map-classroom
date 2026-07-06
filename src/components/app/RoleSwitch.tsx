"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import type { AppRole } from "@/types";

const ROLE_STORAGE_KEY = "mock-role";

function roleHomePath(role: AppRole) {
  return role === "student" ? ROUTES.studentHome : ROUTES.teacherClasses;
}

export function RoleSwitch() {
  const router = useRouter();

  function selectRole(role: AppRole) {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    document.cookie = `${ROLE_STORAGE_KEY}=${role}; path=/; max-age=2592000; SameSite=Lax`;
    router.push(roleHomePath(role));
  }

  return (
    <div className="mt-6 grid gap-3">
      <button
        className="min-h-12 rounded-md bg-teal-700 px-4 py-3 text-center font-bold text-white transition hover:bg-teal-800"
        onClick={() => selectRole("student")}
        type="button"
      >
        כניסה כתלמיד
      </button>
      <button
        className="min-h-12 rounded-md bg-stone-900 px-4 py-3 text-center font-bold text-white transition hover:bg-stone-800"
        onClick={() => selectRole("teacher")}
        type="button"
      >
        כניסה כמורה
      </button>
    </div>
  );
}
