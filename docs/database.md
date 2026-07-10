# Database Schema

Source of truth:

- `supabase/migrations/0001_current_schema_reference.sql`
- `supabase/migrations/0002_announcements_workflow.sql`
- `supabase/migrations/0003_homework_lifecycle.sql`
- `supabase/migrations/0004_homework_file_delete_policy.sql`
- `supabase/migrations/0004_homework_late_submission.sql`
- `supabase/migrations/0005_student_password_onboarding.sql`
- `supabase/migrations/0006_student_management.sql`
- `supabase/migrations/0007_refine_student_management.sql`
- `supabase/migrations/0008_class_management.sql`
- `supabase/migrations/0009_knowledge_map_refinement.sql`

This document describes the current effective Supabase schema after all migrations listed above. Earlier definitions in `0001_current_schema_reference.sql` create the first version of the schema, then later sections and migrations replace the global/legacy class role model.

## Key Decision

Roles are contextual through `class_memberships`.

Use:

- `class_memberships.role`
- `class_memberships.class_id`
- `class_memberships.user_id`

Do not use:

- `profiles.role`
- `classes.teacher_id`
- `class_students`

The migration explicitly drops `profiles.role`, drops `classes.teacher_id`, and drops `class_students` after migrating their data into `class_memberships`.

## Effective Role Model

`class_memberships.role` uses enum `public.class_role`:

- `owner`
- `teacher`
- `viewer`
- `student`

A single user can have different roles in different classes. For example, the same profile could be a `teacher` in one class and a `viewer` in another.

## Core Tables

### `profiles`

One row per `auth.users` user.

Columns:

- `id uuid primary key references auth.users(id)`
- `display_name text` - optional display name. If missing, the UI falls back to the username.
- `username text unique`
- `must_change_password boolean default false`
- `password_changed_at timestamptz`
- `created_by uuid references profiles(id)`
- `archived_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Important: `profiles.username` is stable identity metadata for the user. Normal student auth emails are generated from the normalized username. `must_change_password` is used for temporary-password and first-login flows. Temporary passwords are never stored in the database. There is no effective `role` column; do not model authorization from `profiles.role`.

### `classes`

Class metadata.

Columns:

- `id uuid primary key`
- `name text`
- `display_name text` - optional student-facing display name. If missing, the app falls back to `name`.
- `grade int`
- `class_code text unique`
- `school_year text` - optional school year label.
- `active boolean default true` - inactive classes are archived.
- `archived_at timestamptz` - set when a class is moved to the archive.
- `created_at timestamptz`
- `updated_at timestamptz`

Important: there is no effective `teacher_id` column. Class ownership and staff access are represented in `class_memberships`.
Only class owners can update or archive/unarchive class records. Editable class-management fields include `name`, `display_name`, `grade`, `class_code`, and `school_year`. Archiving sets `active = false` and `archived_at = now()`; unarchiving sets `active = true` and clears `archived_at`. Archived classes are not hard deleted. Students see only active classes. Staff can still see archived classes for classes where they have staff membership.

### `class_memberships`

The central authorization and enrollment table.

Columns:

- `class_id uuid references classes(id)`
- `user_id uuid references profiles(id)`
- `role public.class_role`
- `student_code text` - optional legacy/internal per-class code. Normal login and teacher student-management UI do not require it.
- `active boolean` - `false` means the user was removed from the class without deleting the user, profile, submissions, files, practice sessions, or self-assessments.
- `created_at timestamptz`
- `updated_at timestamptz`

Primary key:

- `(class_id, user_id)`

Indexes:

- `user_id`
- `class_id`
- `role`

Use this table for all class-level access checks, staff views, student enrollment, current student class context, and ownership. Users can be attached to multiple classes through separate active `class_memberships` rows.

### `student_password_events`

Audit table for student password-management lifecycle events. It records that a password event happened, but never stores the plain temporary password.

Columns:

- `id uuid primary key`
- `student_id uuid references profiles(id)`
- `class_id uuid null references classes(id)`
- `action text` - one of `created`, `reset`, `forced_change`, or `changed`.
- `created_by uuid references profiles(id)`
- `created_at timestamptz`

Current app usage:

- Class owners can create student accounts in bulk or one at a time, reset temporary passwords, force password changes, and print temporary login cards.
- Student usernames created by the bulk flow use the selected class code prefix and per-class `student_code`, for example `z7a001`.
- Teachers with active staff membership can view active students in their classes.
- Attaching existing users and deactivating memberships still writes through `class_memberships`; inactive memberships preserve the user and history.
- Logged-in users can change their own password from the required password-change wall or profile page.
- A temporary password is returned to the UI only immediately after creation/reset so it can be printed or copied.

### `announcements`

Class announcements.

Columns:

- `id uuid primary key`
- `class_id uuid references classes(id)`
- `title text`
- `body text`
- `category public.announcement_category`
- `visible_from timestamptz`
- `visible_until timestamptz`
- `is_pinned boolean`
- `is_hidden boolean`
- `created_by uuid references profiles(id)`
- `updated_by uuid references profiles(id)`
- `deleted_at timestamptz`
- `require_read_confirmation boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Access is class-membership based.

