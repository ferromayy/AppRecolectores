import { redirect } from "next/navigation";

import { OperarioParametrosSistema } from "@/components/panel/operario/operario-parametros-sistema";
import { fetchPrecioBolsaExtraHistorial } from "@/lib/data/sistema-parametros";
import { requireAuth } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/domain/constants";
import { isSupabaseAdminConfigured } from "@/lib/env";

export default async function ParametrosSistemaPage() {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/parametros");
  }

  if (!isStaffRole(auth.profile.role)) {
    redirect("/panel");
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <p className="text-sm text-red-600">
        Falta configurar SUPABASE_SERVICE_ROLE_KEY para cargar parámetros de sistema.
      </p>
    );
  }

  const { items, error } = await fetchPrecioBolsaExtraHistorial();
  const precioActivo = items.find((item) => item.activo) ?? null;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error al cargar parámetros: {error}. ¿Aplicaste la migración{" "}
          <code className="text-xs">20260525120000_sistema_parametros_precio.sql</code>?
        </p>
      )}
      <OperarioParametrosSistema historial={items} precioActivo={precioActivo} />
    </div>
  );
}
