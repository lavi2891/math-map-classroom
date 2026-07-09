-- =========================================================
-- 0008_class_management.sql
-- Class management fields: display name, school year, archive
-- =========================================================

alter table public.classes
add column if not exists display_name text;

alter table public.classes
add column if not exists school_year text;

alter table public.classes
add column if not exists active boolean not null default true;

alter table public.classes
add column if not exists archived_at timestamptz;

create index if not exists idx_classes_active
on public.classes(active);

create index if not exists idx_classes_school_year
on public.classes(school_year);

drop policy if exists "classes_select_members" on public.classes;

create policy "classes_select_members"
on public.classes
for select
to authenticated
using (
  public.is_class_staff(id)
  or (
    active = true
    and public.is_class_student(id)
  )
);

drop policy if exists "classes_update_owner" on public.classes;

create policy "classes_update_owner"
on public.classes
for update
to authenticated
using (public.is_class_owner(id))
with check (public.is_class_owner(id));
