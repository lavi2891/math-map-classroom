import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { studentProfileCards, teacherProfileCards } from "@/data/mock";
import {
  getCurrentUserStaffMemberships,
  getCurrentUserStudentMemberships,
} from "@/lib/db/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  KnowledgeDomain,
  KnowledgeSkill,
  KnowledgeSkillType,
  KnowledgeSkillTypeSection,
  SkillResource,
  SkillResourceType,
  SkillSelfAssessmentSummary,
  StudentKnowledgeMap,
  TeacherKnowledgeStatus,
  UnderstandingLevel,
} from "@/types";

type DomainRow = {
  description: string | null;
  grade: number;
  id: string;
  sort_order: number | null;
  title: string;
};

type SkillRow = {
  active: boolean | null;
  description: string | null;
  diagnostic_question: string | null;
  domain_id: string;
  external_practice_url: string | null;
  id: string;
  required_knowledge: string | null;
  skill_type: KnowledgeSkillType | null;
  sort_order: number | null;
  title: string;
};

type ResourceRow = {
  id: string;
  resource_type: SkillResourceType | null;
  skill_id: string;
  sort_order: number | null;
  title: string;
  url: string;
};

type ClassRow = {
  display_name: string | null;
  grade: number;
  id: string;
  name: string;
};

type ProgressRow = {
  is_taught: boolean | null;
  skill_id: string;
};

type AssessmentRow = {
  level: UnderstandingLevel;
  skill_id: string;
};

const SKILL_TYPE_ORDER: KnowledgeSkillType[] = [
  "prerequisite",
  "curriculum",
  "support",
  "enrichment",
  "system",
];

const NO_PERFORMANCE_DATA_LABEL = "אין עדיין נתוני ביצוע";

function toResource(row: ResourceRow): SkillResource {
  return {
    id: row.id,
    resourceType: row.resource_type ?? "other",
    sortOrder: row.sort_order ?? 0,
    title: row.title,
    url: row.url,
  };
}

function emptySummary(totalStudentCount: number): SkillSelfAssessmentSummary {
  return {
    good: 0,
    no: 0,
    partial: 0,
    unreported: totalStudentCount,
  };
}

function buildSections(input: {
  assessmentsBySkillId?: Map<string, UnderstandingLevel>;
  domains: DomainRow[];
  progressBySkillId: Map<string, boolean>;
  resourcesBySkillId: Map<string, SkillResource[]>;
  selfAssessmentSummaryBySkillId?: Map<string, SkillSelfAssessmentSummary>;
  skills: SkillRow[];
}) {
  const skillsByDomainId = input.skills.reduce<Map<string, KnowledgeSkill[]>>(
    (map, row) => {
      const skill: KnowledgeSkill = {
        description: row.description ?? undefined,
        diagnosticQuestion: row.diagnostic_question ?? undefined,
        externalPracticeUrl: row.external_practice_url ?? undefined,
        id: row.id,
        isTaught: input.progressBySkillId.get(row.id) ?? false,
        performanceLabel: NO_PERFORMANCE_DATA_LABEL,
        requiredKnowledge: row.required_knowledge ?? undefined,
        resources: input.resourcesBySkillId.get(row.id) ?? [],
        selfAssessment: input.assessmentsBySkillId?.get(row.id),
        selfAssessmentSummary: input.selfAssessmentSummaryBySkillId?.get(row.id),
        skillType: row.skill_type ?? "curriculum",
        sortOrder: row.sort_order ?? 0,
        title: row.title,
      };
      const items = map.get(row.domain_id) ?? [];
      items.push(skill);
      map.set(row.domain_id, items);
      return map;
    },
    new Map<string, KnowledgeSkill[]>(),
  );

  return SKILL_TYPE_ORDER.map<KnowledgeSkillTypeSection>((skillType) => {
    const domains = input.domains.flatMap<KnowledgeDomain>((domain) => {
      const skills = (skillsByDomainId.get(domain.id) ?? [])
        .filter((skill) => skill.skillType === skillType)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

      if (skills.length === 0) {
        return [];
      }

      return [
        {
          description: domain.description ?? undefined,
          grade: domain.grade,
          id: domain.id,
          skills,
          sortOrder: domain.sort_order ?? 0,
          title: domain.title,
        },
      ];
    });

    return { domains, skillType };
  }).filter((section) => section.domains.length > 0);
}

async function getClassForStaff(classId: string) {
  const memberships = await getCurrentUserStaffMemberships();
  const membership = memberships.find((item) => item.classId === classId);

  if (!membership) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, display_name, grade")
    .eq("id", classId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    canManage: membership.role === "owner" || membership.role === "teacher",
    classRow: data as ClassRow,
  };
}

