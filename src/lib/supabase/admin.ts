import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseServiceRoleKey) {
    missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase admin environment variable(s): ${missingVars.join(
        ", ",
      )}.`,
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing required Supabase admin environment variable.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    },
  });
}
