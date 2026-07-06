-- Current Supabase schema reference.
-- This SQL was applied manually through Supabase SQL Editor.
-- It is kept in the repo as the source of truth for development.
-- Future schema changes should be added as separate migration files.

-- =========================================================
-- Math Map Classroom - Initial Supabase Schema v0.1
-- =========================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

do $$ begin
  create type public.user_role as enum ('teacher', 'student');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.homework_status as enum ('not_started', 'started', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.understanding_level as enum ('good', 'partial', 'no', 'unknown');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.skill_source_level as enum ('elementary', 'grade7', 'advanced', 'too_advanced', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.practice_source as enum ('atomic_math', 'internal', 'google_form', 'external');
exception when duplicate_object then null;
end $$;

-- =========================================================
-- UPDATED_AT HELPER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- PROFILES
-- One row per auth.users user.
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  display_name text,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- =========================================================
-- CLASSES
-- =========================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- למשל: ז1
  grade int not null,              -- למשל: 7
  class_code text not null unique, -- למשל: Z7A
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create index if not exists idx_classes_teacher_id on public.classes(teacher_id);
create index if not exists idx_classes_class_code on public.classes(class_code);

-- =========================================================
-- CLASS STUDENTS
-- Many-to-many, but practically one teacher's classes.
-- =========================================================

create table if not exists public.class_students (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_code text, -- למשל: 014
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index if not exists idx_class_students_student_id on public.class_students(student_id);
create index if not exists idx_class_students_class_id on public.class_students(class_id);

-- =========================================================
-- ANNOUNCEMENTS
-- הודעות כיתתיות
-- =========================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  body text not null,
  visible_from timestamptz not null default now(),
  visible_until timestamptz,
  is_pinned boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create index if not exists idx_announcements_class_id on public.announcements(class_id);
create index if not exists idx_announcements_visible_from on public.announcements(visible_from);

-- =========================================================
-- HOMEWORK ASSIGNMENTS
-- שיעורי בית
-- =========================================================

create table if not exists public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text not null,
  visible_from timestamptz not null default now(),
  due_at timestamptz,
  require_status boolean not null default true,
  require_understanding boolean not null default true,
  require_photo boolean not null default true,
  allow_external_url boolean not null default false,
  external_url text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_homework_assignments_updated_at on public.homework_assignments;
create trigger trg_homework_assignments_updated_at
before update on public.homework_assignments
for each row execute function public.set_updated_at();

create index if not exists idx_homework_assignments_class_id on public.homework_assignments(class_id);
create index if not exists idx_homework_assignments_due_at on public.homework_assignments(due_at);

-- =========================================================
-- HOMEWORK SUBMISSIONS
-- הגשות תלמידים
-- =========================================================

create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework_assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.homework_status not null default 'not_started',
  understanding public.understanding_level not null default 'unknown',
  note text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (homework_id, student_id)
);

drop trigger if exists trg_homework_submissions_updated_at on public.homework_submissions;
create trigger trg_homework_submissions_updated_at
before update on public.homework_submissions
for each row execute function public.set_updated_at();

create index if not exists idx_homework_submissions_homework_id on public.homework_submissions(homework_id);
create index if not exists idx_homework_submissions_student_id on public.homework_submissions(student_id);

-- =========================================================
-- HOMEWORK FILES
-- Metadata for uploaded notebook photos.
-- Actual files live in Supabase Storage.
-- =========================================================

create table if not exists public.homework_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.homework_submissions(id) on delete cascade,
  file_path text not null unique,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_homework_files_submission_id on public.homework_files(submission_id);

-- =========================================================
-- KNOWLEDGE DOMAINS
-- תחומים: מספרי, אלגברי, גאומטרי וכו'
-- =========================================================

create table if not exists public.knowledge_domains (
  id uuid primary key default gen_random_uuid(),
  grade int not null,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (grade, title)
);

create index if not exists idx_knowledge_domains_grade on public.knowledge_domains(grade);

-- =========================================================
-- KNOWLEDGE SKILLS
-- מיקרו-נושאים / מיומנויות
-- =========================================================

create table if not exists public.knowledge_skills (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.knowledge_domains(id) on delete cascade,
  parent_skill_id uuid references public.knowledge_skills(id) on delete set null,
  title text not null,
  description text,
  source_level public.skill_source_level not null default 'grade7',
  required_knowledge text,
  diagnostic_question text,
  external_practice_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_skills_domain_id on public.knowledge_skills(domain_id);
create index if not exists idx_knowledge_skills_parent_skill_id on public.knowledge_skills(parent_skill_id);

-- =========================================================
-- CLASS SKILL PROGRESS
-- מה כבר נלמד בכיתה
-- =========================================================

create table if not exists public.class_skill_progress (
  class_id uuid not null references public.classes(id) on delete cascade,
  skill_id uuid not null references public.knowledge_skills(id) on delete cascade,
  is_taught boolean not null default false,
  taught_at timestamptz,
  teacher_note text,
  updated_at timestamptz not null default now(),
  primary key (class_id, skill_id)
);

drop trigger if exists trg_class_skill_progress_updated_at on public.class_skill_progress;
create trigger trg_class_skill_progress_updated_at
before update on public.class_skill_progress
for each row execute function public.set_updated_at();

create index if not exists idx_class_skill_progress_skill_id on public.class_skill_progress(skill_id);

-- =========================================================
-- STUDENT SKILL SELF ASSESSMENTS
-- דיווח עצמי של תלמיד על מיקרו-נושא
-- =========================================================

create table if not exists public.student_skill_self_assessments (
  student_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.knowledge_skills(id) on delete cascade,
  level public.understanding_level not null default 'unknown',
  note text,
  updated_at timestamptz not null default now(),
  primary key (student_id, skill_id)
);

drop trigger if exists trg_student_skill_self_assessments_updated_at on public.student_skill_self_assessments;
create trigger trg_student_skill_self_assessments_updated_at
before update on public.student_skill_self_assessments
for each row execute function public.set_updated_at();

create index if not exists idx_student_skill_self_assessments_skill_id
on public.student_skill_self_assessments(skill_id);

-- =========================================================
-- HOMEWORK ↔ SKILLS
-- שיעורי בית קשורים למיומנויות
-- =========================================================

create table if not exists public.homework_skills (
  homework_id uuid not null references public.homework_assignments(id) on delete cascade,
  skill_id uuid not null references public.knowledge_skills(id) on delete cascade,
  primary key (homework_id, skill_id)
);

create index if not exists idx_homework_skills_skill_id on public.homework_skills(skill_id);

-- =========================================================
-- PRACTICE SESSIONS
-- בהמשך: Atomic Math / Google Forms / תרגול פנימי
-- =========================================================

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid references public.knowledge_skills(id) on delete set null,
  source public.practice_source not null default 'external',
  external_session_id text,
  questions_count int,
  correct_count int,
  score_percent numeric,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_practice_sessions_student_id on public.practice_sessions(student_id);
create index if not exists idx_practice_sessions_skill_id on public.practice_sessions(skill_id);

-- =========================================================
-- HELPER FUNCTIONS FOR RLS
-- =========================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'teacher'
  )
$$;

create or replace function public.is_student()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'student'
  )
$$;

create or replace function public.is_teacher_of_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = target_class_id
    and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.is_student_in_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_students cs
    where cs.class_id = target_class_id
    and cs.student_id = auth.uid()
    and cs.active = true
  )
