drop policy if exists "profiles_select_for_class_managers"
on public.profiles;

create policy "profiles_select_for_class_managers"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.class_memberships manager_membership
    where manager_membership.user_id = auth.uid()
      and manager_membership.active = true
      and manager_membership.role in ('owner', 'teacher')
  )
);

drop policy if exists "profiles_update_students_for_class_managers"
on public.profiles;

create policy "profiles_update_students_for_class_managers"
on public.profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.class_memberships student_membership
    join public.class_memberships manager_membership
      on manager_membership.class_id = student_membership.class_id
    where student_membership.user_id = profiles.id
      and student_membership.role = 'student'
      and student_membership.active = true
      and manager_membership.user_id = auth.uid()
      and manager_membership.active = true
      and manager_membership.role in ('owner', 'teacher')
  )
)
with check (
  exists (
    select 1
    from public.class_memberships student_membership
    join public.class_memberships manager_membership
      on manager_membership.class_id = student_membership.class_id
    where student_membership.user_id = profiles.id
      and student_membership.role = 'student'
      and student_membership.active = true
      and manager_membership.user_id = auth.uid()
      and manager_membership.active = true
      and manager_membership.role in ('owner', 'teacher')
  )
);
