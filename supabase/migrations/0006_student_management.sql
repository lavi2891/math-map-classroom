alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists password_changed_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists archived_at timestamptz;

create table if not exists public.student_password_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  action text not null check (action in ('created', 'reset', 'forced_change', 'changed')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_student_password_events_student_id
on public.student_password_events(student_id);

create index if not exists idx_student_password_events_class_id
on public.student_password_events(class_id);

alter table public.student_password_events enable row level security;

drop policy if exists "student_password_events_select_self_or_class_managers"
on public.student_password_events;
create policy "student_password_events_select_self_or_class_managers"
on public.student_password_events
for select
to authenticated
using (
  student_id = auth.uid()
  or (
    class_id is not null
    and public.can_manage_class_content(class_id)
  )
);

drop policy if exists "student_password_events_insert_self_or_class_managers"
on public.student_password_events;
create policy "student_password_events_insert_self_or_class_managers"
on public.student_password_events
for insert
to authenticated
with check (
  (
    student_id = auth.uid()
    and created_by = auth.uid()
    and action = 'changed'
  )
  or (
    class_id is not null
    and public.can_manage_class_content(class_id)
    and created_by = auth.uid()
  )
);

drop policy if exists "profiles_insert_created_by_self"
on public.profiles;
create policy "profiles_insert_created_by_self"
on public.profiles
for insert
to authenticated
with check (
  created_by = auth.uid()
);

drop policy if exists "profiles_update_password_flags_self_or_creator"
on public.profiles;
create policy "profiles_update_password_flags_self_or_creator"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or created_by = auth.uid()
)
with check (
  id = auth.uid()
  or created_by = auth.uid()
);

drop policy if exists "class_memberships_insert_first_owner_or_owner_manage"
on public.class_memberships;

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
  or (
    role = 'student'
    and public.can_manage_class_content(class_id)
  )
);

drop policy if exists "class_memberships_update_owner"
on public.class_memberships;

create policy "class_memberships_update_owner"
on public.class_memberships
for update
to authenticated
using (
  public.is_class_owner(class_id)
  or (
    role = 'student'
    and public.can_manage_class_content(class_id)
  )
)
with check (
  public.is_class_owner(class_id)
  or (
    role = 'student'
    and public.can_manage_class_content(class_id)
  )
);