$$;

create or replace function public.is_student_of_homework(target_homework_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_assignments h
    join public.class_students cs on cs.class_id = h.class_id
    where h.id = target_homework_id
    and cs.student_id = auth.uid()
    and cs.active = true
  )
$$;

create or replace function public.is_teacher_of_homework(target_homework_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_assignments h
    join public.classes c on c.id = h.class_id
    where h.id = target_homework_id
    and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.is_owner_of_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.homework_submissions s
    where s.id = target_submission_id
    and s.student_id = auth.uid()
  )
$$;

create or replace function public.is_teacher_of_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_submissions s
    join public.homework_assignments h on h.id = s.homework_id
    join public.classes c on c.id = h.class_id
    where s.id = target_submission_id
    and c.teacher_id = auth.uid()
  )
$$;

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.announcements enable row level security;
alter table public.homework_assignments enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.homework_files enable row level security;
alter table public.knowledge_domains enable row level security;
alter table public.knowledge_skills enable row level security;
alter table public.class_skill_progress enable row level security;
alter table public.student_skill_self_assessments enable row level security;
alter table public.homework_skills enable row level security;
alter table public.practice_sessions enable row level security;

-- =========================================================
-- RLS POLICIES
-- Drop existing first, so script can be rerun.
-- =========================================================

