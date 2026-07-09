import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getStudentClasses } from "@/lib/db/classes";
import {
  getCurrentUserManageableMemberships,
  getCurrentUserStudentMemberships,
} from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementLink,
  AnnouncementReadDetails,
  AnnouncementReadParticipant,
  ClassSummary,
} from "@/types";

export type AnnouncementLinkInput = {
  title: string;
  url: string;
};

export type AnnouncementInput = {
  body: string;
  category: AnnouncementCategory;
  classId: string;
  isHidden: boolean;
  isPinned: boolean;
  links: AnnouncementLinkInput[];
  requireReadConfirmation: boolean;
  title: string;
  visibleFrom?: string;
  visibleUntil?: string;
};

type AnnouncementRow = {
  body: string;
  category: AnnouncementCategory | null;
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  deleted_at: string | null;
  id: string;
  is_hidden: boolean | null;
  is_pinned: boolean | null;
  require_read_confirmation: boolean | null;
  title: string;
  visible_from: string;
  visible_until: string | null;
};

type AnnouncementLinkRow = {
  announcement_id: string;
  id: string;
  sort_order: number | null;
  title: string;
  url: string;
};

type AnnouncementReadRow = {
  announcement_id: string;
  read_at: string;
  user_id: string;
};

type MembershipStudentRow = {
  class_id: string;
  profiles:
    | { display_name: string | null; username: string | null }
    | { display_name: string | null; username: string | null }[]
    | null;
  user_id: string;
};

type ClassRow = {
  active: boolean | null;
  archived_at: string | null;
  class_code: string;
  display_name: string | null;
  grade: number;
  id: string;
  name: string;
  school_year: string | null;
};

type MembershipClassRow = {
  class_id: string;
  role: string;
  classes: ClassRow | ClassRow[] | null;
};

const CATEGORY_FALLBACK: AnnouncementCategory = "general";

function getJoinedClass<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function getClassName(row: AnnouncementRow) {
  return getJoinedClass(row.classes)?.name;
}

function getProfileName(row: MembershipStudentRow) {
  const profile = getJoinedClass(row.profiles);

  return profile?.display_name ?? profile?.username ?? "תלמיד/ה";
}

function toAnnouncementLink(row: AnnouncementLinkRow): AnnouncementLink {
  return {
    id: row.id,
    sortOrder: row.sort_order ?? 0,
    title: row.title,
    url: row.url,
  };
}

function emptyReadDetails(): AnnouncementReadDetails {
  return {
    read: [],
    unread: [],
  };
}

function toAnnouncement(
  row: AnnouncementRow,
  links: AnnouncementLink[],
  read?: AnnouncementReadRow,
  readDetails?: AnnouncementReadDetails,
): Announcement {
  const className = getClassName(row);
  const readCount = readDetails?.read.length;
  const unreadCount = readDetails?.unread.length;

  return {
    audience: className ? `כיתה ${className}` : "כיתה",
    body: row.body,
    category: row.category ?? CATEGORY_FALLBACK,
    classId: row.class_id,
    className,
    deletedAt: row.deleted_at ?? undefined,
    id: row.id,
    isHidden: row.is_hidden ?? false,
    isPinned: row.is_pinned ?? false,
    links,
    readAt: read?.read_at,
    readCount,
    readDetails,
    requireReadConfirmation: row.require_read_confirmation ?? false,
    title: row.title,
    totalStudentCount:
      readCount === undefined || unreadCount === undefined
        ? undefined
        : readCount + unreadCount,
    visibleFrom: row.visible_from,
    visibleUntil: row.visible_until ?? undefined,
  };
}

function toClassSummary(row: MembershipClassRow, studentCount = 0): ClassSummary[] {
  const classRow = getJoinedClass(row.classes);

  if (!classRow) {
    return [];
  }

  return [
    {
      active: classRow.active ?? true,
      archivedAt: classRow.archived_at ?? undefined,
      classCode: classRow.class_code,
      displayName: classRow.display_name ?? undefined,
      grade: classRow.grade,
      id: classRow.id,
      name: classRow.name,
      role: row.role,
      schoolYear: classRow.school_year ?? undefined,
      studentCount,
    },
  ];
}

async function getLinksByAnnouncementIds(announcementIds: string[]) {
  const linksByAnnouncement = new Map<string, AnnouncementLink[]>();

  if (announcementIds.length === 0) {
    return linksByAnnouncement;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("announcement_links")
    .select("id, announcement_id, title, url, sort_order")
    .in("announcement_id", announcementIds)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return linksByAnnouncement;
  }

  (data as AnnouncementLinkRow[]).forEach((row) => {
    const links = linksByAnnouncement.get(row.announcement_id) ?? [];
    links.push(toAnnouncementLink(row));
    linksByAnnouncement.set(row.announcement_id, links);
  });

  return linksByAnnouncement;
}

