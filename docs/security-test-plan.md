# Security Test Plan

This plan covers manual security checks for the current app and a future Playwright E2E suite.

## Manual Security Matrix

| Scenario | Actor | Steps | Expected result |
| --- | --- | --- | --- |
| Owner can manage own class | Owner in `Z7A` | Create/edit/archive class and manage students. | Allowed for classes where owner has active `owner` membership. |
| Teacher can manage content | Teacher in `Z7A` | Create announcement and homework. | Allowed for `Z7A` content only. |
| Teacher cannot perform owner-only actions | Teacher in `Z7A` | Attempt class archive or account reset if route/action is reachable. | Action is unavailable or rejected. |
| Viewer cannot create content | Viewer in `Z7A` | Attempt announcement/homework creation. | UI hides action or server/RLS rejects it. |
| Same-class student isolation | Student `z7a001` | Attempt to view `z7a002` submission/photo. | Rejected or no data returned. |
| Cross-class student isolation | Student `z7b101` | Attempt to view `Z7A` announcements/homework/submissions/photos. | Rejected or no data returned. |
| Archived class hidden from students | Student in archived `Z7A` | Log in and inspect class dropdown/home. | Archived class is absent from student context. |
| Archived class visible to staff | Owner/teacher in archived `Z7A` | Open teacher classes. | Staff can still see archived class. |
| Hidden announcement hidden from students | Student in `Z7A` | Open announcements after teacher hides one. | Hidden announcement is absent. |
| Deleted announcement hidden from students | Student in `Z7A` | Open announcements after teacher soft deletes one. | Deleted announcement is absent. |
| Hidden homework hidden from students | Student in `Z7A` | Open homework after teacher hides one. | Hidden homework is absent. |
| Deleted homework hidden from students | Student in `Z7A` | Open homework after teacher soft deletes one. | Deleted homework is absent. |
| Read confirmation writes own row only | Student `z7a001` | Mark required announcement as read. | `announcement_reads.user_id` equals current user only. |
| Homework submission writes own row only | Student `z7a001` | Submit homework. | `homework_submissions.student_id` equals current user only. |
| Photo upload path is owner-scoped | Student `z7a001` | Upload homework photo. | Storage path starts with current user id and metadata links to own submission. |
| Photo delete uses file id, not raw path | Student `z7a001` | Remove own photo. | Server resolves `file_path` from `homework_files.id`; raw client path is not trusted. |
| First-login password wall | Student with `must_change_password = true` | Log in and browse `/student/home`. | User is redirected to `/change-password`. |
| Password reset forces change | Owner resets password, student logs in. | New temporary password works and password wall appears. |

## Development Helper

Use `/dev/security` only in local development. It should:

- Return 404 when `NODE_ENV !== "development"`.
- Show current auth user id.
- Show active `class_memberships` rows for the current user.
- Show selected student class id cookie.
- Show current app mode.
- Never show passwords, tokens, cookies, service role keys, Supabase keys, or signed storage URLs.

## Future Playwright E2E Plan

Do not implement these until the test setup and stable seed users are ready.

| Test | Outline | Expected result |
| --- | --- | --- |
| Student cannot see another student's homework submission | Log in as `z7a001`, try to navigate/use action for `z7a002` submission. | Submission data is not visible and action fails. |
| Student cannot see another student's homework photo | Log in as `z7a001`, try to access `z7a002` photo metadata/signed URL path. | No signed URL is returned and UI does not show the photo. |
| Student cannot see hidden announcement | Teacher hides announcement, student reloads announcements. | Hidden announcement is absent. |
| Student cannot see hidden homework | Teacher hides homework, student reloads homework. | Hidden homework is absent. |
| Teacher can create announcement and student can mark read | Teacher creates required-read announcement; student marks read. | Read count updates for that student only. |
| Teacher can create homework and student can submit | Teacher creates homework; student submits. | Teacher summary shows submission; student card shows current status. |
| Viewer can view class but cannot create content | Viewer opens teacher views and attempts creation routes/actions. | Viewer cannot create announcements/homework. |
| Archived class disappears from student view | Owner archives class; student reloads. | Class is absent from student class context. |

## E2E Setup Notes

- Use deterministic seed users from `docs/testing-users.md`.
- Avoid relying on temporary passwords in committed tests.
- Never commit Supabase service role keys, cookies, tokens, or real student data.
- Prefer test data cleanup by class id and generated prefixes.
