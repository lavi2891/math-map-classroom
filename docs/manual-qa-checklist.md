# Manual QA Checklist

Use the users described in `docs/testing-users.md`. Record browser, user, class, and date for every run.

## Teacher Owner

| Test | Steps | Expected result |
| --- | --- | --- |
| Owner can open teacher classes | Log in as owner in `Z7A` and open `/teacher/classes`. | `Z7A` appears with owner role and class actions. |
| Owner can create a class | Click `+ כיתה חדשה`, fill required fields, save. | Class appears immediately and owner receives an active `owner` membership. |
| Owner can edit class fields | Edit `name`, `display_name`, `grade`, `class_code`, and `school_year`. | Changes persist and the form closes after save. |
| Owner can archive a class | Archive a test class. | `classes.active = false`, `archived_at` is set, and students no longer see the class. |
| Owner can unarchive a class | Unarchive the archived test class. | `classes.active = true`, `archived_at` is cleared, and students can see it again. |
| Owner can manage students | Open `/teacher/classes/[classId]/students`. | Active students are listed; create/reset/force/remove actions are available. |
| Owner can create temporary student login | Create a student with a generated temporary password. | Auth user, `profiles`, and active `class_memberships` row are created; temporary login card is shown once. |
| Owner can reset password | Reset a student's password. | New temporary password is shown once and `profiles.must_change_password = true`. |

## Teacher

| Test | Steps | Expected result |
| --- | --- | --- |
| Teacher can view class | Log in as teacher in `Z7A`. | Teacher can access teacher navigation and see `Z7A`. |
| Teacher can create announcement | Create a visible announcement in `Z7A`. | Announcement appears for `Z7A` students after visibility time. |
| Teacher can create homework | Create a visible homework assignment in `Z7A`. | Homework appears for `Z7A` students after visibility time. |
| Teacher cannot archive class | Try to find archive/edit-owner-only controls. | Owner-only class archive actions are unavailable or fail clearly. |
| Teacher cannot manage student accounts if owner-only | Try direct access to student management actions as teacher. | Account creation/reset is unavailable or rejected according to current MVP owner-only rule. |

## Viewer

| Test | Steps | Expected result |
| --- | --- | --- |
| Viewer can view class data | Log in as viewer in `Z7A`. | Viewer can see staff-facing class information allowed by RLS. |
| Viewer cannot create announcement | Attempt to create an announcement. | Creation UI is unavailable or server action/RLS rejects the insert. |
| Viewer cannot create homework | Attempt to create homework. | Creation UI is unavailable or server action/RLS rejects the insert. |
| Viewer cannot manage students | Attempt student-management route/actions. | Actions are unavailable or rejected. |

## Student In Same Class

| Test | Steps | Expected result |
| --- | --- | --- |
| Student sees active class | Log in as student `z7a001`. | Student lands in the active `Z7A` context. |
| Student sees visible announcement | Create a visible announcement in `Z7A`, then log in as `z7a001`. | Announcement appears in student announcements/home summary as appropriate. |
| Student sees visible homework | Create visible homework in `Z7A`. | Homework appears in `/student/homework` and compact home summary as appropriate. |
| Student submits homework | Open visible submittable homework and submit status/understanding/note. | One `homework_submissions` row exists for `student_id = z7a001 auth.uid()`. |
| Student updates own submission | Change status or note. | Same submission row updates; no other student's row changes. |
| Student uploads photo | Upload an image for own homework submission. | Private storage object and `homework_files` metadata row are created for the student's submission. |
| Student removes own photo | Remove the uploaded photo. | Metadata is removed and storage object is removed when cleanup succeeds. |

## Student In Another Class

| Test | Steps | Expected result |
| --- | --- | --- |
| Other-class student cannot see Z7A announcement | Log in as student `z7b101` after creating `Z7A` announcement. | `Z7A` announcement is not visible. |
| Other-class student cannot see Z7A homework | Log in as student `z7b101` after creating `Z7A` homework. | `Z7A` homework is not visible. |
| Other-class student cannot submit Z7A homework | Attempt direct URL/action against `Z7A` homework id. | Submission is rejected by server/RLS. |

