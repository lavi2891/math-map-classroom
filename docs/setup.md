# Setup

## Supabase Environment

Use these variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key`

Do not use `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or direct database connection strings in the app.

After editing `.env.local`, restart the dev server. Next.js only reads updated environment variables when the server starts.
