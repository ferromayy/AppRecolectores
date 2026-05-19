import { createClient } from "@/lib/supabase/server";
import { SUPERADMIN_EMAIL, type UserRole } from "@/lib/auth/constants";

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile as Profile | null,
  };
}

export async function requireSuperadmin() {
  const { user, profile } = await getSessionUser();

  if (!user) {
    return { ok: false as const, status: 401, message: "No autenticado" };
  }

  const emailMatches =
    user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
  const roleMatches = profile?.role === "superadmin";

  if (!emailMatches || !roleMatches) {
    return {
      ok: false as const,
      status: 403,
      message: "Solo el superadmin puede realizar esta acción",
    };
  }

  return { ok: true as const, user, profile: profile! };
}
