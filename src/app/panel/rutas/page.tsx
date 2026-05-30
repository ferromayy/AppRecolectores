import { RutasList } from "@/components/panel/rutas-list";
import { enrichRutas } from "@/lib/domain/rutas";
import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { redirect } from "next/navigation";

export default async function PanelRutasPage() {
  const auth = await requireStaff();
  if (!auth.ok) {
    redirect("/panel");
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Rutas</h1>
        <p className="text-sm text-red-600">
          Falta configurar la clave secreta de Supabase en el servidor.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();

  const { data: rutas, error: rutasError } = await admin
    .from("rutas")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: paradas } = await admin.from("ruta_paradas").select("ruta_id");

  const { data: recolectores } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "recolector");

  const paradaCounts = new Map<string, number>();
  for (const parada of paradas ?? []) {
    paradaCounts.set(
      parada.ruta_id,
      (paradaCounts.get(parada.ruta_id) ?? 0) + 1,
    );
  }

  const enriched = enrichRutas(rutas ?? [], paradaCounts, recolectores ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Rutas
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Rutas importadas desde Google Sheets (nombre, fecha y recolector
          asignado). Las paradas se agregarán cuando activemos la automatización
          completa.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        <p className="font-medium">Importación desde spreadsheet</p>
        <p className="mt-1">
          Configurá el botón en Google Sheets con Apps Script. Guía completa en{" "}
          <code className="rounded bg-white/60 px-1 dark:bg-black/30">
            docs/SHEETS_INTEGRATION.md
          </code>
          .
        </p>
      </div>

      {rutasError && (
        <p className="text-sm text-red-600">
          Error al cargar rutas: {rutasError.message}. ¿Aplicaste la migración{" "}
          <code>20260521120000_rutas_sheets_import.sql</code>?
        </p>
      )}

      <RutasList rutas={enriched} />
    </div>
  );
}
