"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getStudentClasses,
  SELECTED_STUDENT_CLASS_COOKIE,
} from "@/lib/db/classes";

const SELECTED_CLASS_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export async function setSelectedStudentClass(classId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false };
  }

  const classes = await getStudentClasses(user.id);
  const isAllowedClass = classes.some((classSummary) => classSummary.id === classId);

  if (!isAllowedClass) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_STUDENT_CLASS_COOKIE, classId, {
    httpOnly: true,
    maxAge: SELECTED_CLASS_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return { success: true };
}
