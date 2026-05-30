import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildRutaExternalKey,
  buildRutaNombre,
  type ValidatedRecoleccion,
} from "@/lib/integrations/sheet-recoleccion-validation";
import type { Database } from "@/types/database";

export type ImportRecoleccionPayload = {
  spreadsheet_id: string;
  spreadsheet_url?: string;
  sheet_name?: string;
  recolecciones: ValidatedRecoleccion[];
};

export type ImportRecoleccionResult = {
  ok: true;
  rutas_creadas: number;
  rutas_actualizadas: number;
  recolecciones_count: number;
  warnings: string[];
  message: string;
};

export type ImportRecoleccionError = {
  ok: false;
  error: string;
  details?: string[];
};

type RutaGroup = {
  fecha: string;
  turno: ValidatedRecoleccion["turno"];
  recolector_email: string;
  recolector_id: string;
  recolector_label: string;
  items: ValidatedRecoleccion[];
};

export async function importRecoleccionesFromSheets(
  admin: SupabaseClient<Database>,
  payload: ImportRecoleccionPayload,
): Promise<ImportRecoleccionResult | ImportRecoleccionError> {
  if (payload.recolecciones.length === 0) {
    return { ok: false, error: "No hay recolecciones válidas para importar" };
  }

  const warnings: string[] = [];
  const groups = new Map<string, RutaGroup>();

  for (const item of payload.recolecciones) {
    const key = `${item.dia}:${item.turno}:${item.recolector_email}`;
    if (!groups.has(key)) {
      const recolector = await admin
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", item.recolector_email)
        .eq("role", "recolector")
        .maybeSingle();

      if (!recolector.data) {
        return {
          ok: false,
          error: `Recolector no encontrado: ${item.recolector_email}`,
        };
      }

      groups.set(key, {
        fecha: item.dia,
        turno: item.turno,
        recolector_email: item.recolector_email,
        recolector_id: recolector.data.id,
        recolector_label: recolector.data.full_name || recolector.data.email,
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  let rutasCreadas = 0;
  let rutasActualizadas = 0;
  let totalRecolecciones = 0;
  const now = new Date().toISOString();

  for (const group of groups.values()) {
    const externalKey = buildRutaExternalKey(
      payload.spreadsheet_id,
      group.fecha,
      group.turno,
      group.recolector_email,
    );

    const nombre = buildRutaNombre(group.fecha, group.turno, group.recolector_label);

    const { data: existing } = await admin
      .from("rutas")
      .select("id")
      .eq("external_key", externalKey)
      .maybeSingle();

    const rutaRow = {
      nombre,
      fecha: group.fecha,
      turno: group.turno,
      estado: "activa" as const,
      asignado_a: group.recolector_id,
      spreadsheet_id: payload.spreadsheet_id,
      spreadsheet_url: payload.spreadsheet_url ?? null,
      sheet_name: payload.sheet_name ?? null,
      external_key: externalKey,
      imported_at: now,
      metadata: {
        source: "google_sheets",
        recolecciones_count: group.items.length,
      },
    };

    let rutaId: string;

    if (existing?.id) {
      rutasActualizadas += 1;
      rutaId = existing.id;
      const { error } = await admin.from("rutas").update(rutaRow).eq("id", rutaId);
      if (error) return { ok: false, error: error.message };

      await admin.from("ruta_recolecciones").delete().eq("ruta_id", rutaId);
    } else {
      const { data: inserted, error } = await admin
        .from("rutas")
        .insert(rutaRow)
        .select("id")
        .single();

      if (error || !inserted) {
        return { ok: false, error: error?.message ?? "No se pudo crear la ruta" };
      }
      rutasCreadas += 1;
      rutaId = inserted.id;
    }

    const rows = group.items.map((item, index) => ({
      ruta_id: rutaId,
      orden: index + 1,
      zona: item.zona,
      nombre: item.nombre,
      unidad: item.unidad,
      tipo_servicio: item.tipo_servicio,
      frecuencia: item.frecuencia,
      barrio: item.barrio,
      direccion: item.direccion,
      depto: item.depto,
      telefono: item.telefono,
      telefono_normalizado: item.telefono_normalizado,
      observaciones: item.observaciones,
      dia: item.dia,
      hora: item.hora,
      nota_encargado: item.nota_encargado,
      precio: item.precio,
      deuda: item.deuda,
      sheet_fila: item.fila,
      sheet_estado: "Enviada",
      estado_operativo: "pendiente" as const,
    }));

    const { error: insertError } = await admin.from("ruta_recolecciones").insert(rows);
    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    totalRecolecciones += rows.length;
  }

  return {
    ok: true,
    rutas_creadas: rutasCreadas,
    rutas_actualizadas: rutasActualizadas,
    recolecciones_count: totalRecolecciones,
    warnings,
    message: `Importadas ${totalRecolecciones} recolecciones en ${groups.size} ruta(s).`,
  };
}

export async function fetchRecolectoresEmails(
  admin: SupabaseClient<Database>,
): Promise<{ email: string; nombre: string }[]> {
  const { data } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("role", "recolector")
    .order("full_name", { ascending: true });

  return (data ?? []).map((r) => ({
    email: r.email,
    nombre: r.full_name || r.email,
  }));
}
