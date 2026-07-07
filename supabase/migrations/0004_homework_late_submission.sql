alter table public.homework_assignments
add column if not exists allow_late_submission boolean not null default true,
add column if not exists late_submission_until timestamptz null;