async function getCurrentUserReadsByAnnouncementIds(announcementIds: string[]) {
  const readsByAnnouncement = new Map<string, AnnouncementReadRow>();
  const user = await getCurrentUser();

  if (!user || announcementIds.length === 0) {
    return readsByAnnouncement;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("announcement_reads")
    .select("announcement_id, user_id, read_at")
    .eq("user_id", user.id)
    .in("announcement_id", announcementIds);

  if (error || !data) {
    return readsByAnnouncement;
  }

  (data as AnnouncementReadRow[]).forEach((row) => {
    readsByAnnouncement.set(row.announcement_id, row);
  });

  return readsByAnnouncement;
}

async function getActiveStudentsByClassIds(classIds: string[]) {
  const studentsByClass = new Map<string, AnnouncementReadParticipant[]>();

  if (classIds.length === 0) {
    return studentsByClass;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, user_id, profiles(display_name, username)")
    .eq("role", "student")
    .eq("active", true)
    .in("class_id", classIds)
    .order("student_code", { ascending: true });

  if (error || !data) {
    return studentsByClass;
  }

  (data as unknown as MembershipStudentRow[]).forEach((row) => {
    const students = studentsByClass.get(row.class_id) ?? [];
    students.push({
      name: getProfileName(row),
      userId: row.user_id,
    });
    studentsByClass.set(row.class_id, students);
  });

  return studentsByClass;
}

async function getReadDetailsByAnnouncementRows(rows: AnnouncementRow[]) {
  const detailsByAnnouncement = new Map<string, AnnouncementReadDetails>();
  const targetRows = rows.filter((row) => row.require_read_confirmation);

  if (targetRows.length === 0) {
    return detailsByAnnouncement;
  }

  const announcementIds = targetRows.map((row) => row.id);
  const classIds = [...new Set(targetRows.map((row) => row.class_id))];
  const [studentsByClass, supabase] = await Promise.all([
    getActiveStudentsByClassIds(classIds),
    createSupabaseServerClient(),
  ]);
  const { data, error } = await supabase
    .from("announcement_reads")
    .select("announcement_id, user_id, read_at")
    .in("announcement_id", announcementIds);

  const reads = error || !data ? [] : (data as AnnouncementReadRow[]);
  const readsByAnnouncement = new Map<string, Map<string, AnnouncementReadRow>>();

  reads.forEach((read) => {
    const readsByUser = readsByAnnouncement.get(read.announcement_id) ?? new Map();
    readsByUser.set(read.user_id, read);
    readsByAnnouncement.set(read.announcement_id, readsByUser);
  });

  targetRows.forEach((row) => {
    const details = emptyReadDetails();
    const readsByUser = readsByAnnouncement.get(row.id) ?? new Map();

    (studentsByClass.get(row.class_id) ?? []).forEach((student) => {
      const read = readsByUser.get(student.userId);

      if (read) {
        details.read.push({ ...student, readAt: read.read_at });
      } else {
        details.unread.push(student);
      }
    });

    detailsByAnnouncement.set(row.id, details);
  });

  return detailsByAnnouncement;
}

async function getAnnouncementRows(
  classIds: string[],
  studentVisibleOnly: boolean,
  limit: number,
) {
  if (classIds.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("announcements")
    .select(
      "id, class_id, title, body, category, is_hidden, is_pinned, require_read_confirmation, visible_from, visible_until, deleted_at, classes(name)",
    )
    .in("class_id", classIds)
    .order("is_pinned", { ascending: false })
    .order("visible_from", { ascending: false });

  if (studentVisibleOnly) {
    query = query
      .is("deleted_at", null)
      .eq("is_hidden", false)
      .lte("visible_from", now)
      .or(`visible_until.is.null,visible_until.gte.${now}`);
  } else {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.limit(limit);

  if (error || !data) {
    return [];
  }

  return data as unknown as AnnouncementRow[];
}

async function getActiveStudentCounts(classIds: string[]) {
  const counts = new Map<string, number>();

  await Promise.all(
    classIds.map(async (classId) => {
      const supabase = await createSupabaseServerClient();
      const { count } = await supabase
        .from("class_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("class_id", classId)
        .eq("role", "student")
        .eq("active", true);

      counts.set(classId, count ?? 0);
    }),
  );

  return counts;
}

export async function getManageableAnnouncementClasses() {
  const memberships = await getCurrentUserManageableMemberships();

  if (memberships.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const classIds = memberships.map((membership) => membership.classId);
  const { data, error } = await supabase
    .from("class_memberships")
    .select(
      "class_id, role, classes(id, name, display_name, grade, class_code, school_year, active, archived_at)",
    )
    .in("class_id", classIds)
    .eq("active", true);

  if (error || !data) {
    return [];
  }

  const studentCounts = await getActiveStudentCounts(classIds);

  return (data as unknown as MembershipClassRow[]).flatMap((row) => {
    const membership = memberships.find(
      (item) => item.classId === row.class_id && item.role === row.role,
    );

    return membership ? toClassSummary(row, studentCounts.get(row.class_id)) : [];
  });
}

export async function getManageableAnnouncements(limit = 20) {
  const classes = await getManageableAnnouncementClasses();
  const rows = await getAnnouncementRows(
    classes.map((classSummary) => classSummary.id),
    false,
    limit,
  );
  const announcementIds = rows.map((row) => row.id);
  const [linksByAnnouncement, readDetailsByAnnouncement] = await Promise.all([
    getLinksByAnnouncementIds(announcementIds),
    getReadDetailsByAnnouncementRows(rows),
  ]);

  return rows.map((row) =>
    toAnnouncement(
      row,
      linksByAnnouncement.get(row.id) ?? [],
      undefined,
      readDetailsByAnnouncement.get(row.id),
    ),
  );
}

export async function getStudentAnnouncements(classIds?: string[], limit = 10) {
  const memberships = await getCurrentUserStudentMemberships();
  const membershipClassIds = memberships.map((membership) => membership.classId);
  const allowedClassIds = classIds
    ? classIds.filter((classId) => membershipClassIds.includes(classId))
    : membershipClassIds;
  const rows = await getAnnouncementRows(allowedClassIds, true, limit);
  const announcementIds = rows.map((row) => row.id);
  const [linksByAnnouncement, readsByAnnouncement] = await Promise.all([
    getLinksByAnnouncementIds(announcementIds),
    getCurrentUserReadsByAnnouncementIds(announcementIds),
  ]);

  return rows.map((row) =>
    toAnnouncement(
      row,
      linksByAnnouncement.get(row.id) ?? [],
      readsByAnnouncement.get(row.id),
    ),
  );
}

export async function getLatestStudentAnnouncements(limit = 10) {
  const classes = await getStudentClasses();
  const announcements = await getStudentAnnouncements(
    classes.map((classSummary) => classSummary.id),
    limit,
  );

  return announcements;
}

export async function createAnnouncement(input: AnnouncementInput) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  if (!manageableClassIds.includes(input.classId)) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      body: input.body,
      category: input.category,
      class_id: input.classId,
      created_by: user.id,
      is_hidden: input.isHidden,
      is_pinned: input.isPinned,
      require_read_confirmation: input.requireReadConfirmation,
      title: input.title,
      updated_by: user.id,
      visible_from: input.visibleFrom ?? new Date().toISOString(),
      visible_until: input.visibleUntil || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return false;
  }

  await replaceAnnouncementLinks(data.id, input.links);
  return true;
}

export async function updateAnnouncement(id: string, input: AnnouncementInput) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  if (!manageableClassIds.includes(input.classId)) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("announcements")
    .update({
      body: input.body,
      category: input.category,
      class_id: input.classId,
      is_hidden: input.isHidden,
      is_pinned: input.isPinned,
      require_read_confirmation: input.requireReadConfirmation,
      title: input.title,
      updated_by: user.id,
      visible_from: input.visibleFrom ?? new Date().toISOString(),
      visible_until: input.visibleUntil || null,
    })
    .eq("id", id);

  if (!error) {
    await replaceAnnouncementLinks(id, input.links);
    return true;
  }

  return false;
}

export async function setAnnouncementHidden(id: string, isHidden: boolean) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("announcements")
    .update({
      is_hidden: isHidden,
      updated_by: user.id,
    })
    .eq("id", id);
}

export async function softDeleteAnnouncement(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("announcements")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", id);
}

export async function markAnnouncementRead(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("announcement_reads").upsert(
    {
      announcement_id: id,
      read_at: new Date().toISOString(),
      user_id: user.id,
    },
    {
      onConflict: "announcement_id,user_id",
    },
  );
}

async function replaceAnnouncementLinks(
  announcementId: string,
  links: AnnouncementLinkInput[],
) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("announcement_links")
    .delete()
    .eq("announcement_id", announcementId);

  const rows = links
    .filter((link) => link.title && link.url)
    .map((link, index) => ({
      announcement_id: announcementId,
      sort_order: index,
      title: link.title,
      url: link.url,
    }));

  if (rows.length > 0) {
    await supabase.from("announcement_links").insert(rows);
  }
}
