"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  ORGANIZACION_TIPOS,
  type OrganizacionTipo,
} from "@/lib/domain/constants";

export type OrganizacionFormState = { error?: string; success?: string };

export async function createOrganizacionAction(
  _prev: OrganizacionFormState,
  formData: FormData,
): Promise<OrganizacionFormState> {
  const auth = await requireStaff();
  if (!auth.ok) return { error: auth.message };

  const tipo = String(formData.get("tipo") ?? "") as OrganizacionTipo;
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!ORGANIZACION_TIPOS.includes(tipo) || !nombre) {
    return { error: "Completá tipo y nombre" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizaciones").insert({
    tipo,
    nombre,
    contacto_email: String(formData.get("contacto_email") ?? "").trim() || null,
    contacto_telefono:
      String(formData.get("contacto_telefono") ?? "").trim() || null,
    direccion: String(formData.get("direccion") ?? "").trim() || null,
    notas: String(formData.get("notas") ?? "").trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/panel/organizaciones");
  return { success: "Organización creada" };
}
