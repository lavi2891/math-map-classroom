# Project Status

## 1. What The System Is

Hebrew RTL mobile-first classroom math management system.

The system has teacher and student roles. Current focus is class management, announcements, homework, submissions, homework photos, and student onboarding. Knowledge map and deeper practice integration are planned later.

## 2. Current Implemented Features

- Auth with Supabase.
- Student login with username and password.
- Teacher login with email and password.
- Membership-based routing through `class_memberships`.
- Teacher class list and class management.
- Class creation, edit, archive, and unarchive.
- Student class context and active-class selection.
- Announcements workflow.
- Announcement read confirmations.
- Homework assignments.
- Homework submissions with status and understanding.
- Homework photo uploads and removal through private storage.
- Homework tags foundation and display.
- Student management for class owners.
- Temporary passwords and first-login password-change onboarding.
- Printable student login cards.

## 3. Current Navigation

Student:

- בית
- כיתה
- מפת ידע
- תרגול
- פרופיל

Teacher:

- כיתות
- שיעורי בית
- הודעות
- מצב
- פרופיל

## 4. Current Database Migrations

- `0001_current_schema_reference.sql` - base schema, contextual class role model, RLS helpers and policies, storage bucket/policies, initial knowledge/homework/practice structures.
- `0002_announcements_workflow.sql` - announcement workflow additions, links, read confirmations, and announcement lifecycle fields.
- `0003_homework_lifecycle.sql` - homework lifecycle fields, submissions, homework files, and related policies.
- `0004_homework_file_delete_policy.sql` - storage/file deletion policy adjustments for homework photos.
- `0004_homework_late_submission.sql` - late submission fields and behavior support.
- `0005_student_password_onboarding.sql` - password onboarding fields on profiles.
- `0006_student_management.sql` - student password events and student-management policy support.
- `0007_refine_student_management.sql` - student-management RPCs and service-role grants for backend account operations.
- `0008_class_management.sql` - class display name, school year, active/archive fields, and active-aware class visibility policies.

## 5. Known Limitations / TODO

- Knowledge map is not fully implemented yet.
- Tags/skills for homework are not complete yet.
- Atomic Math integration is external link only / not yet connected.
- Storage orphan cleanup is manual or partial.
- Need more RLS review before real deployment.
- Need student account flow review before school use.

## 6. Next Planned Milestones

- Finish class management polish.
- Student management + printable login cards.
- Knowledge map.
- Tags/skills for homework.
- Class status dashboard.
- Atomic Math integration.
