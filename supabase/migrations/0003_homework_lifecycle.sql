-- Homework lifecycle controls.

alter table public.homework_assignments
  add column if not exists is_hidden boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_by uuid references public.profiles(id);

update public.homework_assignments
set updated_by = created_by
where updated_by is null;

create index if not exists idx_homework_assignments_deleted_at
on public.homework_assignments(deleted_at);

create index if not exists idx_homework_assignments_visibility
on public.homework_assignments(class_id, is_hidden, visible_from, due_at)
where deleted_at is null;

drop policy if exists "homework_assignments_select_class_members"
on public.homework_assignments;

drop policy if exists "homework_assignments_manage_class_content"
on public.homework_assignments;

create policy "homework_assignments_select_staff_or_visible_students"
on public.homework_assignments
for select
to authenticated
using (
  public.is_class_staff(class_id)
  or (
    public.is_class_student(class_id)
    and deleted_at is null
    and is_hidden = false
    and visible_from <= now()
  )
);

create policy "homework_assignments_insert_class_managers"
on public.homework_assignments
for insert
to authenticated
with check (
  public.can_manage_class_content(class_id)
  and created_by = auth.uid()
);

create policy "homework_assignments_update_class_managers"
on public.homework_assignments
for update
to authenticated
using (public.can_manage_class_content(class_id))
with check (public.can_manage_class_content(class_id));
