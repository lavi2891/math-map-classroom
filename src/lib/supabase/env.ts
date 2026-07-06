const REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type SupabaseEnvVarName = (typeof REQUIRED_SUPABASE_ENV_VARS)[number];

type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const missingVars = REQUIRED_SUPABASE_ENV_VARS.filter(
    (name: SupabaseEnvVarName) => !process.env[name],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variable(s): ${missingVars.join(
        ", ",
      )}. Add them to .env.local. Use the publishable key only; do not use a service role key or direct database connection string.`,
    );
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}
