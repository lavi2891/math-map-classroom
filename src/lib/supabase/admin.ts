import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseSecretKey) {
    missingVars.push("SUPABASE_SECRET_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase admin environment variable(s): ${missingVars.join(
        ", ",
      )}.`,
    );
  }

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Missing required Supabase admin environment variable.");
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
