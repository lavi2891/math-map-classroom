import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagedStudent = {
  displayName: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  studentCode?: string;
  userId: string;
  username: string;
};

export type StudentLoginSlip = {
  classCode: string;
  className: string;
  displayName: string;
  loginUrl: string;
  studentCode?: string;
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
  studentCode?: string;
  temporaryPassword?: string;
  username: string;
};

export type BulkCreateStudentsInput = {
  classId: string;
  count: number;
  names: string[];
  startingCode: string;
  temporaryPassword?: string;
  usernamePrefix: string;
};

export type StudentMutationResult = {
  error?: string;
  message?: string;
  profile?: StudentProfileSearchResult;
  slip?: StudentLoginSlip;
  slips?: StudentLoginSlip[];
  success: boolean;
};

type ManagedClassRow = {
  class_code: string;
  id: string;
  name: string;
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
  student_code: string | null;
  user_id: string;
};

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

function getLoginUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com/login";
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

async function canOwnClass(classId: string, userId?: string) {
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
    .eq("role", "owner")
    .eq("active", true)
    .maybeSingle();

  return Boolean(data);
}

async function getOwnedClass(classId: string, userId: string) {
  if (!(await canOwnClass(classId, userId))) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, class_code")
    .eq("id", classId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ManagedClassRow;
}

async function verifyActiveStudentInClass(classId: string, studentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select("user_id")
    .eq("class_id", classId)
    .eq("user_id", studentId)
    .eq("role", "student")
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("verifyActiveStudentInClass failed", {
      classId,
      errorMessage: error.message,
      studentId,
    });
  }

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
      "user_id, student_code, profiles(display_name, username, must_change_password, password_changed_at)",
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
          studentCode: row.student_code ?? undefined,
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

  if (error) {
    console.error("getProfileByUsername failed", {
      errorMessage: error.message,
      username,
    });

    return null;
  }

  if (!data) {
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

async function getProfileByUsernameWithAdmin(username: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("getProfileByUsernameWithAdmin failed", {
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      errorMessage: error.message,
      username,
    });

    return null;
  }

  if (!data) {
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

async function createManagedStudentRecord(
  classId: string,
  studentId: string,
  username: string,
  displayName: string | null,
  studentCode: string | null,
  teacherId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_managed_student_record", {
    target_class_id: classId,
    target_created_by: teacherId,
    target_display_name: displayName ?? "",
    target_student_id: studentId,
    target_username: username,
  });

  if (error) {
    console.error("createManagedStudentRecord rpc failed", {
      errorMessage: error.message,
      studentId,
      username,
    });

    return false;
  }

  if (studentCode) {
    const { error: codeError } = await supabase
      .from("class_memberships")
      .update({ student_code: studentCode, updated_at: new Date().toISOString() })
      .eq("class_id", classId)
      .eq("user_id", studentId)
      .eq("role", "student");

    if (codeError) {
      console.error("createManagedStudentRecord student code update failed", {
        errorMessage: codeError.message,
        studentId,
        username,
      });

      return false;
    }
  }

  const profile = await getProfileByUsername(username);
  const isStudentAttached = await verifyActiveStudentInClass(classId, studentId);

  if (profile?.userId !== studentId || !isStudentAttached) {
    console.error("createManagedStudentRecord verification failed", {
      attachedToClass: isStudentAttached,
      profileUserId: profile?.userId,
      studentId,
      username,
    });

    return false;
  }

  return true;
}

function buildLoginSlip(input: {
  classCode: string;
  className: string;
  displayName: string | null;
  studentCode?: string | null;
  temporaryPassword: string;
  username: string;
}) {
  return {
    classCode: input.classCode,
    className: input.className,
    displayName: getDisplayName(input.displayName, input.username),
    loginUrl: getLoginUrl(),
    studentCode: input.studentCode ?? undefined,
    temporaryPassword: input.temporaryPassword,
    username: input.username,
  } satisfies StudentLoginSlip;
}

async function setPasswordRequirementForClass(
  classId: string,
  studentId: string,
  mustChangePassword: boolean,
  action: "reset" | "forced_change" | null,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "set_student_password_requirement_for_class",
    {
      target_action: action,
      target_class_id: classId,
      target_must_change_password: mustChangePassword,
      target_student_id: studentId,
    },
  );

  if (error) {
    console.error("setPasswordRequirementForClass rpc failed", {
      action,
      errorMessage: error.message,
      expectedMustChangePassword: mustChangePassword,
      studentId,
    });

    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", studentId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.must_change_password !== mustChangePassword
  ) {
    console.error("setPasswordRequirementForClass verification failed", {
      action,
      errorMessage: profileError?.message,
      expectedMustChangePassword: mustChangePassword,
      returnedMustChangePassword: profile?.must_change_password,
      studentId,
    });

    return false;
  }

  return true;
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

async function setOwnPasswordChanged(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  if (!username) {
    return { error: "יש להזין שם משתמש.", success: false };
  }

  const profile = await getProfileByUsernameWithAdmin(username);

  if (!profile) {
    return { error: "לא נמצא משתמש בשם המשתמש הזה.", success: false };
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
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  const profile = await getProfileByUsernameWithAdmin(username);

  if (!profile) {
    return { error: "לא נמצא משתמש בשם המשתמש הזה.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingMembership, error: membershipLookupError } = await supabase
    .from("class_memberships")
    .select("active")
    .eq("class_id", classId)
    .eq("user_id", profile.userId)
    .eq("role", "student")
    .maybeSingle();

  if (membershipLookupError) {
    console.error("attachExistingStudentToClass membership lookup failed", {
      classId,
      errorMessage: membershipLookupError.message,
      studentId: profile.userId,
    });

    return { error: "לא הצלחנו לבדוק את שיוך המשתמש לכיתה.", success: false };
  }

  if (existingMembership?.active) {
    return { error: "המשתמש כבר משויך לכיתה.", success: false };
  }

  const { error } = await supabase.from("class_memberships").upsert(
    {
      active: true,
      class_id: classId,
      role: "student",
      student_code: null,
      updated_at: new Date().toISOString(),
      user_id: profile.userId,
    },
    { onConflict: "class_id,user_id" },
  );

  if (error) {
    console.error("attachExistingStudentToClass membership upsert failed", {
      classId,
      errorMessage: error.message,
      studentId: profile.userId,
    });

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
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  if (!(await verifyActiveStudentInClass(classId, studentId))) {
    return { error: "התלמיד אינו משויך לכיתה הזו.", success: false };
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
  const studentCode = input.studentCode?.trim() || null;
  const temporaryPassword =
    input.temporaryPassword?.trim() || generateTemporaryPassword();

  if (!teacher) {
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  const managedClass = await getOwnedClass(input.classId, teacher.id);

  if (!managedClass) {
    return { error: "רק בעל הכיתה יכול לנהל חשבונות תלמידים.", success: false };
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
  const saved = await createManagedStudentRecord(
    input.classId,
    studentId,
    username,
    displayName,
    studentCode,
    teacher.id,
  );

  if (!saved) {
    return {
      error:
        "משתמש ההתחברות נוצר, אבל לא הצלחנו לשמור פרופיל תלמיד ושיוך לכיתה.",
      success: false,
    };
  }

  return {
    slip: buildLoginSlip({
      classCode: managedClass.class_code,
      className: managedClass.name,
      displayName,
      studentCode,
      temporaryPassword,
      username,
    }),
    success: true,
  };
}

function parseStudentCode(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function formatStudentCode(value: number, width: number) {
  return String(value).padStart(Math.max(width, 3), "0");
}

export async function bulkCreateManagedStudents(
  input: BulkCreateStudentsInput,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();

  if (!teacher) {
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  const managedClass = await getOwnedClass(input.classId, teacher.id);

  if (!managedClass) {
    return { error: "רק בעל הכיתה יכול לנהל חשבונות תלמידים.", success: false };
  }

  const usernamePrefix = normalizeStudentUsername(input.usernamePrefix);
  const startingCode = input.startingCode.trim() || "001";
  const codeStart = parseStudentCode(startingCode);
  const codeWidth = Math.max(startingCode.length, 3);
  const names = input.names.map((name) => name.trim()).filter(Boolean);
  const totalCount = names.length > 0 ? names.length : input.count;

  if (!usernamePrefix || totalCount < 1 || totalCount > 60) {
    return { error: "יש להזין פרטי יצירה תקינים.", success: false };
  }

  if (!isValidStudentUsername(usernamePrefix)) {
    return {
      error: "קידומת שם המשתמש יכולה לכלול אותיות באנגלית, מספרים, קו תחתון ומקף בלבד.",
      success: false,
    };
  }

  const slips: StudentLoginSlip[] = [];

  for (let index = 0; index < totalCount; index += 1) {
    const studentCode = formatStudentCode(codeStart + index, codeWidth);
    const username = `${usernamePrefix}${studentCode}`;
    const displayName = names[index] || null;
    const temporaryPassword =
      input.temporaryPassword?.trim() || generateTemporaryPassword();
    const result = await createManagedStudent({
      classId: input.classId,
      displayName: displayName ?? undefined,
      studentCode,
      temporaryPassword,
      username,
    });

    if (!result.success || !result.slip) {
      return {
        error:
          result.error ??
          `לא הצלחנו ליצור את התלמיד עם הקוד ${studentCode}.`,
        slips,
        success: false,
      };
    }

    slips.push(result.slip);
  }

  return { slips, success: true };
}

export async function resetManagedStudentPassword(
  classId: string,
  studentId: string,
): Promise<StudentMutationResult> {
  const teacher = await getCurrentUser();

  if (!teacher) {
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  const managedClass = await getOwnedClass(classId, teacher.id);

  if (!managedClass) {
    return { error: "רק בעל הכיתה יכול לנהל חשבונות תלמידים.", success: false };
  }

  if (!(await verifyActiveStudentInClass(classId, studentId))) {
    return { error: "התלמיד אינו משויך לכיתה הזו.", success: false };
  }

  const students = await getManagedStudents(classId);
  const student = students.find((item) => item.userId === studentId);

  if (!student?.username) {
    return { error: "התלמיד אינו משויך לכיתה הזו.", success: false };
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

  const flagUpdated = await setPasswordRequirementForClass(
    classId,
    studentId,
    true,
    "reset",
  );

  if (!flagUpdated) {
    return {
      error: "לא הצלחנו לעדכן את חובת החלפת הסיסמה.",
      success: false,
    };
  }

  return {
    slip: buildLoginSlip({
      classCode: managedClass.class_code,
      className: managedClass.name,
      displayName: student.displayName,
      studentCode: student.studentCode,
      temporaryPassword,
      username: student.username,
    }),
    success: true,
  };
}

export async function forceManagedStudentPasswordChange(
  classId: string,
  studentId: string,
) {
  const teacher = await getCurrentUser();

  if (!teacher || !(await canOwnClass(classId, teacher.id))) {
    return { error: "אין לך הרשאה לבצע פעולה זו.", success: false };
  }

  if (!(await verifyActiveStudentInClass(classId, studentId))) {
    return { error: "התלמיד אינו משויך לכיתה הזו.", success: false };
  }

  const flagUpdated = await setPasswordRequirementForClass(
    classId,
    studentId,
    true,
    "forced_change",
  );

  if (!flagUpdated) {
    return {
      error: "לא הצלחנו לעדכן את חובת החלפת הסיסמה.",
      success: false,
    };
  }

  return { success: true };
}

export async function recordOwnPasswordChanged(userId: string) {
  const profileUpdated = await setOwnPasswordChanged(userId);

  if (profileUpdated) {
    await insertOwnPasswordEvent("changed", userId, userId);
  }

  return profileUpdated;
}