Announcement lifecycle fields:

- `category` classifies the announcement as `general`, `exam`, `reminder`, or `material`.
- `is_hidden` hides an announcement from students without deleting it.
- `deleted_at` marks a soft delete.
- `updated_by` records the last editor.
- `require_read_confirmation` enables student read tracking in `announcement_reads`.
- `announcement_links` stores attached URL links for the announcement.
- `announcement_reads` stores per-student read confirmations.

Visibility rules for students:

- The user must have an active `student` membership in the announcement class.
- `deleted_at is null`
- `is_hidden = false`
- `visible_from <= now()`
- `visible_until is null or visible_until >= now()`

Staff visibility:

- Active class staff can select announcements for their classes.
- `owner` and `teacher` can create, edit, hide/unhide, and soft delete announcements for their classes.
- Soft delete means setting `deleted_at`; the app does not hard delete announcement rows.
- Announcement cards expose lifecycle actions as a grouped top-left action set: hide/unhide, edit, and delete.
- Delete is a soft delete and requires confirmation in the app before `deleted_at` is set.

### `announcement_links`

Attached links for announcements. These are URL links only; file attachments are not part of this workflow.

Columns:

- `id uuid primary key`
- `announcement_id uuid references announcements(id)`
- `title text`
- `url text`
- `sort_order int`
- `created_at timestamptz`

Access follows the parent announcement:

- Users who can read the parent announcement can read its links.
- `owner` and `teacher` memberships in the parent class can manage links.

### `announcement_reads`

Student read confirmations for announcements that require them.

Columns:

- `announcement_id uuid references announcements(id)`
- `user_id uuid references profiles(id)`
- `read_at timestamptz`

Primary key:

- `(announcement_id, user_id)`

Rules:

- Students can mark only themselves as read.
- Students can mark read only for visible announcements in classes where they have an active `student` membership.
- Staff can view read rows for announcements in classes where they have staff membership.
- Read-count denominators use active `student` rows in `class_memberships`.

### `homework_assignments`

Teacher-created homework for a class.

Columns:

