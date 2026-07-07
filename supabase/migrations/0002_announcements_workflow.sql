-- Announcement workflow migration.
-- This migration extends announcements with categories, visibility controls,
-- attached links, and student read confirmations.

-- =========================================================
-- ENUMS
-- =========================================================

do $$ begin
  create type public.announcement_category as enum (
    'general',
    'exam',
    'reminder',
    'material'
  );
exception when duplicate_object then null;
end $$;

-- =========================================================
-- ANNOUNCEMENTS
-- =========================================================

alter table public.announcements
  add column if not exists category public.announcement_category not null default 'general',
  add column if not exists is_hidden boolean not null default false,
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists deleted_at timestamptz,
  add column if not exists require_read_confirmation boolean not null default false;

update public.announcements
set updated_by = created_by
where updated_by is null;

create index if not exists idx_announcements_category
on public.announcements(category);

create index if not exists idx_announcements_deleted_at
on public.announcements(deleted_at);

create index if not exists idx_announcements_visibility
on public.announcements(class_id, is_hidden, visible_from, visible_until)
where deleted_at is null;

-- =========================================================
-- ANNOUNCEMENT LINKS
-- =========================================================

create table if not exists public.announcement_links (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  title text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcement_links_announcement_id
on public.announcement_links(announcement_id);

-- =========================================================
-- ANNOUNCEMENT READS
-- =========================================================

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create index if not exists idx_announcement_reads_user_id
on public.announcement_reads(user_id);

-- =========================================================
-- RLS
-- =========================================================

alter table public.announcement_links enable row level security;
alter table public.announcement_reads enable row level security;

drop policy if exists "announcements_select_class_members" on public.announcements;
drop policy if exists "announcements_manage_class_content" on public.announcements;

create policy "announcements_select_staff_or_visible_students"
on public.announcements
for select
to authenticated
using (
  public.is_class_staff(class_id)
  or (
    public.is_class_student(class_id)
    and deleted_at is null
    and is_hidden = false
    and visible_from <= now()
    and (visible_until is null or visible_until >= now())
  )
);

create policy "announcements_insert_class_managers"
on public.announcements
for insert
to authenticated
with check (
  public.can_manage_class_content(class_id)
  and created_by = auth.uid()
  and (updated_by is null or updated_by = auth.uid())
);

create policy "announcements_update_class_managers"
on public.announcements
for update
to authenticated
using (public.can_manage_class_content(class_id))
with check (
  public.can_manage_class_content(class_id)
  and (updated_by is null or updated_by = auth.uid())
);

create policy "announcements_delete_class_managers"
on public.announcements
for delete
to authenticated
using (public.can_manage_class_content(class_id));

drop policy if exists "announcement_links_select_parent_readable" on public.announcement_links;
drop policy if exists "announcement_links_insert_parent_manager" on public.announcement_links;
drop policy if exists "announcement_links_update_parent_manager" on public.announcement_links;
drop policy if exists "announcement_links_delete_parent_manager" on public.announcement_links;

create policy "announcement_links_select_parent_readable"
on public.announcement_links
for select
to authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_links.announcement_id
      and (
        public.is_class_staff(a.class_id)
        or (
          public.is_class_student(a.class_id)
          and a.deleted_at is null
          and a.is_hidden = false
          and a.visible_from <= now()
          and (a.visible_until is null or a.visible_until >= now())
        )
      )
  )
);

create policy "announcement_links_insert_parent_manager"
on public.announcement_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_links.announcement_id
      and public.can_manage_class_content(a.class_id)
  )
);

create policy "announcement_links_update_parent_manager"
on public.announcement_links
for update
to authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_links.announcement_id
      and public.can_manage_class_content(a.class_id)
  )
)
with check (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_links.announcement_id
      and public.can_manage_class_content(a.class_id)
  )
);

create policy "announcement_links_delete_parent_manager"
on public.announcement_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_links.announcement_id
      and public.can_manage_class_content(a.class_id)
  )
);

drop policy if exists "announcement_reads_select_own_or_staff" on public.announcement_reads;
drop policy if exists "announcement_reads_insert_student_self" on public.announcement_reads;
drop policy if exists "announcement_reads_update_student_self" on public.announcement_reads;

create policy "announcement_reads_select_own_or_staff"
on public.announcement_reads
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.announcements a
    where a.id = announcement_reads.announcement_id
      and public.is_class_staff(a.class_id)
  )
);

create policy "announcement_reads_insert_student_self"
on public.announcement_reads
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.announcements a
    where a.id = announcement_reads.announcement_id
      and a.require_read_confirmation = true
      and a.deleted_at is null
      and a.is_hidden = false
      and a.visible_from <= now()
      and (a.visible_until is null or a.visible_until >= now())
      and public.is_class_student(a.class_id)
  )
);

create policy "announcement_reads_update_student_self"
on public.announcement_reads
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.announcements a
    where a.id = announcement_reads.announcement_id
      and a.require_read_confirmation = true
      and a.deleted_at is null
      and a.is_hidden = false
      and a.visible_from <= now()
      and (a.visible_until is null or a.visible_until >= now())
      and public.is_class_student(a.class_id)
  )
);
