import {
  buildPrecioHistorialItem,
  PRECIO_BOLSA_EXTRA_CLAVE,
  PRECIO_BOLSA_LLENA_PUNTO_CLAVE,
  PRECIO_BOLSA_PUNTO_CLAVE,
  PRECIO_RETIRO_RECICLABLE_MIXTO_CLAVE,
  type PrecioHistorialItem,
  type PrecioHistorialRow,
  type PrecioParametroClave,
} from "@/lib/domain/sistema-parametros";
import { createAdminClient } from "@/lib/supabase/admin";

type HistorialDbRow = {
  id: string;
  clave: string;
  precio: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  created_by: string | null;
  created_at: string;
};

export async function fetchPrecioHistorialByClave(
  clave: PrecioParametroClave,
): Promise<{
  items: PrecioHistorialItem[];
  error: string | null;
}> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sistema_precio_historial")
      .select("id, clave, precio, vigencia_desde, vigencia_hasta, created_by, created_at")
      .eq("clave", clave)
      .order("vigencia_desde", { ascending: false });

    if (error) {
      return { items: [], error: error.message };
    }

    const rows = (data ?? []) as HistorialDbRow[];
    const creatorIds = [...new Set(rows.map((row) => row.created_by).filter(Boolean))] as string[];

    const profilesById = new Map<string, { full_name: string | null; email: string }>();

    if (creatorIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", creatorIds);

      for (const profile of profiles ?? []) {
        profilesById.set(profile.id, {
          full_name: profile.full_name,
          email: profile.email,
        });
      }
    }

    const items = rows.map((row) => {
      const profile = row.created_by ? profilesById.get(row.created_by) : null;
      const normalized: PrecioHistorialRow = {
        id: row.id,
        clave: row.clave,
        precio: row.precio,
        vigencia_desde: row.vigencia_desde,
        vigencia_hasta: row.vigencia_hasta,
        created_by: row.created_by,
        created_at: row.created_at,
        creador_nombre: profile?.full_name ?? null,
        creador_email: profile?.email ?? null,
      };
      return buildPrecioHistorialItem(normalized);
    });

    return { items, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar parámetros";
    return { items: [], error: message };
  }
}

export async function fetchPrecioActivoByClave(clave: PrecioParametroClave): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sistema_precio_historial")
      .select("precio")
      .eq("clave", clave)
      .is("vigencia_hasta", null)
      .maybeSingle();

    if (error || !data) return 0;
    const precio = typeof data.precio === "number" ? data.precio : Number(data.precio);
    return Number.isFinite(precio) && precio >= 0 ? precio : 0;
  } catch {
    return 0;
  }
}

export function fetchPrecioBolsaExtraHistorial() {
  return fetchPrecioHistorialByClave(PRECIO_BOLSA_EXTRA_CLAVE);
}

export function fetchPrecioRetiroReciclableMixtoHistorial() {
  return fetchPrecioHistorialByClave(PRECIO_RETIRO_RECICLABLE_MIXTO_CLAVE);
}

export function fetchPrecioBolsaExtraActivo() {
  return fetchPrecioActivoByClave(PRECIO_BOLSA_EXTRA_CLAVE);
}

export function fetchPrecioRetiroReciclableMixtoActivo() {
  return fetchPrecioActivoByClave(PRECIO_RETIRO_RECICLABLE_MIXTO_CLAVE);
}

export function fetchPrecioBolsaPuntoHistorial() {
  return fetchPrecioHistorialByClave(PRECIO_BOLSA_PUNTO_CLAVE);
}

export function fetchPrecioBolsaLlenaPuntoHistorial() {
  return fetchPrecioHistorialByClave(PRECIO_BOLSA_LLENA_PUNTO_CLAVE);
}

export function fetchPrecioBolsaPuntoActivo() {
  return fetchPrecioActivoByClave(PRECIO_BOLSA_PUNTO_CLAVE);
}

export function fetchPrecioBolsaLlenaPuntoActivo() {
  return fetchPrecioActivoByClave(PRECIO_BOLSA_LLENA_PUNTO_CLAVE);
}