- `id uuid primary key`
- `class_id uuid references classes(id)`
- `title text`
- `description text`
- `visible_from timestamptz`
- `due_at timestamptz`
- `allow_late_submission boolean not null default true` - whether students can submit or update after `due_at`.
- `late_submission_until timestamptz null` - optional final cutoff for late submissions; `null` means late submissions remain allowed when `allow_late_submission = true`.
- `require_status boolean`
- `require_understanding boolean`
- `require_photo boolean`
- `allow_external_url boolean`
- `external_url text`
- `is_hidden boolean`
- `created_by uuid references profiles(id)`
- `updated_by uuid references profiles(id)`
- `deleted_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Manage access is limited to class roles that can manage content.

Homework lifecycle fields:

- `is_hidden` hides a homework assignment from students without deleting it.
- `deleted_at` marks a soft delete.
- `updated_by` records the last editor.
- `allow_late_submission` controls whether students can submit or update after `due_at`.
- `late_submission_until` is the optional final cutoff for late submissions.

Current app usage:

- Teachers with active `owner` or `teacher` membership in `class_memberships` can create and edit assignments for that class.
- Teachers with active `owner` or `teacher` membership can hide/unhide homework through `is_hidden`.
- Teachers with active `owner` or `teacher` membership can soft delete homework by setting `deleted_at`; the app does not hard delete homework rows.
- Homework cards expose lifecycle actions as a grouped top-left action set: hide/unhide, edit, and delete.
- Delete is a soft delete and requires confirmation in the app before `deleted_at` is set.
- Staff can see non-deleted homework in their classes, including hidden homework.
- Student visibility means `deleted_at is null`, `is_hidden = false`, and `visible_from <= now()`.
- `due_at` is shown as the submission deadline. Overdue assignments remain visible, but submission/update is allowed only when `allow_late_submission = true` and either `late_submission_until is null` or `late_submission_until >= now()`.
- If `allow_late_submission = false`, students cannot submit or update after `due_at`.
- `require_status`, `require_understanding`, and `require_photo` control which expectations are shown in the UI.
- If `external_url` is filled, the app stores `allow_external_url = true`.
- Default app list limits: student visible announcements 10, student homework list 100 fetched / 10 initially shown, teacher announcements 20, and teacher homework 20.

### `homework_submissions`

Student homework submission state.

Columns:

- `id uuid primary key`
- `homework_id uuid references homework_assignments(id)`
- `student_id uuid references profiles(id)`
- `status public.homework_status`
- `understanding public.understanding_level`
- `note text`
- `submitted_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Unique constraint:

- `(homework_id, student_id)`

Current app usage:

- Students submit or update their own row through an upsert on `(homework_id, student_id)`.
- The app stores `submitted_at = now()` whenever the student submits or updates.
- Teachers view submission summaries and per-student details for classes where they have active staff membership.
- Summary denominators use active `student` memberships in `class_memberships`.

### `homework_files`

Metadata for uploaded homework photos. Files live in Supabase Storage.

Columns:

- `id uuid primary key`
- `submission_id uuid references homework_submissions(id)`
- `file_path text unique`
- `file_name text`
- `mime_type text`
- `size_bytes bigint`
- `created_at timestamptz`

Storage bucket convention:

- Bucket: `homework-submissions`
- Bucket visibility: private, not public.
- Path: `{student_id}/{homework_id}/{timestamp}-{safeFileName}`

Current app usage:

- Students can attach one or more notebook photos after their homework submission row is saved.
- The browser uploads images to Supabase Storage with the authenticated user session.
- The app inserts one `homework_files` metadata row per uploaded image.
- Students can remove file metadata only for files connected to their own submissions.
- `0004_homework_file_delete_policy.sql` adds the RLS delete policy for student-owned homework file metadata removal.
- Removal should delete or detach the metadata row and should also remove the private storage object when the app path performs storage cleanup. If storage cleanup fails, orphan cleanup is a follow-up maintenance concern.
- Teachers view uploaded files from homework submission details.
- Private files are opened through short-lived signed URLs; the bucket is not public.
- Missing files should not be represented as filename-only links. The UI should show an unavailable/missing state instead of a broken filename-only display.

### `knowledge_domains`

Math knowledge areas by grade.

Columns:

- `id uuid primary key`
- `grade int`
- `title text`
- `description text`
- `sort_order int`
- `created_at timestamptz`

Unique constraint:

- `(grade, title)`

### `knowledge_skills`

Individual math skills within domains.

Columns:

- `id uuid primary key`
- `domain_id uuid references knowledge_domains(id)`
- `parent_skill_id uuid references knowledge_skills(id)`
- `title text`
- `description text`
- `source_level public.skill_source_level`
- `skill_type text` - one of `prerequisite`, `curriculum`, `support`, `enrichment`, or `system`.
- `required_knowledge text`
- `diagnostic_question text`
- `external_practice_url text`
- `sort_order int`
- `active boolean`
- `created_at timestamptz`

`skill_type` meanings:

