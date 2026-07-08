import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagedStudent = {
  displayName: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  userId: string;
  username: string;
};

export type StudentLoginSlip = {
  displayName: string;
  temporaryPassword: string;
  username: string;
};

export type StudentProfileSearchResult = {
  displayName: string;
  userId: string;
  username: string;
};

export type CreateStudentInput = {
  classId: string;
  displayName?: string;
  temporaryPassword?: string;
  username: string;
};

export type StudentMutationResult = {
  error?: string;
  message?: string;
  profile?: StudentProfileSearchResult;
  slip?: StudentLoginSlip;
  success: boolean;
};

type ProfileRow = {
  display_name: string | null;
  id: string;
  username: string | null;
};

type MembershipStudentRow = {
  profiles:
    | {
        display_name: string | null;
        must_change_password: boolean | null;
        password_changed_at: string | null;
        username: string | null;
      }
    | {
        display_name: string | null;
        must_change_password: boolean | null;
        password_changed_at: string | null;
        username: string | null;
      }[]
    | null;
  user_id: string;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

function getJoined<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function getDisplayName(displayName: string | null | undefined, username: string) {
  const trimmedName = displayName?.trim();

  return trimmedName || `תלמיד ${username}`;
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
      "user_id, profiles(display_name, username, must_change_password, password_changed_at)",
    )
    .eq("class_id", classId)
    .eq("role", "student")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as unknown as MembershipStudentRow[]).flatMap<ManagedStudent>(
    (row) => {
      const profile = getJoined(row.profiles);
      const username = profile?.username?.trim();

      if (!username) {
        return [];
      }

      return [
        {
          displayName: getDisplayName(profile?.display_name, username),
          mustChangePassword: profile?.must_change_password ?? false,
          passwordChangedAt: profile?.password_changed_at ?? undefined,
          userId: row.user_id,
          username,
        },
      ];
    },
  );
}

async function getProfileByUsername(username: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as ProfileRow;

  if (!row.username) {
    return null;
  }

  return {
    displayName: getDisplayName(row.display_name, row.username),
    userId: row.id,
    username: row.username,
  };
}

async function usernameExists(username: string) {
  return Boolean(await getProfileByUsername(username));
}

async function insertPasswordEventWithAdmin(
  admin: SupabaseAdminClient,
  action: "created" | "reset" | "forced_change" | "changed",
  studentId: string,
  createdBy: string,
  classId?: string,
) {
  const { error } = await admin.from("student_password_events").insert({
    action,
    class_id: classId ?? null,
    created_by: createdBy,
    student_id: studentId,
  });

  if (error && error.code !== "42P01") {
    console.error("insertPasswordEventWithAdmin failed", {
      action,
      errorMessage: error.message,
      studentId,
    });
  }
}

async function insertOwnPasswordEvent(
  action: "changed",
  studentId: string,
  createdBy: string,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("student_password_events").insert({
    action,
    class_id: null,
    created_by: createdBy,
    student_id: studentId,
  });

  if (error && error.code !== "42P01") {
    console.error("insertOwnPasswordEvent failed", {
      action,
      errorMessage: error.message,
      studentId,
    });
  }
}

async function setPasswordRequirementWithAdmin(
  admin: SupabaseAdminClient,
  studentId: string,
  mustChangePassword: boolean,
) {
  const { data, error } = await admin
    .from("profiles")
    .update({
      must_change_password: mustChangePassword,
      password_changed_at: mustChangePassword ? null : new Date().toISOString(),
    })
    .eq("id", studentId)
    .select("id, must_change_password")
    .maybeSingle();

  if (error || !data || data.must_change_password !== mustChangePassword) {
    console.error("setPasswordRequirementWithAdmin failed", {
      errorMessage: error?.message,
      expectedMustChangePassword: mustChangePassword,
      returnedMustChangePassword: data?.must_change_password,
      studentId,
    });

    return false;
  }

  return true;
}

async function setOwnPasswordChanged(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, must_change_password")
    .maybeSingle();

  if (error || !data || data.must_change_password !== false) {
    console.error("setOwnPasswordChanged failed", {
      errorMessage: error?.message,
      returnedMustChangePassword: data?.must_change_password,
      userId,
    });

    return false;
  }

  return true;
}

