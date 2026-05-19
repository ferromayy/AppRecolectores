import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/env";

export function getSupabaseClientEnv() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase no está configurado. Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  return { supabaseUrl, supabaseKey };
}
