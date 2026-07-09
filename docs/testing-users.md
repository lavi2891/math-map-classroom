# Testing Users

Recommended development users for manual QA and future E2E coverage.

These users should be created with Supabase Auth plus `profiles` and `class_memberships`. Use `class_memberships` as the source of truth for access. Do not use `profiles.role`, `classes.teacher_id`, or `class_students`.

## Recommended Classes

- `Z7A` - primary test class.
- Another active class, for example `Z7B` - used to verify cross-class isolation.
- One archived class - used to verify student visibility after `classes.active = false`.

## Recommended Users

| User | Role setup | Purpose |
| --- | --- | --- |
| Owner in Z7A | Active `class_memberships.role = owner` in `Z7A` | Class management, student management, content creation, archive/unarchive |
| Teacher in Z7A | Active `class_memberships.role = teacher` in `Z7A` | Content creation without class ownership actions |
| Viewer in Z7A | Active `class_memberships.role = viewer` in `Z7A` | Read-only staff access |
| Student 001 in Z7A | Active `class_memberships.role = student` in `Z7A` | Main student flow, submissions, photos, read confirmations |
| Student 002 in Z7A | Active `class_memberships.role = student` in `Z7A` | Same-class privacy checks between students |
| Student 101 in another class | Active `class_memberships.role = student` in another class only | Cross-class isolation checks |

## Suggested Student Usernames

- `z7a001`
- `z7a002`
- `z7b101`

Student auth email convention is `{username}@students.local`. Normal student login uses username and password only.

## Temporary Password Notes

- Temporary passwords are shown only immediately after creation or reset.
- Temporary passwords must not be stored in app tables.
- Students with `profiles.must_change_password = true` should be redirected to `/change-password`.

## Development Debug Helper

In development only, `/dev/security` shows:

- Current auth user id.
- Active memberships returned from `class_memberships`.
- Selected student class id cookie.
- Current app mode.

It does not show cookies, Supabase tokens, passwords, service role keys, or storage signed URLs. In production it returns 404.
