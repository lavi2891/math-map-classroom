import { getStudentClasses } from "@/lib/db/classes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Announcement } from "@/types";

type AnnouncementRow = {
  body: string;
  class_id: string;
  classes: { name: string } | { name: string }[] | null;
  id: string;
  title: string;
  visible_from: string;
};

function getClassName(row: AnnouncementRow) {
  const joinedClass = Array.isArray(row.classes) ? row.classes[0] : row.classes;

  return joinedClass?.name;
}

function toAnnouncement(row: AnnouncementRow): Announcement {
  const className = getClassName(row);

  return {
    audience: className ? `כיתה ${className}` : "כיתה",
    body: row.body,
    classId: row.class_id,
    className,
    id: row.id,
    title: row.title,
    visibleFrom: row.visible_from,
  };
}

export async function getAnnouncements(classIds?: string[]) {
  if (classIds && classIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("announcements")
    .select("id, class_id, title, body, visible_from, classes(name)")
    .lte("visible_from", new Date().toISOString())
    .order("visible_from", { ascending: false });

  if (classIds && classIds.length > 0) {
    query = query.in("class_id", classIds);
  }

  const { data, error } = await query.limit(20);

  if (error || !data) {
    return [];
  }

  return (data as AnnouncementRow[]).map(toAnnouncement);
}

export async function getLatestStudentAnnouncements(limit = 5) {
  const classes = await getStudentClasses();
  const announcements = await getAnnouncements(
    classes.map((classSummary) => classSummary.id),
  );

  return announcements.slice(0, limit);
}
