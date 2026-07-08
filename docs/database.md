# Database Schema

Source of truth:

- `supabase/migrations/0001_current_schema_reference.sql`
- `supabase/migrations/0002_announcements_workflow.sql`
- `supabase/migrations/0003_homework_lifecycle.sql`

This document describes the current effective Supabase schema after the contextual class role migration in that file. Earlier definitions in the same migration create the first version of the schema, then the later section replaces the global/legacy class role model.

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
- `display_name text`
- `username text unique`
- `created_at timestamptz`
- `updated_at timestamptz`

Important: `profiles.username` is stable identity metadata for the user. Normal student auth emails are generated from the normalized username. There is no effective `role` column; do not model authorization from `profiles.role`.

### `classes`

Class metadata.

Columns:

- `id uuid primary key`
- `name text`
- `grade int`
- `class_code text unique`
- `created_at timestamptz`
- `updated_at timestamptz`

Important: there is no effective `teacher_id` column. Class ownership and staff access are represented in `class_memberships`.

### `class_memberships`

The central authorization and enrollment table.

Columns:

- `class_id uuid references classes(id)`
- `user_id uuid references profiles(id)`
- `role public.class_role`
- `student_code text`
- `active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Primary key:

- `(class_id, user_id)`

Indexes:

- `user_id`
- `class_id`
- `role`

Use this table for all class-level access checks, staff views, student enrollment, current student class context, and ownership.

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

### `tags`

Reusable labels for homework organization and future autocomplete/search.

Columns:

- `id uuid primary key`
- `label text` - display label, preserving the teacher-facing text.
- `normalized_label text` - normalized value for uniqueness and search.
- `class_id uuid null references classes(id)` - `null` means global/reusable; non-null means class-specific.
- `knowledge_skill_id uuid null references knowledge_skills(id)` - optional link to a math skill.
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Current app usage:

- Tag normalization trims whitespace, removes leading `#`, collapses spaces, lowercases, and replaces spaces with `_` for `normalized_label`.
- Teachers can create class-specific custom tags while creating or editing homework in classes they manage.
- Skill suggestions can create tags linked to `knowledge_skills`.
- There is no tag library, merge, or global delete UI yet.

### `homework_tags`

Join table connecting homework assignments to tags.

Columns:

- `homework_id uuid references homework_assignments(id)`
- `tag_id uuid references tags(id)`
- `created_at timestamptz`

Current app usage:

- Homework create/update replaces the assignment's tag links.
- Teacher and student homework cards show attached tags.
- Students can view tags on visible homework but cannot create or edit tags.

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
- Teachers view uploaded files from homework submission details.
- Private files are opened through short-lived signed URLs; the bucket is not public.

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
- `required_knowledge text`
- `diagnostic_question text`
- `external_practice_url text`
- `sort_order int`
- `active boolean`
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

Student self-reported understanding per skill.

Columns:

- `student_id uuid references profiles(id)`
- `skill_id uuid references knowledge_skills(id)`
- `level public.understanding_level`
- `note text`
- `updated_at timestamptz`

Primary key:

- `(student_id, skill_id)`

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

RLS is enabled for the app tables. Policies are based on contextual class membership:

- Class members can select their classes and class content.
- Students can select only visible announcements for their classes.
- Class staff can select announcements for their classes.
- Students can select only visible, non-hidden, non-deleted homework for their classes.
- Class staff can select non-deleted homework for their classes, including hidden homework.
- `owner`, `teacher`, and `viewer` are class staff.
- `owner` and `teacher` can manage class content.
- Only `owner` can update/delete class records and manage memberships after first owner creation.
- Students can create/update their own homework submissions.
- Students can create/update their own announcement read confirmations.
- Staff can view student submissions for classes they are connected to.
- Staff can view announcement read-confirmation counts and details for their classes.

See `docs/auth-and-roles.md` for the role rules and helper functions.
