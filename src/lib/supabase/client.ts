import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getSupabaseClientEnv } from "@/lib/supabase/env";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseClientEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