-- PROFILES
drop policy if exists "profiles_select_own_or_teacher_related" on public.profiles;
create policy "profiles_select_own_or_teacher_related"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_teacher()
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- CLASSES
drop policy if exists "classes_select_teacher_or_student" on public.classes;
create policy "classes_select_teacher_or_student"
on public.classes
for select
to authenticated
using (
  teacher_id = auth.uid()
  or public.is_student_in_class(id)
);

drop policy if exists "classes_insert_teacher" on public.classes;
create policy "classes_insert_teacher"
on public.classes
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.is_teacher()
);

drop policy if exists "classes_update_teacher" on public.classes;
create policy "classes_update_teacher"
on public.classes
for update
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

-- CLASS STUDENTS
drop policy if exists "class_students_select_related" on public.class_students;
create policy "class_students_select_related"
on public.class_students
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_teacher_of_class(class_id)
);

drop policy if exists "class_students_manage_teacher" on public.class_students;
create policy "class_students_manage_teacher"
on public.class_students
for all
to authenticated
using (public.is_teacher_of_class(class_id))
with check (public.is_teacher_of_class(class_id));

-- ANNOUNCEMENTS
drop policy if exists "announcements_select_class_members" on public.announcements;
create policy "announcements_select_class_members"
on public.announcements
for select
to authenticated
using (
  public.is_teacher_of_class(class_id)
  or public.is_student_in_class(class_id)
);

drop policy if exists "announcements_manage_teacher" on public.announcements;
create policy "announcements_manage_teacher"
on public.announcements
for all
to authenticated
using (public.is_teacher_of_class(class_id))
with check (
  public.is_teacher_of_class(class_id)
  and created_by = auth.uid()
);

-- HOMEWORK ASSIGNMENTS
drop policy if exists "homework_assignments_select_class_members" on public.homework_assignments;
create policy "homework_assignments_select_class_members"
on public.homework_assignments
for select
to authenticated
using (
  public.is_teacher_of_class(class_id)
  or public.is_student_in_class(class_id)
);

drop policy if exists "homework_assignments_manage_teacher" on public.homework_assignments;
create policy "homework_assignments_manage_teacher"
on public.homework_assignments
for all
to authenticated
using (public.is_teacher_of_class(class_id))
with check (
  public.is_teacher_of_class(class_id)
  and created_by = auth.uid()
);

-- HOMEWORK SUBMISSIONS
drop policy if exists "homework_submissions_select_owner_or_teacher" on public.homework_submissions;
create policy "homework_submissions_select_owner_or_teacher"
on public.homework_submissions
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_teacher_of_homework(homework_id)
);

drop policy if exists "homework_submissions_insert_student" on public.homework_submissions;
create policy "homework_submissions_insert_student"
on public.homework_submissions
for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.is_student_of_homework(homework_id)
);

drop policy if exists "homework_submissions_update_student_owner" on public.homework_submissions;
create policy "homework_submissions_update_student_owner"
on public.homework_submissions
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- HOMEWORK FILES
drop policy if exists "homework_files_select_owner_or_teacher" on public.homework_files;
create policy "homework_files_select_owner_or_teacher"
on public.homework_files
for select
to authenticated
using (
  public.is_owner_of_submission(submission_id)
  or public.is_teacher_of_submission(submission_id)
);

drop policy if exists "homework_files_insert_owner" on public.homework_files;
create policy "homework_files_insert_owner"
on public.homework_files
for insert
to authenticated
with check (
  public.is_owner_of_submission(submission_id)
);

-- KNOWLEDGE DOMAINS
drop policy if exists "knowledge_domains_select_authenticated" on public.knowledge_domains;
create policy "knowledge_domains_select_authenticated"
on public.knowledge_domains
for select
to authenticated
using (true);

drop policy if exists "knowledge_domains_manage_teacher" on public.knowledge_domains;
create policy "knowledge_domains_manage_teacher"
on public.knowledge_domains
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

-- KNOWLEDGE SKILLS
drop policy if exists "knowledge_skills_select_authenticated" on public.knowledge_skills;
create policy "knowledge_skills_select_authenticated"
on public.knowledge_skills
for select
to authenticated
using (true);

