# Database Schema

Source of truth: `supabase/migrations/0001_current_schema_reference.sql`.

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

Important: there is no effective `role` column. Do not model authorization from `profiles.role`.

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

Use this table for all class-level access checks, staff views, student enrollment, and ownership.

### `announcements`

Class announcements.

Columns:

- `id uuid primary key`
- `class_id uuid references classes(id)`
- `title text`
- `body text`
- `visible_from timestamptz`
- `visible_until timestamptz`
- `is_pinned boolean`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Access is class-membership based.

### `homework_assignments`

Teacher-created homework for a class.

Columns:

- `id uuid primary key`
- `class_id uuid references classes(id)`
- `title text`
- `description text`
- `visible_from timestamptz`
- `due_at timestamptz`
- `require_status boolean`
- `require_understanding boolean`
- `require_photo boolean`
- `allow_external_url boolean`
- `external_url text`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Manage access is limited to class roles that can manage content.

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
- Path: `{student_id}/{homework_id}/{filename}`

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
- `owner`, `teacher`, and `viewer` are class staff.
- `owner` and `teacher` can manage class content.
- Only `owner` can update/delete class records and manage memberships after first owner creation.
- Students can create/update their own homework submissions.
- Staff can view student submissions for classes they are connected to.

See `docs/auth-and-roles.md` for the role rules and helper functions.
