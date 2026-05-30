import type { SupabaseClient } from "@supabase/supabase-js";

import { findAuthUserIdByEmail } from "@/lib/auth/auth-links";
import type { Database } from "@/types/database";

export async function upsertAuthUserWithPassword(
  admin: SupabaseClient<Database>,
  email: string,
  password: string,
  metadata?: { full_name?: string },
) {
  const existingId = await findAuthUserIdByEmail(admin, email);

  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
      user_metadata: metadata ?? {},
    });

    if (error) {
      return { error: error.message };
    }

    return { userId: existingId, alreadyExisted: true };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata ?? {},
  });

  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear el usuario" };
  }

  return { userId: data.user.id, alreadyExisted: false };
}

export async function setUserPassword(
  admin: SupabaseClient<Database>,
  userId: string,
  password: string,
) {
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const };
}
