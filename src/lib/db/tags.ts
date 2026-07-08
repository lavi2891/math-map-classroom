import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getCurrentUserManageableMemberships } from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HomeworkTag, HomeworkTagInput, HomeworkTagSuggestion } from "@/types";

type TagRow = {
  class_id: string | null;
  id: string;
  knowledge_skill_id: string | null;
  label: string;
  normalized_label: string;
};

type HomeworkTagRow = {
  homework_id: string;
  tags: TagRow | TagRow[] | null;
};

type SkillRow = {
  id: string;
  title: string;
};

function getJoined<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function toHomeworkTag(row: TagRow): HomeworkTag {
  return {
    classId: row.class_id ?? undefined,
    id: row.id,
    knowledgeSkillId: row.knowledge_skill_id ?? undefined,
    label: row.label,
    normalizedLabel: row.normalized_label,
  };
}

export function normalizeTagLabel(label: string) {
  return label
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "_");
}

function getDisplayTagLabel(label: string) {
  return label.trim().replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

function dedupeTagInputs(inputs: HomeworkTagInput[]) {
  const seen = new Set<string>();
  const result: HomeworkTagInput[] = [];

  inputs.forEach((input) => {
    const label = getDisplayTagLabel(input.label);
    const normalizedLabel = normalizeTagLabel(label);

    if (!label || seen.has(normalizedLabel)) {
      return;
    }

    seen.add(normalizedLabel);
    result.push({
      knowledgeSkillId: input.knowledgeSkillId,
      label,
    });
  });

  return result;
}

async function canManageClass(classId: string) {
  const manageableClassIds = (await getCurrentUserManageableMemberships()).map(
    (membership) => membership.classId,
  );

  return manageableClassIds.includes(classId);
}

export async function getTagSuggestions(input: string, classId?: string) {
  const normalizedInput = normalizeTagLabel(input);

  if (!normalizedInput) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const tagQueries = [
    supabase
      .from("tags")
      .select("id, label, normalized_label, class_id, knowledge_skill_id")
      .is("class_id", null)
      .ilike("normalized_label", `${normalizedInput}%`)
      .order("label", { ascending: true })
      .limit(8),
  ];

  if (classId) {
    tagQueries.unshift(
      supabase
        .from("tags")
        .select("id, label, normalized_label, class_id, knowledge_skill_id")
        .eq("class_id", classId)
        .ilike("normalized_label", `${normalizedInput}%`)
        .order("label", { ascending: true })
        .limit(8),
    );
  }

  const [tagResults, skillsResult] = await Promise.all([
    Promise.all(tagQueries),
    supabase
      .from("knowledge_skills")
      .select("id, title")
      .eq("active", true)
      .ilike("title", `${input.replace(/^#+/, "").trim()}%`)
      .order("title", { ascending: true })
      .limit(8),
  ]);

  const suggestions: HomeworkTagSuggestion[] = [];
  const seen = new Set<string>();

  tagResults.forEach(({ data }) => {
    (data as TagRow[] | null)?.forEach((row) => {
      if (seen.has(row.normalized_label)) {
        return;
      }

      seen.add(row.normalized_label);
      suggestions.push({
        id: row.id,
        knowledgeSkillId: row.knowledge_skill_id ?? undefined,
        label: row.label,
        source: "tag",
      });
    });
  });

  (skillsResult.data as SkillRow[] | null)?.forEach((skill) => {
    const normalizedLabel = normalizeTagLabel(skill.title);

    if (seen.has(normalizedLabel)) {
      return;
    }

    seen.add(normalizedLabel);
    suggestions.push({
      knowledgeSkillId: skill.id,
      label: skill.title,
      source: "skill",
    });
  });

  return suggestions.slice(0, 8);
}

export async function getOrCreateTag(input: HomeworkTagInput, classId: string) {
  const user = await getCurrentUser();
  const label = getDisplayTagLabel(input.label);
  const normalizedLabel = normalizeTagLabel(label);

  if (!user || !label || !normalizedLabel || !(await canManageClass(classId))) {
    return undefined;
  }

  const supabase = await createSupabaseServerClient();
  const { data: classTag } = await supabase
    .from("tags")
    .select("id, label, normalized_label, class_id, knowledge_skill_id")
    .eq("class_id", classId)
    .eq("normalized_label", normalizedLabel)
    .maybeSingle();

  if (classTag) {
    return toHomeworkTag(classTag as TagRow);
  }

  const { data: globalTag } = await supabase
    .from("tags")
    .select("id, label, normalized_label, class_id, knowledge_skill_id")
    .is("class_id", null)
    .eq("normalized_label", normalizedLabel)
    .maybeSingle();

  if (globalTag) {
    return toHomeworkTag(globalTag as TagRow);
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({
      class_id: classId,
      created_by: user.id,
      knowledge_skill_id: input.knowledgeSkillId ?? null,
      label,
      normalized_label: normalizedLabel,
    })
    .select("id, label, normalized_label, class_id, knowledge_skill_id")
    .single();

  if (error || !data) {
    return undefined;
  }

  return toHomeworkTag(data as TagRow);
}

export async function getTagsForHomework(homeworkId: string) {
  const tagsByHomework = await getTagsForHomeworkIds([homeworkId]);

  return tagsByHomework.get(homeworkId) ?? [];
}

export async function getTagsForHomeworkIds(homeworkIds: string[]) {
  const tagsByHomework = new Map<string, HomeworkTag[]>();

  if (homeworkIds.length === 0) {
    return tagsByHomework;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_tags")
    .select(
      "homework_id, tags(id, label, normalized_label, class_id, knowledge_skill_id)",
    )
    .in("homework_id", homeworkIds);

  if (error || !data) {
    return tagsByHomework;
  }

  (data as unknown as HomeworkTagRow[]).forEach((row) => {
    const tagRow = getJoined(row.tags);

    if (!tagRow) {
      return;
    }

    const tags = tagsByHomework.get(row.homework_id) ?? [];
    tags.push(toHomeworkTag(tagRow));
    tagsByHomework.set(row.homework_id, tags);
  });

  return tagsByHomework;
}

export async function replaceHomeworkTags(
  homeworkId: string,
  classId: string,
  inputs: HomeworkTagInput[],
) {
  const tagInputs = dedupeTagInputs(inputs);
  const tags = (
    await Promise.all(tagInputs.map((input) => getOrCreateTag(input, classId)))
  ).filter((tag): tag is HomeworkTag => Boolean(tag));
  const supabase = await createSupabaseServerClient();
  const { error: deleteError } = await supabase
    .from("homework_tags")
    .delete()
    .eq("homework_id", homeworkId);

  if (deleteError) {
    return false;
  }

  if (tags.length === 0) {
    return true;
  }

  const { error } = await supabase.from("homework_tags").insert(
    tags.map((tag) => ({
      homework_id: homeworkId,
      tag_id: tag.id,
    })),
  );

  return !error;
}
