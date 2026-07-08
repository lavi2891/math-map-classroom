-- =========================================================
-- Student management RPCs + service_role grants
-- Run in Supabase SQL Editor
-- =========================================================

create or replace function public.create_managed_student_record(
  target_class_id uuid,
  target_student_id uuid,
  target_username text,
  target_display_name text,
  target_created_by uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> target_created_by then
    raise exception 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.class_memberships manager_membership
    where manager_membership.class_id = target_class_id
      and manager_membership.user_id = auth.uid()
      and manager_membership.role in ('owner', 'teacher')
      and manager_membership.active = true
  ) then
    raise exception 'not_allowed';
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    must_change_password,
    password_changed_at,
    created_by,
    updated_at
  )
  values (
    target_student_id,
    target_username,
    nullif(target_display_name, ''),
    true,
    null,
    target_created_by,
    now()
  )
  on conflict (id) do update
  set
    username = excluded.username,
    display_name = excluded.display_name,
    must_change_password = true,
    password_changed_at = null,
    created_by = coalesce(public.profiles.created_by, excluded.created_by),
    updated_at = now();

  insert into public.class_memberships (
    class_id,
    user_id,
    role,
    student_code,
    active
  )
  values (
    target_class_id,
    target_student_id,
    'student',
    null,
    true
  )
  on conflict (class_id, user_id) do update
  set
    role = 'student',
    student_code = null,
    active = true,
    updated_at = now();

  begin
    insert into public.student_password_events (
      student_id,
      class_id,
      action,
      created_by
    )
    values (
      target_student_id,
      target_class_id,
      'created',
      target_created_by
    );
  exception
    when undefined_table then
      null;
  end;

  return true;
end;
$$;

-- Drop both possible signatures to avoid old-schema conflicts.
drop function if exists public.set_student_password_requirement_for_class(uuid, uuid, boolean, text);
drop function if exists public.set_student_password_requirement_for_class(text, uuid, boolean, uuid);

create or replace function public.set_student_password_requirement_for_class(
  target_class_id uuid,
  target_student_id uuid,
  target_must_change_password boolean,
  target_action text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.class_memberships manager_membership
    where manager_membership.class_id = target_class_id
      and manager_membership.user_id = auth.uid()
      and manager_membership.role in ('owner', 'teacher')
      and manager_membership.active = true
  ) then
    raise exception 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.class_memberships student_membership
    where student_membership.class_id = target_class_id
      and student_membership.user_id = target_student_id
      and student_membership.role = 'student'
      and student_membership.active = true
  ) then
    raise exception 'student_not_in_class';
  end if;

  update public.profiles
  set
    must_change_password = target_must_change_password,
    password_changed_at = case
      when target_must_change_password then null
      else now()
    end,
    updated_at = now()
  where id = target_student_id;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if target_action is not null then
    begin
      insert into public.student_password_events (
        student_id,
        class_id,
        action,
        created_by
      )
      values (
        target_student_id,
        target_class_id,
        target_action,
        auth.uid()
      );
    exception
      when undefined_table then
        null;
    end;
  end if;

  return true;
end;
$$;

revoke all on function public.create_managed_student_record(uuid, uuid, text, text, uuid)
from public;

revoke all on function public.set_student_password_requirement_for_class(uuid, uuid, boolean, text)
from public;

grant execute on function public.create_managed_student_record(uuid, uuid, text, text, uuid)
to authenticated;

grant execute on function public.set_student_password_requirement_for_class(uuid, uuid, boolean, text)
to authenticated;

grant usage on schema public to service_role;

grant select, insert, update on table public.profiles to service_role;
grant select, insert, update on table public.class_memberships to service_role;
grant insert on table public.student_password_events to service_role;

notify pgrst, 'reload schema';
