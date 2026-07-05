const REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type SupabaseEnvVarName = (typeof REQUIRED_SUPABASE_ENV_VARS)[number];

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const missingVars = REQUIRED_SUPABASE_ENV_VARS.filter(
    (name: SupabaseEnvVarName) => !process.env[name],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variable(s): ${missingVars.join(
        ", ",
      )}. Add them to .env.local. Do not use a service role key here.`,
    );
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
