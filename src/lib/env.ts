type SupabaseEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabasePublishableKey) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variable(s): ${missingVars.join(
        ", ",
      )}. Add them to .env.local. This public/session client must use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, not a service role key or direct database connection string.`,
    );
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing required Supabase environment variable(s).");
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}
