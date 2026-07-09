# Security Audit Notes

Date: 2026-07-09

Scope: source search of `src`, `docs`, and `supabase/migrations` for common authorization and privacy mistakes. This was a report-only pass except for adding the development-only `/dev/security` helper.

## Summary

- No client component import of `src/lib/supabase/admin.ts` was found.
- `SUPABASE_SERVICE_ROLE_KEY` usage is confined to the server-only admin client and documentation.
- No `dangerouslySetInnerHTML` usage was found.
- No `getPublicUrl` usage for homework photos was found.
- Homework photos use private storage signed URLs.
- No application code usage of `profiles.role`, `classes.teacher_id`, or `class_students` was found. Those strings remain in migrations/docs as historical migration context.

## Checks

| Check | Result | Notes |
| --- | --- | --- |
| Admin client imported by client components | Pass | `createSupabaseAdminClient` is imported by `src/lib/db/studentManagement.ts`. That module is used from server actions. |
| Service role key outside server-only code | Pass | `SUPABASE_SERVICE_ROLE_KEY` appears in `src/lib/supabase/admin.ts` and docs. |
| Public env variable that should be secret | Pass | Public keys are limited to URL/publishable/app URL style values. Service role key is not `NEXT_PUBLIC`. |
| Public storage URLs for homework photos | Pass | No `getPublicUrl` usage found. Signed URLs are created for private bucket access. |
| `dangerouslySetInnerHTML` | Pass | No occurrences found. |
| Legacy role/class tables in app code | Pass | No source usage of `profiles.role`, `classes.teacher_id`, or `class_students` found. |
| Fetch all profiles/memberships without class/user restriction | Needs review | Current profile and membership queries are generally scoped by current user, class id, exact username, or RLS. Keep this in the review checklist when adding batch/admin screens. |
| Server actions trusting client ids | Needs review | Most actions delegate to DB helpers that verify owner/teacher/student context or rely on RLS. Hide/unhide/delete actions for announcements/homework pass ids to helpers that rely heavily on RLS. Consider adding explicit preflight membership checks for clearer failures. |
| Photo delete trusting raw `file_path` | Pass | Student photo delete action accepts `fileId`; server fetches `file_path` after ownership check. |

## Findings

### 1. Homework tag code exists without a matching migration

`src/lib/db/tags.ts` and homework create/update paths reference `tags` and `homework_tags`, but the current migration list in the repo does not include a migration creating those tables.

Impact: homework create/edit/tag suggestion flows can fail at runtime in environments where the tag migration was not applied.

Recommended follow-up: either add the missing migration as the source of truth or remove/disable tag UI/code until the schema is present.

### 2. Some content lifecycle actions rely mostly on RLS

Teacher announcement and homework hide/unhide/delete server actions accept an item id from the form and call DB helpers. The helpers use the authenticated Supabase client, so RLS should enforce class access.

Impact: this can be secure if RLS is correct, but failure modes are less explicit and harder to debug.

Recommended follow-up: add explicit server-side ownership/content-management checks before mutating by id, then keep RLS as the backstop.

### 3. Development logs include identifiers

Some error logs include user ids, class ids, homework ids, file ids, and file paths. They do not include passwords, tokens, cookies, or service role keys.

Impact: acceptable for development diagnostics, but logs should be reviewed before production deployment.

Recommended follow-up: ensure production logging policy avoids unnecessary student identifiers and storage paths.

## Development Helper Added

`/dev/security` was added as a development-only route.

It shows only:

- Current auth user id.
- Active class memberships for the current user.
- Selected student class id cookie value.
- Current app mode.

It returns 404 outside development and does not import the admin client or show tokens, secrets, cookies, passwords, or signed URLs.
