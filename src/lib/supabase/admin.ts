import { createClient } from "@supabase/supabase-js";

import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente con clave secreta: solo en servidor (API routes, Server Actions).
 * Omite RLS. No exponer esta clave al navegador.
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseSecretKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Cliente admin no disponible. Definí SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY en .env.local (Settings → API Keys → Secret key en Supabase).",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