drop policy if exists "knowledge_skills_manage_teacher" on public.knowledge_skills;
create policy "knowledge_skills_manage_teacher"
on public.knowledge_skills
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

-- CLASS SKILL PROGRESS
drop policy if exists "class_skill_progress_select_class_members" on public.class_skill_progress;
create policy "class_skill_progress_select_class_members"
on public.class_skill_progress
for select
to authenticated
using (
  public.is_teacher_of_class(class_id)
  or public.is_student_in_class(class_id)
);

drop policy if exists "class_skill_progress_manage_teacher" on public.class_skill_progress;
create policy "class_skill_progress_manage_teacher"
on public.class_skill_progress
for all
to authenticated
using (public.is_teacher_of_class(class_id))
with check (public.is_teacher_of_class(class_id));

-- STUDENT SELF ASSESSMENTS
drop policy if exists "student_assessments_select_owner_or_teacher" on public.student_skill_self_assessments;
create policy "student_assessments_select_owner_or_teacher"
on public.student_skill_self_assessments
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_teacher()
);

drop policy if exists "student_assessments_upsert_owner" on public.student_skill_self_assessments;
create policy "student_assessments_upsert_owner"
on public.student_skill_self_assessments
for all
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- HOMEWORK SKILLS
drop policy if exists "homework_skills_select_class_members" on public.homework_skills;
create policy "homework_skills_select_class_members"
on public.homework_skills
for select
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments h
    where h.id = homework_id
    and (
      public.is_teacher_of_class(h.class_id)
      or public.is_student_in_class(h.class_id)
    )
  )
);

drop policy if exists "homework_skills_manage_teacher" on public.homework_skills;
create policy "homework_skills_manage_teacher"
on public.homework_skills
for all
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments h
    where h.id = homework_id
    and public.is_teacher_of_class(h.class_id)
  )
)
with check (
  exists (
    select 1
    from public.homework_assignments h
    where h.id = homework_id
    and public.is_teacher_of_class(h.class_id)
  )
);

-- PRACTICE SESSIONS
drop policy if exists "practice_sessions_select_owner_or_teacher" on public.practice_sessions;
create policy "practice_sessions_select_owner_or_teacher"
on public.practice_sessions
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_teacher()
);

drop policy if exists "practice_sessions_insert_owner" on public.practice_sessions;
create policy "practice_sessions_insert_owner"
on public.practice_sessions
for insert
to authenticated
with check (student_id = auth.uid());

-- =========================================================
-- STORAGE BUCKET
-- Private bucket for notebook photos.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('homework-submissions', 'homework-submissions', false)
on conflict (id) do nothing;

-- Storage RLS
-- Path convention:
-- {student_id}/{homework_id}/{filename}
--
-- Example:
-- 8c5...uuid/homework-uuid/photo-1.jpg

drop policy if exists "storage_homework_insert_own_folder" on storage.objects;
create policy "storage_homework_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'homework-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_homework_select_own_or_teacher" on storage.objects;
create policy "storage_homework_select_own_or_teacher"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'homework-submissions'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.homework_files f
      join public.homework_submissions s on s.id = f.submission_id
      join public.homework_assignments h on h.id = s.homework_id
      join public.classes c on c.id = h.class_id
      where f.file_path = storage.objects.name
      and c.teacher_id = auth.uid()
    )
  )
);

drop policy if exists "storage_homework_delete_own_folder" on storage.objects;
create policy "storage_homework_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'homework-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================================
-- Math Map Classroom - Migration to contextual class roles
-- From:
--   profiles.role
--   classes.teacher_id
--   class_students
-- To:
--   class_memberships(role)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Drop old RLS policies that depend on profiles.role,
--    classes.teacher_id, or class_students
-- ---------------------------------------------------------

drop policy if exists "profiles_select_own_or_teacher_related" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "classes_select_teacher_or_student" on public.classes;
drop policy if exists "classes_insert_teacher" on public.classes;
drop policy if exists "classes_update_teacher" on public.classes;

drop policy if exists "class_students_select_related" on public.class_students;
drop policy if exists "class_students_manage_teacher" on public.class_students;