async function getClassForStudent(classId: string, studentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_memberships")
    .select("class_id, classes(id, name, display_name, grade)")
    .eq("class_id", classId)
    .eq("user_id", studentId)
    .eq("role", "student")
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as {
    classes: ClassRow | ClassRow[] | null;
  };
  const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes;

  return classRow ?? null;
}

export async function getKnowledgeMapForGrade(grade: number) {
  const supabase = await createSupabaseServerClient();
  const [{ data: domains }, { data: skills }] = await Promise.all([
    supabase
      .from("knowledge_domains")
      .select("id, grade, title, description, sort_order")
      .eq("grade", grade)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("knowledge_skills")
      .select(
        "id, domain_id, title, description, required_knowledge, diagnostic_question, external_practice_url, sort_order, active, skill_type",
      )
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
  ]);

  const domainRows = (domains ?? []) as DomainRow[];
  const domainIds = new Set(domainRows.map((domain) => domain.id));
  const skillRows = ((skills ?? []) as SkillRow[]).filter((skill) =>
    domainIds.has(skill.domain_id),
  );
  const resourcesBySkillId = await getSkillResourcesBySkillIds(
    skillRows.map((skill) => skill.id),
  );

  return buildSections({
    domains: domainRows,
    progressBySkillId: new Map(),
    resourcesBySkillId,
    skills: skillRows,
  });
}

export function getStudentProfileCards() {
  return studentProfileCards;
}

export function getTeacherProfileCards() {
  return teacherProfileCards;
}

async function getMapRowsForGrade(grade: number) {
  const supabase = await createSupabaseServerClient();
  const { data: domains } = await supabase
    .from("knowledge_domains")
    .select("id, grade, title, description, sort_order")
    .eq("grade", grade)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  const domainRows = (domains ?? []) as DomainRow[];
  const domainIds = domainRows.map((domain) => domain.id);

  if (domainIds.length === 0) {
    return { domains: domainRows, resourcesBySkillId: new Map(), skills: [] };
  }

  const { data: skills } = await supabase
    .from("knowledge_skills")
    .select(
      "id, domain_id, title, description, required_knowledge, diagnostic_question, external_practice_url, sort_order, active, skill_type",
    )
    .in("domain_id", domainIds)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  const skillRows = (skills ?? []) as SkillRow[];
  const resourcesBySkillId = await getSkillResourcesBySkillIds(
    skillRows.map((skill) => skill.id),
  );

  return { domains: domainRows, resourcesBySkillId, skills: skillRows };
}