- `prerequisite` - ידע קודם.
- `curriculum` - תוכנית השנה.
- `support` - מיומנות תומכת.
- `enrichment` - העשרה.
- `system` - מערכת/מטא.

The knowledge map itself is shared by grade through `knowledge_domains` and `knowledge_skills`.

### `skill_resources`

Optional links attached to knowledge skills. These are URL resources only; file uploads are not part of this workflow.

Columns:

- `id uuid primary key`
- `skill_id uuid references knowledge_skills(id)`
- `resource_type text` - one of `practice`, `video`, `worksheet`, `explanation`, `geogebra`, `form`, or `other`.
- `title text`
- `url text`
- `sort_order int`
- `created_at timestamptz`

### `class_skill_progress`

Tracks what a class has already learned.

Columns:

- `class_id uuid references classes(id)`
- `skill_id uuid references knowledge_skills(id)`
- `is_taught boolean`
- `taught_at timestamptz`
- `teacher_note text`
- `updated_at timestamptz`

Primary key:

- `(class_id, skill_id)`

### `student_skill_self_assessments`

Student self-reported understanding per class and skill.

Columns:

- `class_id uuid references classes(id)`
- `student_id uuid references profiles(id)`
- `skill_id uuid references knowledge_skills(id)`
- `level public.understanding_level`
- `note text`
- `updated_at timestamptz`

Primary key:

- `(class_id, student_id, skill_id)`

Important behavior:

- Self assessment is class-scoped so the same student can report differently in different classes.
- Students may report on any skill in their active class context, even if `class_skill_progress.is_taught = false`.
- Self assessment is not performance/mastery evidence. Performance data will later come from `practice_sessions`, homework, quizzes, or other evidence.

### `homework_skills`

Join table connecting homework assignments to skills.

Columns:

- `homework_id uuid references homework_assignments(id)`
- `skill_id uuid references knowledge_skills(id)`

Primary key:

- `(homework_id, skill_id)`

### `practice_sessions`

Practice session results from internal or external practice sources.

Columns:

- `id uuid primary key`
- `student_id uuid references profiles(id)`
- `skill_id uuid references knowledge_skills(id)`
- `source public.practice_source`
- `external_session_id text`
- `questions_count int`
- `correct_count int`
- `score_percent numeric`
- `started_at timestamptz`
- `completed_at timestamptz`
- `created_at timestamptz`

## Enums

### `class_role`

- `owner`
- `teacher`
- `viewer`
- `student`

### `announcement_category`

- `general`
- `exam`
- `reminder`
- `material`

### `homework_status`

- `not_started`
- `started`
- `done`

### `understanding_level`

- `good`
- `partial`
- `no`
- `unknown`

### `skill_source_level`

- `elementary`
- `grade7`
- `advanced`
- `too_advanced`
- `system`

### `practice_source`

- `atomic_math`
- `internal`
- `google_form`
- `external`

## Current RLS Direction

RLS is enabled for the app tables. RLS is the real security layer; frontend route protection is for user experience only. Policies are based on contextual class membership:

- Staff can select their classes, including archived classes.
- Students can select only active classes where they have active student membership.
- Students can select only visible announcements for their classes.
- Class staff can select announcements for their classes.
- Students can select only visible, non-hidden, non-deleted homework for their classes.
- Class staff can select non-deleted homework for their classes, including hidden homework.
- `owner`, `teacher`, and `viewer` are class staff.
- `owner` and `teacher` can manage class content.
- Only `owner` can update/archive class records and manage memberships after first owner creation.
- Students can create/update their own homework submissions.
- Students can create/update their own announcement read confirmations.
- Staff can view student submissions for classes they are connected to.
- Staff can view announcement read-confirmation counts and details for their classes.
- Authenticated users can view `knowledge_domains`, `knowledge_skills`, and `skill_resources`.
- Class members can view `class_skill_progress`; `owner` and `teacher` can manage it.
- Students can manage their own class-scoped `student_skill_self_assessments`; staff can view reports for their classes.

See `docs/auth-and-roles.md` for the role rules and helper functions.
