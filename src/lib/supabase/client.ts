"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