drop policy if exists "announcements_select_class_members" on public.announcements;
drop policy if exists "announcements_manage_teacher" on public.announcements;

drop policy if exists "homework_assignments_select_class_members" on public.homework_assignments;
drop policy if exists "homework_assignments_manage_teacher" on public.homework_assignments;

drop policy if exists "homework_submissions_select_owner_or_teacher" on public.homework_submissions;
drop policy if exists "homework_submissions_insert_student" on public.homework_submissions;
drop policy if exists "homework_submissions_update_student_owner" on public.homework_submissions;

drop policy if exists "homework_files_select_owner_or_teacher" on public.homework_files;
drop policy if exists "homework_files_insert_owner" on public.homework_files;

drop policy if exists "knowledge_domains_select_authenticated" on public.knowledge_domains;
drop policy if exists "knowledge_domains_manage_teacher" on public.knowledge_domains;

drop policy if exists "knowledge_skills_select_authenticated" on public.knowledge_skills;
drop policy if exists "knowledge_skills_manage_teacher" on public.knowledge_skills;

drop policy if exists "class_skill_progress_select_class_members" on public.class_skill_progress;
drop policy if exists "class_skill_progress_manage_teacher" on public.class_skill_progress;

drop policy if exists "student_assessments_select_owner_or_teacher" on public.student_skill_self_assessments;
drop policy if exists "student_assessments_upsert_owner" on public.student_skill_self_assessments;

drop policy if exists "homework_skills_select_class_members" on public.homework_skills;
drop policy if exists "homework_skills_manage_teacher" on public.homework_skills;

drop policy if exists "practice_sessions_select_owner_or_teacher" on public.practice_sessions;
drop policy if exists "practice_sessions_insert_owner" on public.practice_sessions;

drop policy if exists "storage_homework_insert_own_folder" on storage.objects;
drop policy if exists "storage_homework_select_own_or_teacher" on storage.objects;
drop policy if exists "storage_homework_delete_own_folder" on storage.objects;

-- ---------------------------------------------------------
-- 2. Drop old helper functions
-- ---------------------------------------------------------

drop function if exists public.current_user_role();
drop function if exists public.is_teacher();
drop function if exists public.is_student();
drop function if exists public.is_teacher_of_class(uuid);
drop function if exists public.is_student_in_class(uuid);
drop function if exists public.is_student_of_homework(uuid);
drop function if exists public.is_teacher_of_homework(uuid);
drop function if exists public.is_owner_of_submission(uuid);
drop function if exists public.is_teacher_of_submission(uuid);

-- ---------------------------------------------------------
-- 3. New enum: contextual role inside a class
-- ---------------------------------------------------------

do $$ begin
  create type public.class_role as enum ('owner', 'teacher', 'viewer', 'student');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------
-- 4. Create class_memberships
-- ---------------------------------------------------------

create table if not exists public.class_memberships (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.class_role not null,
  student_code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

drop trigger if exists trg_class_memberships_updated_at on public.class_memberships;
create trigger trg_class_memberships_updated_at
before update on public.class_memberships
for each row execute function public.set_updated_at();

create index if not exists idx_class_memberships_user_id
on public.class_memberships(user_id);

create index if not exists idx_class_memberships_class_id
on public.class_memberships(class_id);

create index if not exists idx_class_memberships_role
on public.class_memberships(role);

-- ---------------------------------------------------------
-- 5. Migrate existing class teachers into class_memberships
--    From classes.teacher_id -> role owner
-- ---------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'classes'
      and column_name = 'teacher_id'
  ) then
    execute '
      insert into public.class_memberships (class_id, user_id, role, active)
      select id, teacher_id, ''owner''::public.class_role, true
      from public.classes
      where teacher_id is not null
      on conflict (class_id, user_id) do update
      set role = excluded.role,
          active = true,
          updated_at = now()
    ';
  end if;
end $$;

-- ---------------------------------------------------------
-- 6. Migrate existing class_students into class_memberships
--    From class_students -> role student
-- ---------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'class_students'
  ) then
    execute '
      insert into public.class_memberships
        (class_id, user_id, role, student_code, active, created_at)
      select
        class_id,
        student_id,
        ''student''::public.class_role,
        student_code,
        active,
        created_at
      from public.class_students
      on conflict (class_id, user_id) do update
      set role = excluded.role,
          student_code = excluded.student_code,
          active = excluded.active,
          updated_at = now()
    ';
  end if;