async function getSkillResourcesBySkillIds(skillIds: string[]) {
  const resourcesBySkillId = new Map<string, SkillResource[]>();

  if (skillIds.length === 0) {
    return resourcesBySkillId;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("skill_resources")
    .select("id, skill_id, resource_type, title, url, sort_order")
    .in("skill_id", skillIds)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  ((data ?? []) as ResourceRow[]).forEach((row) => {
    const resources = resourcesBySkillId.get(row.skill_id) ?? [];
    resources.push(toResource(row));
    resourcesBySkillId.set(row.skill_id, resources);
  });

  return resourcesBySkillId;
}

export async function getSkillResources(skillId: string) {
  const map = await getSkillResourcesBySkillIds([skillId]);

  return map.get(skillId) ?? [];
}

async function getProgressBySkillId(classId: string, skillIds: string[]) {
  const progressBySkillId = new Map<string, boolean>();

  if (skillIds.length === 0) {
    return progressBySkillId;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_skill_progress")
    .select("skill_id, is_taught")
    .eq("class_id", classId)
    .in("skill_id", skillIds);

  ((data ?? []) as ProgressRow[]).forEach((row) => {
    progressBySkillId.set(row.skill_id, row.is_taught ?? false);
  });

  return progressBySkillId;
}

async function getSelfAssessmentSummaryBySkillId(
  classId: string,
  skillIds: string[],
) {
  const summaries = new Map<string, SkillSelfAssessmentSummary>();

  if (skillIds.length === 0) {
    return summaries;
  }

  const supabase = await createSupabaseServerClient();
  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("class_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("role", "student")
      .eq("active", true),
    supabase
      .from("student_skill_self_assessments")
      .select("skill_id, level")
      .eq("class_id", classId)
      .in("skill_id", skillIds),
  ]);
  const totalStudentCount = count ?? 0;

  skillIds.forEach((skillId) => {
    summaries.set(skillId, emptySummary(totalStudentCount));
  });

  ((data ?? []) as AssessmentRow[]).forEach((row) => {
    const summary = summaries.get(row.skill_id) ?? emptySummary(totalStudentCount);

    if (row.level === "good") {
      summary.good += 1;
    }

    if (row.level === "partial") {
      summary.partial += 1;
    }

    if (row.level === "no") {
      summary.no += 1;
    }

    summary.unreported = Math.max(
      0,
      totalStudentCount - summary.good - summary.partial - summary.no,
    );
    summaries.set(row.skill_id, summary);
  });

  return summaries;
}

export async function getSkillSelfAssessmentSummary(classId: string) {
  const classStatus = await getTeacherClassKnowledgeStatus(classId);

  if (!classStatus) {
    return new Map<string, SkillSelfAssessmentSummary>();
  }

  return classStatus.sections.reduce<Map<string, SkillSelfAssessmentSummary>>(
    (map, section) => {
      section.domains.forEach((domain) => {
        domain.skills.forEach((skill) => {
          if (skill.selfAssessmentSummary) {
            map.set(skill.id, skill.selfAssessmentSummary);
          }
        });
      });
      return map;
    },
    new Map<string, SkillSelfAssessmentSummary>(),
  );
}

export async function getTeacherClassKnowledgeStatus(
  classId: string,
): Promise<TeacherKnowledgeStatus | null> {
  const staffClass = await getClassForStaff(classId);

  if (!staffClass) {
    return null;
  }

  const classRow = staffClass.classRow;
  const { domains, resourcesBySkillId, skills } = await getMapRowsForGrade(
    classRow.grade,
  );
  const skillIds = skills.map((skill) => skill.id);
  const [progressBySkillId, selfAssessmentSummaryBySkillId] = await Promise.all([
    getProgressBySkillId(classId, skillIds),
    getSelfAssessmentSummaryBySkillId(classId, skillIds),
  ]);

  return {
    canManage: staffClass.canManage,
    classId,
    className: classRow.display_name ?? classRow.name,
    grade: classRow.grade,
    sections: buildSections({
      domains,
      progressBySkillId,
      resourcesBySkillId,
      selfAssessmentSummaryBySkillId,
      skills,
    }),
  };
}

export async function getStudentKnowledgeMap(
  classId: string,
  studentId: string,
): Promise<StudentKnowledgeMap | null> {
  const classRow = await getClassForStudent(classId, studentId);

  if (!classRow) {
    return null;
  }

  const { domains, resourcesBySkillId, skills } = await getMapRowsForGrade(
    classRow.grade,
  );
  const skillIds = skills.map((skill) => skill.id);
  const supabase = await createSupabaseServerClient();
  const [{ data: assessmentRows }, progressBySkillId] = await Promise.all([
    supabase
      .from("student_skill_self_assessments")
      .select("skill_id, level")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .in("skill_id", skillIds),
    getProgressBySkillId(classId, skillIds),
  ]);
  const assessmentsBySkillId = new Map<string, UnderstandingLevel>();

  ((assessmentRows ?? []) as AssessmentRow[]).forEach((row) => {
    assessmentsBySkillId.set(row.skill_id, row.level);
  });

  return {
    classId,
    className: classRow.display_name ?? classRow.name,
    grade: classRow.grade,
    sections: buildSections({
      assessmentsBySkillId,
      domains,
      progressBySkillId,
      resourcesBySkillId,
      skills,
    }),
  };
}

export async function markSkillTaught(classId: string, skillId: string) {
  return setSkillTaught(classId, skillId, true);
}

export async function unmarkSkillTaught(classId: string, skillId: string) {
  return setSkillTaught(classId, skillId, false);
}

async function setSkillTaught(
  classId: string,
  skillId: string,
  isTaught: boolean,
) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const memberships = await getCurrentUserStaffMemberships();
  const canManage = memberships.some(
    (membership) =>
      membership.classId === classId &&
      (membership.role === "owner" || membership.role === "teacher"),
  );

  if (!canManage) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("class_skill_progress").upsert(
    {
      class_id: classId,
      is_taught: isTaught,
      skill_id: skillId,
      taught_at: isTaught ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "class_id,skill_id" },
  );

  return !error;
}

export async function upsertStudentSkillSelfAssessment(
  classId: string,
  studentId: string,
  skillId: string,
  level: UnderstandingLevel,
) {
  const user = await getCurrentUser();

  if (!user || user.id !== studentId) {
    return false;
  }

  const memberships = await getCurrentUserStudentMemberships();
  const isStudentInClass = memberships.some(
    (membership) => membership.classId === classId,
  );

  if (!isStudentInClass) {
    return false;
  }

  const supabase = await createSupabaseServerClient();

  if (level === "unknown") {
    const { error } = await supabase
      .from("student_skill_self_assessments")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .eq("skill_id", skillId);

    return !error;
  }

  const { error } = await supabase.from("student_skill_self_assessments").upsert(
    {
      class_id: classId,
      level,
      skill_id: skillId,
      student_id: studentId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "class_id,student_id,skill_id" },
  );

  return !error;
}
