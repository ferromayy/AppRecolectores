import { timingSafeEqual } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ImportRutaError,
  ImportRutaPayload,
  ImportRutaResult,
} from "@/lib/integrations/sheets-import-types";
import type { Database } from "@/types/database";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resolveAsignado(rawRuta: Record<string, unknown>): string {
  return (
    trim(rawRuta.asignado) ||
    trim(rawRuta.recolector_email) ||
    trim(rawRuta.recolector) ||
    ""
  );
}

function buildExternalKey(payload: ImportRutaPayload): string {
  const { ruta } = payload;
  if (ruta.external_key?.trim()) {
    return ruta.external_key.trim();
  }
  const parts = [
    ruta.spreadsheet_id?.trim(),
    ruta.sheet_name?.trim(),
    ruta.fecha.trim(),
    ruta.nombre.trim(),
  ].filter(Boolean);
  return parts.join(":");
}

export function validateImportPayload(
  body: unknown,
): ImportRutaPayload | ImportRutaError {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo JSON inválido" };
  }

  const raw = body as Record<string, unknown>;
  const rawRuta = raw.ruta;

  if (!rawRuta || typeof rawRuta !== "object") {
    return { ok: false, error: "Falta el objeto ruta" };
  }

  const rutaObj = rawRuta as Record<string, unknown>;
  const nombre = trim(rutaObj.nombre);
  const fecha = trim(rutaObj.fecha);
  const asignado = resolveAsignado(rutaObj);

  const details: string[] = [];

  if (!nombre) details.push("ruta.nombre es obligatorio");
  if (!fecha) {
    details.push("ruta.fecha es obligatorio (formato YYYY-MM-DD)");
  } else if (!DATE_RE.test(fecha)) {
    details.push("ruta.fecha debe tener formato YYYY-MM-DD");
  }
  if (!asignado) {
    details.push("ruta.asignado es obligatorio (email o nombre del recolector)");
  }

  const rawParadas = raw.paradas;
  const paradas: ImportRutaPayload["paradas"] = [];

  if (rawParadas !== undefined) {
    if (!Array.isArray(rawParadas)) {
      details.push("paradas debe ser un array");
    } else {
      rawParadas.forEach((item, index) => {
        const row = (item ?? {}) as Record<string, unknown>;
        const ordenRaw = row.orden;
        const orden =
          typeof ordenRaw === "number"
            ? ordenRaw
            : Number.parseInt(String(ordenRaw ?? index + 1), 10);
        const direccion = trim(row.direccion);

        if (!direccion) {
          details.push(`Parada ${index + 1}: direccion es obligatoria`);
          return;
        }

        paradas.push({
          orden: Number.isFinite(orden) && orden > 0 ? orden : index + 1,
          direccion,
          generador: trim(row.generador) || undefined,
          telefono: trim(row.telefono) || undefined,
          notas: trim(row.notas) || undefined,
        });
      });

      const ordenes = new Set<number>();
      for (const parada of paradas) {
        if (ordenes.has(parada.orden)) {
          details.push(`Orden duplicado: ${parada.orden}`);
        }
        ordenes.add(parada.orden);
      }
    }
  }

  if (details.length > 0) {
    return { ok: false, error: "Datos inválidos", details };
  }

  return {
    ruta: {
      nombre,
      fecha,
      asignado,
      spreadsheet_id: trim(rutaObj.spreadsheet_id) || undefined,
      spreadsheet_url: trim(rutaObj.spreadsheet_url) || undefined,
      sheet_name: trim(rutaObj.sheet_name) || undefined,
      external_key: trim(rutaObj.external_key) || undefined,
    },
    paradas,
  };
}

