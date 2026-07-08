import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagedStudent = {
  active: boolean;
  archivedAt?: string;
  displayName: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  studentCode?: string;
  userId: string;
  username?: string;
};

export type StudentLoginSlip = {
  displayName: string;
  temporaryPassword: string;
  username: string;
};

export type CreateStudentInput = {
  classId: string;
  displayName: string;
  studentCode?: string;
  temporaryPassword?: string;
  username: string;
};

export type StudentMutationResult = {
  error?: string;
  slip?: StudentLoginSlip;
  success: boolean;
};

type MembershipStudentRow = {
  active: boolean;
  profiles:
    | {
        archived_at: string | null;
        display_name: string | null;
        must_change_password: boolean | null;
        password_changed_at: string | null;
        username: string | null;
      }
    | {
        archived_at: string | null;
        display_name: string | null;
        must_change_password: boolean | null;
        password_changed_at: string | null;
        username: string | null;
      }[]
    | null;
  student_code: string | null;
  user_id: string;
};

function getJoined<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeStudentUsername(username: string) {
  return username.trim().toLowerCase();
}

export function isValidStudentUsername(username: string) {
  return /^[a-z0-9_-]+$/.test(username);
}

export function getStudentAuthEmail(username: string) {
  return `${username}@students.local`;
}

export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(10);
  globalThis.crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

export async function canManageClass(classId: string, userId?: string) {
  const currentUser = userId ? { id: userId } : await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_memberships")
    .select("class_id")
    .eq("class_id", classId)
    .eq("user_id", currentUser.id)
    .in("role", ["owner", "teacher"])
    .eq("active", true)
    .maybeSingle();

  return Boolean(data);
}

export async function getManagedStudents(classId: string) {
  if (!(await canManageClass(classId))) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select(
      "user_id, student_code, active, profiles(display_name, username, must_change_password, password_changed_at, archived_at)",
    )
    .eq("class_id", classId)
    .eq("role", "student")
    .order("student_code", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as unknown as MembershipStudentRow[]).map<ManagedStudent>(
    (row) => {
      const profile = getJoined(row.profiles);

      return {
        active: row.active,
        archivedAt: profile?.archived_at ?? undefined,
        displayName:
          profile?.display_name ?? profile?.username ?? "תלמיד/ה",
        mustChangePassword: profile?.must_change_password ?? false,
        passwordChangedAt: profile?.password_changed_at ?? undefined,
        studentCode: row.student_code ?? undefined,
        userId: row.user_id,
        username: profile?.username ?? undefined,
      };
    },
  );
}

async function usernameExists(username: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return Boolean(data);
}

async function insertPasswordEvent(
  action: "created" | "reset" | "forced_change" | "changed",
  studentId: string,
  createdBy: string,
  classId?: string,
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("student_password_events").insert({
    action,
    class_id: classId ?? null,
    created_by: createdBy,
    student_id: studentId,
  });
}

export async function createManagedStudent(
  input: CreateStudentInput,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();
  const username = normalizeStudentUsername(input.username);
  const displayName = input.displayName.trim();
  const temporaryPassword =
    input.temporaryPassword?.trim() || generateTemporaryPassword();

  if (!teacher || !(await canManageClass(input.classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  if (!displayName || !username || !temporaryPassword) {
    return { error: "חסרים פרטים ליצירת תלמיד.", success: false };
  }

  if (temporaryPassword.length < 8) {
    return { error: "הסיסמה הזמנית חייבת לכלול לפחות 8 תווים.", success: false };
  }

  if (!isValidStudentUsername(username)) {
    return {
      error:
        "שם המשתמש יכול לכלול אותיות באנגלית, מספרים, קו תחתון ומקף בלבד.",
      success: false,
    };
  }

  if (await usernameExists(username)) {
    return { error: "שם המשתמש כבר קיים.", success: false };
  }

  const admin = createSupabaseAdminClient();
  const email = getStudentAuthEmail(username);
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: temporaryPassword,
      user_metadata: {
        display_name: displayName,
        username,
      },
    });

  if (authError || !authData.user) {
    console.error("createManagedStudent auth create failed", {
      errorMessage: authError?.message,
      username,
    });

    return {
      error: "לא הצלחנו ליצור משתמש התחברות לתלמיד.",
      success: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const studentId = authData.user.id;
  const { error: profileError } = await supabase.from("profiles").upsert({
    created_by: teacher.id,
    display_name: displayName,
    id: studentId,
    must_change_password: true,
    password_changed_at: null,
    username,
  });

  if (profileError) {
    console.error("createManagedStudent profile upsert failed", {
      errorMessage: profileError.message,
      studentId,
      username,
    });

    return {
      error: "משתמש ההתחברות נוצר, אבל לא הצלחנו לשמור פרופיל תלמיד.",
      success: false,
    };
  }

  const { error: membershipError } = await supabase
    .from("class_memberships")
    .upsert(
      {
        active: true,
        class_id: input.classId,
        role: "student",
        student_code: input.studentCode?.trim() || null,
        user_id: studentId,
      },
      {
        onConflict: "class_id,user_id",
      },
    );

  if (membershipError) {
    console.error("createManagedStudent membership upsert failed", {
      errorMessage: membershipError.message,
      studentId,
      username,
    });

    return {
      error: "משתמש ההתחברות נוצר, אבל לא הצלחנו לשייך אותו לכיתה.",
      success: false,
    };
  }

  await insertPasswordEvent("created", studentId, teacher.id, input.classId);

  return {
    slip: {
      displayName,
      temporaryPassword,
      username,
    },
    success: true,
  };
}

export async function resetManagedStudentPassword(
  classId: string,
  studentId: string,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();

  if (!teacher || !(await canManageClass(classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  const students = await getManagedStudents(classId);
  const student = students.find((item) => item.userId === studentId);

  if (!student?.username) {
    return { error: "התלמיד לא נמצא בכיתה.", success: false };
  }

  const temporaryPassword = generateTemporaryPassword();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(studentId, {
    password: temporaryPassword,
  });

  if (error) {
    console.error("resetManagedStudentPassword auth update failed", {
      errorMessage: error.message,
      studentId,
    });

    return { error: "לא הצלחנו לאפס את הסיסמה.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("profiles")
    .update({
      must_change_password: true,
      password_changed_at: null,
    })
    .eq("id", studentId);

  await insertPasswordEvent("reset", studentId, teacher.id, classId);

  return {
    slip: {
      displayName: student.displayName,
      temporaryPassword,
      username: student.username,
    },
    success: true,
  };
}

export async function forceManagedStudentPasswordChange(
  classId: string,
  studentId: string,
) {
  const teacher = await getCurrentUser();

  if (!teacher || !(await canManageClass(classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  const students = await getManagedStudents(classId);

  if (!students.some((student) => student.userId === studentId)) {
    return { error: "התלמיד לא נמצא בכיתה.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", studentId);

  if (error) {
    return { error: "לא הצלחנו לדרוש החלפת סיסמה.", success: false };
  }

  await insertPasswordEvent("forced_change", studentId, teacher.id, classId);

  return { success: true };
}

export async function recordOwnPasswordChanged(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (!error) {
    await insertPasswordEvent("changed", userId, userId);
  }

  return !error;
}