end $$;

-- ---------------------------------------------------------
-- 7. Remove old columns/tables
-- ---------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'classes'
      and column_name = 'teacher_id'
  ) then
    alter table public.classes drop column teacher_id;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles drop column role;
  end if;
end $$;

drop table if exists public.class_students;

-- ---------------------------------------------------------
-- 8. Enable RLS on new memberships table
-- ---------------------------------------------------------

alter table public.class_memberships enable row level security;

-- ---------------------------------------------------------
-- 9. New helper functions
-- ---------------------------------------------------------

create or replace function public.is_class_member(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
      and cm.active = true
  )
$$;

create or replace function public.is_class_student(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
      and cm.role = 'student'
      and cm.active = true
  )
$$;

create or replace function public.is_class_staff(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'teacher', 'viewer')
      and cm.active = true
  )
$$;

create or replace function public.can_manage_class_content(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'teacher')
      and cm.active = true
  )
$$;

create or replace function public.is_class_owner(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
      and cm.role = 'owner'
      and cm.active = true
  )
$$;

create or replace function public.is_any_class_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.user_id = auth.uid()
      and cm.role in ('owner', 'teacher', 'viewer')
      and cm.active = true
  )
$$;

create or replace function public.is_staff_of_user(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships staff
    join public.class_memberships target
      on target.class_id = staff.class_id
    where staff.user_id = auth.uid()
      and staff.role in ('owner', 'teacher', 'viewer')
      and staff.active = true
      and target.user_id = target_user_id
      and target.active = true
  )
$$;

create or replace function public.is_student_of_homework(target_homework_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_assignments h
    join public.class_memberships cm
      on cm.class_id = h.class_id
    where h.id = target_homework_id
      and cm.user_id = auth.uid()
      and cm.role = 'student'
      and cm.active = true
  )
$$;

create or replace function public.is_staff_of_homework(target_homework_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_assignments h
    join public.class_memberships cm
      on cm.class_id = h.class_id
    where h.id = target_homework_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'teacher', 'viewer')
      and cm.active = true
  )
$$;

create or replace function public.can_manage_homework(target_homework_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_assignments h
    join public.class_memberships cm
      on cm.class_id = h.class_id
    where h.id = target_homework_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'teacher')
      and cm.active = true
  )
$$;

create or replace function public.is_owner_of_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_submissions s
    where s.id = target_submission_id
      and s.student_id = auth.uid()
  )
$$;

create or replace function public.is_staff_of_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.homework_submissions s
    join public.homework_assignments h
      on h.id = s.homework_id
    join public.class_memberships cm
      on cm.class_id = h.class_id
    where s.id = target_submission_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'teacher', 'viewer')
      and cm.active = true
  )
$$;

-- ---------------------------------------------------------
-- 10. New RLS policies
-- ---------------------------------------------------------

-- PROFILES
create policy "profiles_select_own_or_shared_class_staff"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_staff_of_user(id)
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- CLASSES
create policy "classes_select_members"
on public.classes
for select
to authenticated
using (public.is_class_member(id));

create policy "classes_insert_authenticated"
on public.classes
for insert
to authenticated
with check (true);

create policy "classes_update_owner"
on public.classes
for update
to authenticated
using (public.is_class_owner(id))
with check (public.is_class_owner(id));

create policy "classes_delete_owner"
on public.classes
for delete
to authenticated
using (public.is_class_owner(id));

-- CLASS MEMBERSHIPS
create policy "class_memberships_select_related"
on public.class_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_class_staff(class_id)
);

create policy "class_memberships_insert_first_owner_or_owner_manage"
on public.class_memberships
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1
      from public.class_memberships existing
      where existing.class_id = class_memberships.class_id
    )
  )
  or public.is_class_owner(class_id)
);

create policy "class_memberships_update_owner"
on public.class_memberships
for update
to authenticated
using (public.is_class_owner(class_id))
with check (public.is_class_owner(class_id));

create policy "class_memberships_delete_owner"
on public.class_memberships
for delete
to authenticated
using (public.is_class_owner(class_id));

-- ANNOUNCEMENTS
create policy "announcements_select_class_members"
on public.announcements
for select
to authenticated
using (public.is_class_member(class_id));

