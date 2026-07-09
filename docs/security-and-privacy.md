# Security And Privacy

## 1. Data Minimization

- Students may be represented by codes or usernames instead of real names.
- Real names are optional and teacher-controlled through `profiles.display_name`.
- Avoid collecting or storing unnecessary personal data.
- Temporary passwords, Supabase tokens, service role keys, and browser session secrets must not be stored in application tables.

## 2. Auth Model

- Supabase Auth identifies users.
- App profile data lives in `profiles`.
- Role and access decisions are based on `class_memberships`.
- Normal student login uses username and password. Class code and `student_code` are not part of normal login.

## 3. Class-Based Authorization

- `owner`, `teacher`, `viewer`, and `student` are contextual roles per class.
- A user can have different roles in different classes.
- Authorization uses:
  - `class_memberships.class_id`
  - `class_memberships.user_id`
  - `class_memberships.role`
  - `class_memberships.active`
- Do not use `profiles.role`, `classes.teacher_id`, or `class_students` for authorization.

## 4. RLS Model

- Row Level Security is enabled and is the real security layer.
- Frontend route protection and middleware redirects are for UX only.
- Students can access only their own submissions and class-visible content.
- Teachers and staff can access classes where they are active members.
- Owners manage class settings and memberships.
- Server actions still perform explicit permission checks before privileged operations.

## 5. Service Role Key

- `SUPABASE_SERVICE_ROLE_KEY` is used only server-side when needed, such as creating student accounts or resetting passwords.
- It must never be used in client components.
- It must never be exposed as `NEXT_PUBLIC`.
- It must never be logged.
- The server-only admin client lives in `src/lib/supabase/admin.ts`.

## 6. Storage

- The homework photo bucket is private.
- Current bucket: `homework-submissions`.
- Files use a path convention based on student and homework, such as `{student_id}/{homework_id}/...`.
- Students can upload and remove their own files only.
- Teachers can view files for submissions in classes where they have staff access.
- Private files should be viewed through signed URLs, not public URLs.

## 7. Temporary Passwords

- Temporary passwords are shown only for onboarding and printable login cards.
- Temporary passwords are not stored in the database.
- Students should be forced to change password on first login when `profiles.must_change_password = true`.
- Password reset should create a new temporary password and set `profiles.must_change_password = true`.
- `student_password_events` may store password lifecycle events, but never password values.

## 8. Current Risks / Items To Review

- Verify all RLS policies before real deployment.
- Verify no service role usage reaches the client bundle.
- Verify `.env.local` is ignored.
- Verify deleted file metadata cleanup.
- Verify no student can access another student's submissions or photos.
