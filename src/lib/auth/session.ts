import { createClient } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/domain/constants";
import { canManageUsers, isSuperadminUser } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/constants";

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

export async function requireAuth() {
  const { user, profile } = await getSessionUser();

  if (!user || !profile) {
    return { ok: false as const, status: 401, message: "No autenticado" };
  }

  return { ok: true as const, user, profile };
}

export async function requireStaff() {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  if (!isStaffRole(auth.profile.role)) {
    return {
      ok: false as const,
      status: 403,
      message: "Solo administradores pueden acceder",
    };
  }

  return auth;
}

export async function requireUserManager() {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  if (!canManageUsers(auth.profile)) {
    return {
      ok: false as const,
      status: 403,
      message: "No tenés permiso para gestionar usuarios",
    };
  }

  return auth;
}

export async function requireSuperadmin() {
  const { user, profile } = await getSessionUser();

  if (!user) {
    return { ok: false as const, status: 401, message: "No autenticado" };
  }

  if (!isSuperadminUser(profile, user.email)) {
    return {
      ok: false as const,
      status: 403,
      message: "Solo el superadmin puede realizar esta acción",
    };
  }

  return { ok: true as const, user, profile: profile! };
}
