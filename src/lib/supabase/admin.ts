import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente con service role: solo en servidor (API routes, Server Actions).
 * Omite RLS. No exponer esta clave al navegador.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Cliente admin no disponible. Definí SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
