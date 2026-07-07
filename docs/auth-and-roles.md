# Auth And Roles

Source of truth:

- `supabase/migrations/0001_current_schema_reference.sql`
- `supabase/migrations/0002_announcements_workflow.sql`
- `supabase/migrations/0003_homework_lifecycle.sql`

This project uses Supabase Auth for identity and `public.profiles` for profile metadata. Authorization is contextual and class-based through `public.class_memberships`.

## Architectural Decision

Roles are not global user properties.

Use:

- `class_memberships.role`

Do not use:

- `profiles.role`
- `classes.teacher_id`
- `class_students`

The migration moves the old model into `class_memberships`, then removes the old surfaces:

- Existing `classes.teacher_id` values are migrated into `class_memberships` as `owner`.
- Existing `class_students` rows are migrated into `class_memberships` as `student`.
- `classes.teacher_id` is dropped.
- `profiles.role` is dropped.
- `class_students` is dropped.

## Role Values

`class_memberships.role` can be:

- `owner`
- `teacher`
- `viewer`
- `student`

## Role Meaning

### `owner`

The class owner. This role can:

- View the class and class content.
- Manage class content.
- Update/delete class records.
- Manage class memberships.

### `teacher`

Teaching staff for a class. This role can:

- View the class and class content.
- Manage class content such as announcements and homework.
- View announcement read-confirmation counts and details.
- Create and edit homework assignments for the class.
- View homework submission summaries and student submission details for the class.
- View relevant student submissions and self assessments.

This role does not replace class ownership.

### `viewer`

Read-oriented staff access. This role can:

- View the class and class content.
- View relevant student data for shared classes.

This role is staff for visibility, but not for content management.

### `student`

Student membership in a class. This role can:

- View the class and visible class content.
- Mark themselves as read for announcements that require read confirmation.
- Create and update their own homework submissions with status, understanding, and optional note.
- Create and update their own skill self assessments.
- Create their own practice sessions.

## Common Access Questions

### Is this user in a class?

Use `class_memberships` where:

- `class_id = target class`
- `user_id = auth.uid()`
- `active = true`

The migration provides helper function:

- `public.is_class_member(target_class_id uuid)`

### Is this user a student in a class?

Use `class_memberships.role = 'student'`.

Helper:

- `public.is_class_student(target_class_id uuid)`

### Is this user staff in a class?

Staff means:

- `owner`
- `teacher`
- `viewer`

Helper:

- `public.is_class_staff(target_class_id uuid)`

### Can this user manage class content?

Content managers are:

- `owner`
- `teacher`

Helper:

- `public.can_manage_class_content(target_class_id uuid)`

### Who can manage announcements?

Announcement managers are active `owner` and `teacher` memberships in the announcement class.

Managers can:

- Create announcements for classes they manage.
- Edit title, body, category, links, pinned state, visibility dates, and read-confirmation requirement.
- Hide and unhide announcements through `is_hidden`.
- Soft delete announcements by setting `deleted_at`.

Managers must be authorized through `class_memberships`. Do not use `profiles.role`, `classes.teacher_id`, `class_students`, a service role key, or any RLS bypass for announcement management.

### Who can read announcements?

Students can read announcements only when all of these are true:

- They have an active `student` membership in the announcement class.
- `deleted_at is null`
- `is_hidden = false`
- `visible_from <= now()`
- `visible_until is null or visible_until >= now()`

Class staff can read non-deleted announcements in their classes for management and review, including hidden, future, and expired announcements.

### How do read confirmations work?

Announcements can set `require_read_confirmation = true`.

Students can mark only themselves as read. The app writes:

- `announcement_id`
- `user_id = auth.uid()`
- `read_at = now()`

Staff can view read counts for their classes. The denominator is active student memberships in the announcement class:

- `class_memberships.role = 'student'`
- `class_memberships.active = true`

Staff read details are split into students who marked read and students who have not marked read.

### Who can manage homework?

Homework managers are active `owner` and `teacher` memberships in the assignment class.

Managers can:

- Create homework assignments.
- Edit title, description, visibility date, due date, reporting requirements, photo requirement flag, and external URL.
- Hide and unhide homework through `is_hidden`.
- Soft delete homework by setting `deleted_at`.
- Configure deadline behavior with `due_at`, `allow_late_submission`, and `late_submission_until`.
- View submission summaries and per-student submission details.

