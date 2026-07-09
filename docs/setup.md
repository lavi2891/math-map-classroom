# Setup

## Supabase Environment

Use these variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key`
- `SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key`

Do not use `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, or direct database connection strings in the app.

`SUPABASE_SERVICE_ROLE_KEY` is allowed only in server-only code, such as `src/lib/supabase/admin.ts`, for Supabase Auth Admin operations. Never expose it to client components and never prefix it with `NEXT_PUBLIC`.

After editing `.env.local`, restart the dev server. Next.js only reads updated environment variables when the server starts.