## Archived Class

| Test | Steps | Expected result |
| --- | --- | --- |
| Archived class hidden from students | Archive `Z7A`, then log in as a `Z7A` student. | Archived class is not selectable/visible in student context. |
| Archived class still visible to staff | Log in as owner/teacher after archive. | Staff can still see the archived class according to staff RLS and UI. |
| Archived class restored | Unarchive `Z7A`. | Students can see `Z7A` again. |

## Hidden/Deleted Announcements

| Test | Steps | Expected result |
| --- | --- | --- |
| Hidden announcement hidden from students | Hide an announcement. | Students do not see it; staff can still manage it. |
| Unhidden announcement returns | Unhide the same announcement. | Students can see it if visibility dates allow. |
| Deleted announcement hidden from students | Soft delete an announcement. | Students do not see it and it is not hard deleted. |
| Future announcement hidden | Set `visible_from` in the future. | Students do not see it until the time passes. |

## Hidden/Deleted Homework

| Test | Steps | Expected result |
| --- | --- | --- |
| Hidden homework hidden from students | Hide homework. | Students do not see it; staff can still manage it. |
| Unhidden homework returns | Unhide homework. | Students can see it if `visible_from <= now()`. |
| Deleted homework hidden from students | Soft delete homework. | Students do not see it and it is not hard deleted. |
| Future homework hidden | Set `visible_from` in the future. | Students do not see it until the time passes. |

## Read Confirmations

| Test | Steps | Expected result |
| --- | --- | --- |
| Required read appears as unread | Create announcement with `require_read_confirmation = true`. | Student sees it as requiring read confirmation. |
| Student marks read | Student clicks read confirmation. | `announcement_reads` has one row for that student and announcement. |
| Staff sees read count | Teacher opens read details. | Read count includes only active students in the class. |
| Other student remains unread | Check student `z7a002` before marking read. | `z7a002` is counted as unread. |

## Homework Submissions

| Test | Steps | Expected result |
| --- | --- | --- |
| Open homework can be submitted | Create homework with future/no due date. | Student can open and submit. |
| Late allowed homework can be submitted | Pass `due_at`, set `allow_late_submission = true`. | Student sees late badge and can submit until cutoff. |
| Late closed homework cannot be submitted | Pass `due_at`, set `allow_late_submission = false` or passed `late_submission_until`. | Student can view homework but cannot update submission. |
| Teacher sees class summary | Submit as one student. | Teacher summary shows submitted counts without exposing edit access to students. |

## Homework Photo Upload/Removal

| Test | Steps | Expected result |
| --- | --- | --- |
| Photo-required done blocked without photo | Create homework with photo required; submit `done` with no photo. | Submission is rejected with a clear error. |
| Photo-required done succeeds with photo | Upload photo, then submit `done`. | Submission succeeds and card shows photo attached. |
| Last required photo removal blocked | Try removing the only photo from a `done` submission that requires photo. | Removal is blocked. |
| Missing storage object does not show filename-only link | Delete storage object manually but leave metadata, then view details. | UI skips broken file or shows unavailable state, not a filename-only link. |

## First-Login Password Change

| Test | Steps | Expected result |
| --- | --- | --- |
| New student forced to change password | Log in with a temporary password where `must_change_password = true`. | User is redirected to `/change-password` before student/teacher pages. |
| Weak password rejected | Enter fewer than 8 characters. | Form shows Hebrew validation error. |
| Mismatched confirmation rejected | Enter non-matching passwords. | Form shows Hebrew validation error. |
| Successful change clears flag | Submit valid matching password. | Supabase Auth password updates, `must_change_password = false`, `password_changed_at` is set. |

## Temporary Password Reset

| Test | Steps | Expected result |
| --- | --- | --- |
| Reset generates one-time password | Owner resets a student password. | New temporary password appears in login card output only. |
| Reset forces password change | Student logs in with reset password. | Student is redirected to `/change-password`. |
| Old password no longer works | Try old password after reset. | Login fails clearly. |