Managers must be authorized through `class_memberships`. Do not use `profiles.role`, `classes.teacher_id`, `class_students`, a service role key, or any RLS bypass for homework management.

### Who can submit homework?

Students can view and submit only visible homework in classes where they have active `student` membership.

Visible homework means:

- `deleted_at is null`
- `is_hidden = false`
- `visible_from <= now()`

`due_at` does not block visibility. Submission/update is allowed when:

- `due_at is null`
- or `now() <= due_at`
- or `allow_late_submission = true` and `late_submission_until is null`
- or `allow_late_submission = true` and `now() <= late_submission_until`

When the deadline has passed and late submission is not allowed anymore, students can still view the homework but cannot open or update the submission form.

The app upserts `homework_submissions` by:

- `homework_id`
- `student_id = auth.uid()`

Students can update:

- `status`
- `understanding`
- `note`
- `submitted_at`

Students can upload homework photos only for their own submission. Storage paths use:

- `{student_id}/{homework_id}/{timestamp}-{safeFileName}`

The `student_id` path segment must match `auth.uid()`. The app does not use a service role key or public bucket access for homework photos.
Students can remove only files connected to their own homework submission.

Class staff can view uploaded homework files for submissions in their classes. Private storage objects are accessed through signed URLs when shown in the app.

### Is this user the class owner?

Use `class_memberships.role = 'owner'`.

Helper:

- `public.is_class_owner(target_class_id uuid)`

### Can this user view another user's profile or student data?

The user can view their own profile. Staff can view users who share a class with them.

Helper:

- `public.is_staff_of_user(target_user_id uuid)`

## Helper Functions In The Migration

Current class-membership helpers:

- `public.is_class_member(target_class_id uuid)`
- `public.is_class_student(target_class_id uuid)`
- `public.is_class_staff(target_class_id uuid)`
- `public.can_manage_class_content(target_class_id uuid)`
- `public.is_class_owner(target_class_id uuid)`
- `public.is_any_class_staff()`
- `public.is_staff_of_user(target_user_id uuid)`

Homework helpers:

- `public.is_student_of_homework(target_homework_id uuid)`
- `public.is_staff_of_homework(target_homework_id uuid)`
- `public.can_manage_homework(target_homework_id uuid)`
- `public.is_owner_of_submission(target_submission_id uuid)`
- `public.is_staff_of_submission(target_submission_id uuid)`

## RLS Policy Model

The current RLS model follows these rules:

- `profiles`: users can view themselves; staff can view users in shared classes.
- `classes`: class members can view classes.
- `classes`: first class owner can be inserted through membership bootstrap flow; class updates/deletes are owner-only.
- `class_memberships`: users can view their own membership; class staff can view related memberships.
- `class_memberships`: first owner can be created; later membership management is owner-only.
- `announcements`: staff can view class announcements; students can view visible class announcements; `owner` and `teacher` can manage.
- `announcement_links`: readable with the parent announcement; `owner` and `teacher` can manage through the parent class.
- `announcement_reads`: students can mark themselves as read; staff can view read rows for their classes.
- `homework_assignments`: staff can view non-deleted rows in their classes; students can view visible rows in their classes; `owner` and `teacher` can manage.
- `homework_submissions`: students can manage their own submissions; class staff can view.
- `homework_files`: owners of submissions and class staff can view; submission owners can insert.
- `knowledge_domains` and `knowledge_skills`: authenticated users can view; any class staff can manage.
- `class_skill_progress`: class members can view; `owner` and `teacher` can manage.
- `student_skill_self_assessments`: students can manage their own; staff can view students in shared classes.
- `homework_skills`: class members can view; `owner` and `teacher` can manage through the homework class.
- `practice_sessions`: students can create their own; staff can view students in shared classes.

## App Integration Rule

When real Supabase integration is added, app code should derive user capability from class membership rows, not from a global profile role.

Examples:

- To list teacher classes, query classes through memberships where role is `owner`, `teacher`, or `viewer`.
- To list manageable classes, use memberships where role is `owner` or `teacher`.
- To list student classes, use memberships where role is `student`.
- To check whether a user can edit homework, verify `owner` or `teacher` membership in that homework's class.

Do not add application logic that depends on `profiles.role`, `classes.teacher_id`, or `class_students`.