export async function searchStudentProfileForClass(
  classId: string,
  usernameInput: string,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();
  const username = normalizeStudentUsername(usernameInput);

  if (!teacher || !(await canManageClass(classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  if (!username) {
    return { error: "יש להזין שם משתמש.", success: false };
  }

  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { error: "לא נמצא משתמש בשם זה.", success: false };
  }

  return { profile, success: true };
}

export async function attachExistingStudentToClass(
  classId: string,
  usernameInput: string,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();
  const username = normalizeStudentUsername(usernameInput);

  if (!teacher || !(await canManageClass(classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { error: "לא נמצא משתמש בשם זה.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingMembership } = await supabase
    .from("class_memberships")
    .select("active")
    .eq("class_id", classId)
    .eq("user_id", profile.userId)
    .eq("role", "student")
    .maybeSingle();

  if (existingMembership?.active) {
    return { error: "המשתמש כבר משויך לכיתה.", success: false };
  }

  const { error } = await supabase.from("class_memberships").upsert(
    {
      active: true,
      class_id: classId,
      role: "student",
      student_code: null,
      user_id: profile.userId,
    },
    { onConflict: "class_id,user_id" },
  );

  if (error) {
    return { error: "לא הצלחנו לצרף את המשתמש לכיתה.", success: false };
  }

  return {
    message: existingMembership
      ? "המשתמש הוחזר לכיתה."
      : "המשתמש צורף לכיתה.",
    profile,
    success: true,
  };
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  const teacher = await getCurrentUser();

  if (!teacher || !(await canManageClass(classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("class_memberships")
    .update({ active: false })
    .eq("class_id", classId)
    .eq("user_id", studentId)
    .eq("role", "student");

  if (error) {
    return { error: "לא הצלחנו להסיר את התלמיד מהכיתה.", success: false };
  }

  return { message: "התלמיד הוסר מהכיתה.", success: true };
}

export async function createManagedStudent(
  input: CreateStudentInput,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();
  const username = normalizeStudentUsername(input.username);
  const displayName = input.displayName?.trim() || null;
  const temporaryPassword =
    input.temporaryPassword?.trim() || generateTemporaryPassword();

  if (!teacher || !(await canManageClass(input.classId, teacher.id))) {
    return { error: "אין הרשאה לניהול הכיתה.", success: false };
  }

  if (!username || !temporaryPassword) {
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
    return {
      error: "שם המשתמש כבר קיים. אפשר לצרף משתמש קיים לכיתה.",
      success: false,
    };
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

  const studentId = authData.user.id;
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      created_by: teacher.id,
      display_name: displayName,
      id: studentId,
      must_change_password: true,
      password_changed_at: null,
      username,
    },
    {
      onConflict: "id",
    },
  );

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

  const { error: membershipError } = await admin
    .from("class_memberships")
    .upsert(
      {
        active: true,
        class_id: input.classId,
        role: "student",
        student_code: null,
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

  const flagUpdated = await setPasswordRequirementWithAdmin(
    admin,
    studentId,
    true,
  );

  if (!flagUpdated) {
    return {
      error:
        "משתמש ההתחברות נוצר ושויך לכיתה, אבל לא הצלחנו לדרוש החלפת סיסמה.",
      success: false,
    };
  }

  await insertPasswordEventWithAdmin(
    admin,
    "created",
    studentId,
    teacher.id,
    input.classId,
  );

  return {
    slip: {
      displayName: getDisplayName(displayName, username),
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

  const flagUpdated = await setPasswordRequirementWithAdmin(
    admin,
    studentId,
    true,
  );

  if (!flagUpdated) {
    return {
      error: "הסיסמה אופסה, אבל לא הצלחנו לדרוש החלפת סיסמה.",
      success: false,
    };
  }

  await insertPasswordEventWithAdmin(
    admin,
    "reset",
    studentId,
    teacher.id,
    classId,
  );

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

  const admin = createSupabaseAdminClient();
  const flagUpdated = await setPasswordRequirementWithAdmin(
    admin,
    studentId,
    true,
  );

  if (!flagUpdated) {
    return { error: "לא הצלחנו לדרוש החלפת סיסמה.", success: false };
  }

  await insertPasswordEventWithAdmin(
    admin,
    "forced_change",
    studentId,
    teacher.id,
    classId,
  );

  return { success: true };
}

export async function recordOwnPasswordChanged(userId: string) {
  const profileUpdated = await setOwnPasswordChanged(userId);

  if (profileUpdated) {
    await insertOwnPasswordEvent("changed", userId, userId);
  }

  return profileUpdated;
}
