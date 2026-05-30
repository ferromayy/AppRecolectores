"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { RECOLECCION_ESTADOS, type RecoleccionEstado } from "@/lib/domain/constants";

export type RecoleccionFormState = { error?: string; success?: string };

export async function createRecoleccionAction(
  _prev: RecoleccionFormState,
  formData: FormData,
): Promise<RecoleccionFormState> {
  const auth = await requireStaff();
  if (!auth.ok) return { error: auth.message };

  const organizacionId = String(formData.get("organizacion_id") ?? "");
  const direccion = String(formData.get("direccion") ?? "").trim();
  const asignadoA = String(formData.get("asignado_a") ?? "").trim() || null;
  const cooperativaId =
    String(formData.get("cooperativa_id") ?? "").trim() || null;
  const programadaPara =
    String(formData.get("programada_para") ?? "").trim() || null;

  if (!organizacionId || !direccion) {
    return { error: "Elegí generador y completá la dirección" };
  }

  const estado: RecoleccionEstado = asignadoA ? "asignada" : "solicitada";

  const supabase = await createClient();
  const { error } = await supabase.from("recolecciones").insert({
    organizacion_id: organizacionId,
    cooperativa_id: cooperativaId,
    asignado_a: asignadoA,
    direccion,
    programada_para: programadaPara,
    notas: String(formData.get("notas") ?? "").trim() || null,
    estado,
    created_by: auth.profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/panel/recolecciones");
  revalidatePath("/panel/mis-recolecciones");
  return { success: "Recolección creada" };
}

export async function updateRecoleccionEstadoAction(
  recoleccionId: string,
  estado: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  if (!RECOLECCION_ESTADOS.includes(estado as RecoleccionEstado)) {
    return { error: "Estado inválido" };
  }

  const { error } = await supabase
    .from("recolecciones")
    .update({ estado: estado as RecoleccionEstado })
    .eq("id", recoleccionId);

  if (error) return { error: error.message };

  revalidatePath("/panel/recolecciones");
  revalidatePath("/panel/mis-recolecciones");
  return {};
}
