import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();
  redirect(ROUTES.login);
}
