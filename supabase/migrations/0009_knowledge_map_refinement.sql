-- =========================================================
-- 0009_knowledge_map_refinement.sql
-- Knowledge map refinement: skill types, skill resources,
-- and class-scoped student self assessments.
-- =========================================================

alter table public.knowledge_skills
add column if not exists skill_type text not null default 'curriculum'
check (
  skill_type in (
    'prerequisite',
    'curriculum',
    'support',
    'enrichment',
    'system'
  )
);

create index if not exists idx_knowledge_skills_skill_type
on public.knowledge_skills(skill_type);

create table if not exists public.skill_resources (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.knowledge_skills(id) on delete cascade,
  resource_type text not null default 'other'
    check (
      resource_type in (
        'practice',
        'video',
        'worksheet',
        'explanation',
        'geogebra',
        'form',
        'other'
      )
    ),
  title text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_skill_resources_skill_id
on public.skill_resources(skill_id);

alter table public.skill_resources enable row level security;

drop policy if exists "skill_resources_select_authenticated"
on public.skill_resources;

create policy "skill_resources_select_authenticated"
on public.skill_resources
for select
to authenticated
using (true);

drop policy if exists "skill_resources_manage_any_staff"
on public.skill_resources;

create policy "skill_resources_manage_any_staff"
on public.skill_resources
for all
to authenticated
using (public.is_any_class_staff())
with check (public.is_any_class_staff());

alter table public.student_skill_self_assessments
add column if not exists class_id uuid references public.classes(id) on delete cascade;

update public.student_skill_self_assessments assessment
set class_id = (
  select membership.class_id
  from public.class_memberships membership
  where membership.user_id = assessment.student_id
    and membership.role = 'student'
    and membership.active = true
  order by membership.created_at asc
  limit 1
)
where assessment.class_id is null;

delete from public.student_skill_self_assessments
where class_id is null;

alter table public.student_skill_self_assessments
alter column class_id set not null;

alter table public.student_skill_self_assessments
drop constraint if exists student_skill_self_assessments_pkey;

alter table public.student_skill_self_assessments
add primary key (class_id, student_id, skill_id);

create index if not exists idx_student_skill_self_assessments_class_id
on public.student_skill_self_assessments(class_id);

create index if not exists idx_student_skill_self_assessments_student_class
on public.student_skill_self_assessments(student_id, class_id);

drop policy if exists "student_assessments_select_owner_or_staff"
on public.student_skill_self_assessments;

drop policy if exists "student_assessments_upsert_owner"
on public.student_skill_self_assessments;

drop policy if exists "student_assessments_select_class_scoped"
on public.student_skill_self_assessments;

create policy "student_assessments_select_class_scoped"
on public.student_skill_self_assessments
for select
to authenticated
using (
  (
    student_id = auth.uid()
    and public.is_class_student(class_id)
  )
  or public.is_class_staff(class_id)
);

drop policy if exists "student_assessments_insert_own_class"
on public.student_skill_self_assessments;

create policy "student_assessments_insert_own_class"
on public.student_skill_self_assessments
for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.is_class_student(class_id)
);

drop policy if exists "student_assessments_update_own_class"
on public.student_skill_self_assessments;

create policy "student_assessments_update_own_class"
on public.student_skill_self_assessments
for update
to authenticated
using (
  student_id = auth.uid()
  and public.is_class_student(class_id)
)
with check (
  student_id = auth.uid()
  and public.is_class_student(class_id)
);

drop policy if exists "student_assessments_delete_own_class"
on public.student_skill_self_assessments;

create policy "student_assessments_delete_own_class"
on public.student_skill_self_assessments
for delete
to authenticated
using (
  student_id = auth.uid()
  and public.is_class_student(class_id)
);