async function resolveRecolectorId(
  admin: SupabaseClient<Database>,
  asignado: string,
): Promise<{ id: string | null; warning?: string }> {
  const value = asignado.trim();
  if (!value) {
    return { id: null, warning: "Asignado vacío. La ruta quedó sin recolector." };
  }

  if (EMAIL_RE.test(value)) {
    const email = normalizeEmail(value);
    const { data: recolector } = await admin
      .from("profiles")
      .select("id, role, email")
      .eq("email", email)
      .maybeSingle();

    if (!recolector || recolector.role !== "recolector") {
      return {
        id: null,
        warning: `No se encontró recolector con email ${email}.`,
      };
    }
    return { id: recolector.id };
  }

  const { data: recolectores } = await admin
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("role", "recolector");

  const match = (recolectores ?? []).find(
    (r) =>
      r.full_name?.trim().toLowerCase() === value.toLowerCase() ||
      r.email.toLowerCase() === value.toLowerCase(),
  );

  if (!match) {
    return {
      id: null,
      warning: `No se encontró recolector "${value}". Usá el email del recolector.`,
    };
  }

  return { id: match.id };
}

export async function importRutaFromSheets(
  admin: SupabaseClient<Database>,
  payload: ImportRutaPayload,
): Promise<ImportRutaResult | ImportRutaError> {
  const warnings: string[] = [];
  const externalKey = buildExternalKey(payload);
  const now = new Date().toISOString();
  const paradas = payload.paradas ?? [];

  const asignado = payload.ruta.asignado ?? payload.ruta.recolector_email ?? "";
  const { id: asignadoA, warning: asignadoWarning } = await resolveRecolectorId(
    admin,
    asignado,
  );
  if (asignadoWarning) warnings.push(asignadoWarning);

  const { data: existing } = await admin
    .from("rutas")
    .select("id")
    .eq("external_key", externalKey)
    .maybeSingle();

  let rutaId: string;
  let reimported = false;

  const rutaRow = {
    nombre: payload.ruta.nombre,
    fecha: payload.ruta.fecha,
    estado: "activa" as const,
    asignado_a: asignadoA,
    spreadsheet_id: payload.ruta.spreadsheet_id ?? null,
    spreadsheet_url: payload.ruta.spreadsheet_url ?? null,
    sheet_name: payload.ruta.sheet_name ?? null,
    external_key: externalKey,
    imported_at: now,
    metadata: {
      source: "google_sheets",
      paradas_count: paradas.length,
      asignado_input: asignado,
    },
  };

  if (existing?.id) {
    reimported = true;
    rutaId = existing.id;

    const { error: updateError } = await admin
      .from("rutas")
      .update(rutaRow)
      .eq("id", rutaId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("rutas")
      .insert(rutaRow)
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { ok: false, error: insertError?.message ?? "No se pudo crear la ruta" };
    }

    rutaId = inserted.id;
  }

  if (paradas.length > 0) {
    if (reimported) {
      const { error: deleteError } = await admin
        .from("ruta_paradas")
        .delete()
        .eq("ruta_id", rutaId);

      if (deleteError) {
        return { ok: false, error: deleteError.message };
      }
    }

    const paradasRows = paradas.map((parada) => ({
      ruta_id: rutaId,
      orden: parada.orden,
      direccion: parada.direccion,
      generador_nombre: parada.generador ?? null,
      contacto_telefono: parada.telefono ?? null,
      notas: parada.notas ?? null,
      estado: "pendiente" as const,
    }));

    const { error: paradasError } = await admin
      .from("ruta_paradas")
      .insert(paradasRows);

    if (paradasError) {
      return { ok: false, error: paradasError.message };
    }
  }

  const paradasLabel =
    paradas.length > 0 ? ` con ${paradas.length} paradas` : "";

  return {
    ok: true,
    ruta_id: rutaId,
    paradas_count: paradas.length,
    reimported,
    warnings,
    message: reimported
      ? `Ruta "${payload.ruta.nombre}" actualizada${paradasLabel}.`
      : `Ruta "${payload.ruta.nombre}" importada${paradasLabel}.`,
  };
}

export function verifySheetsImportSecret(
  provided: string | null | undefined,
  expected: string,
): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