create policy "announcements_manage_class_content"
on public.announcements
for all
to authenticated
using (public.can_manage_class_content(class_id))
with check (
  public.can_manage_class_content(class_id)
  and created_by = auth.uid()
);

-- HOMEWORK ASSIGNMENTS
create policy "homework_assignments_select_class_members"
on public.homework_assignments
for select
to authenticated
using (public.is_class_member(class_id));

create policy "homework_assignments_manage_class_content"
on public.homework_assignments
for all
to authenticated
using (public.can_manage_class_content(class_id))
with check (
  public.can_manage_class_content(class_id)
  and created_by = auth.uid()
);

-- HOMEWORK SUBMISSIONS
create policy "homework_submissions_select_owner_or_staff"
on public.homework_submissions
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_staff_of_homework(homework_id)
);

create policy "homework_submissions_insert_student"
on public.homework_submissions
for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.is_student_of_homework(homework_id)
);

create policy "homework_submissions_update_student_owner"
on public.homework_submissions
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- HOMEWORK FILES
create policy "homework_files_select_owner_or_staff"
on public.homework_files
for select
to authenticated
using (
  public.is_owner_of_submission(submission_id)
  or public.is_staff_of_submission(submission_id)
);

create policy "homework_files_insert_owner"
on public.homework_files
for insert
to authenticated
with check (public.is_owner_of_submission(submission_id));

-- KNOWLEDGE DOMAINS
create policy "knowledge_domains_select_authenticated"
on public.knowledge_domains
for select
to authenticated
using (true);

create policy "knowledge_domains_manage_any_staff"
on public.knowledge_domains
for all
to authenticated
using (public.is_any_class_staff())
with check (public.is_any_class_staff());

-- KNOWLEDGE SKILLS
create policy "knowledge_skills_select_authenticated"
on public.knowledge_skills
for select
to authenticated
using (true);

create policy "knowledge_skills_manage_any_staff"
on public.knowledge_skills
for all
to authenticated
using (public.is_any_class_staff())
with check (public.is_any_class_staff());

-- CLASS SKILL PROGRESS
create policy "class_skill_progress_select_class_members"
on public.class_skill_progress
for select
to authenticated
using (public.is_class_member(class_id));

create policy "class_skill_progress_manage_class_content"
on public.class_skill_progress
for all
to authenticated
using (public.can_manage_class_content(class_id))
with check (public.can_manage_class_content(class_id));

-- STUDENT SELF ASSESSMENTS
create policy "student_assessments_select_owner_or_staff"
on public.student_skill_self_assessments
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_staff_of_user(student_id)
);

create policy "student_assessments_upsert_owner"
on public.student_skill_self_assessments
for all
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- HOMEWORK SKILLS
create policy "homework_skills_select_class_members"
on public.homework_skills
for select
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments h
    where h.id = homework_id
      and public.is_class_member(h.class_id)
  )
);

create policy "homework_skills_manage_class_content"
on public.homework_skills
for all
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments h
    where h.id = homework_id
      and public.can_manage_class_content(h.class_id)
  )
)
with check (
  exists (
    select 1
    from public.homework_assignments h
    where h.id = homework_id
      and public.can_manage_class_content(h.class_id)
  )
);

-- PRACTICE SESSIONS
create policy "practice_sessions_select_owner_or_staff"
on public.practice_sessions
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_staff_of_user(student_id)
);

create policy "practice_sessions_insert_owner"
on public.practice_sessions
for insert
to authenticated
with check (student_id = auth.uid());

-- ---------------------------------------------------------
-- 11. Storage policies for homework photos
-- Path convention:
--   {student_id}/{homework_id}/{filename}
-- ---------------------------------------------------------

create policy "storage_homework_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'homework-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_homework_select_own_or_staff"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'homework-submissions'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.homework_files f
      join public.homework_submissions s
        on s.id = f.submission_id
      where f.file_path = storage.objects.name
        and public.is_staff_of_submission(s.id)
    )
  )
);

create policy "storage_homework_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'homework-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------
-- 12. Optional cleanup: old enum user_role
-- It may fail if still used somewhere; safe to leave it.
-- ---------------------------------------------------------

do $$
begin
  drop type if exists public.user_role;
exception
  when dependent_objects_still_exist then null;
end $$;