"use server";

import { redirect } from "next/navigation";

import { SUPERADMIN_EMAIL } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá correo y contraseña" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "No se pudo iniciar sesión" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (
    email === SUPERADMIN_EMAIL.toLowerCase() &&
    profile?.role === "superadmin"
  ) {
    redirect("/panel");
  }

  if (profile?.role === "admin" || profile?.role === "recolector") {
    redirect("/panel");
  }

  await supabase.auth.signOut();
  return {
    error:
      "Tu cuenta no tiene un perfil activo. Pedile al superadmin que te cree o reenvíe la invitación.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
