import { redirect } from "next/navigation";

import { OperarioParametrosSistema } from "@/components/panel/operario/operario-parametros-sistema";
import { fetchPrecioHistorialByClave } from "@/lib/data/sistema-parametros";
import { requireAuth } from "@/lib/auth/session";
import {
  PARAMETRO_PRECIO_ORDEN,
  PARAMETRO_PRECIO_SLUGS,
  type ParametroPrecioSlug,
} from "@/lib/domain/sistema-parametros";
import { isStaffRole } from "@/lib/domain/constants";
import { isSupabaseAdminConfigured } from "@/lib/env";

function toParametroData(items: Awaited<ReturnType<typeof fetchPrecioHistorialByClave>>) {
  return {
    historial: items.items,
    precioActivo: items.items.find((item) => item.activo) ?? null,
  };
}

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

  const results = await Promise.all(
    PARAMETRO_PRECIO_ORDEN.map((slug) =>
      fetchPrecioHistorialByClave(PARAMETRO_PRECIO_SLUGS[slug]),
    ),
  );

  const error = results.find((r) => r.error)?.error ?? null;

  const parametros = Object.fromEntries(
    PARAMETRO_PRECIO_ORDEN.map((slug, index) => [slug, toParametroData(results[index])]),
  ) as Record<ParametroPrecioSlug, ReturnType<typeof toParametroData>>;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error al cargar parámetros: {error}. ¿Aplicaste la migración{" "}
          <code className="text-xs">20260525120000_sistema_parametros_precio.sql</code>?
        </p>
      )}
      <OperarioParametrosSistema parametros={parametros} />
    </div>
  );
}
