"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type PasswordFormState = {
  error?: string;
  success?: boolean;
};

export async function updatePasswordAction(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "No hay sesión activa. Abrí de nuevo el enlace del correo de invitación.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  redirect("/login?mensaje=contrasena_activada");
}
