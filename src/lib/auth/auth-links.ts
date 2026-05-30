import { getSiteUrl } from "@/lib/auth/site-url";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

function extractActionLink(data: {
  properties?: { action_link?: string };
  action_link?: string;
}) {
  return data.properties?.action_link ?? data.action_link ?? null;
}

export function isAlreadyRegisteredError(message: string) {
  return /already.*registered|already been registered|user already exists/i.test(
    message,
  );
}

export function buildInviteRedirectUrl() {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/confirmar")}`;
}

export function buildRecoveryRedirectUrl() {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/actualizar-contrasena")}&type=recovery`;
}

/** Busca usuario en Auth por email (paginado). */
export async function findAuthUserIdByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      return null;
    }

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      break;
    }
    page += 1;
  }

  return null;
}

export async function generateInviteLink(
  admin: SupabaseClient<Database>,
  email: string,
  metadata?: { full_name?: string },
) {
  const redirectTo = buildInviteRedirectUrl();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo,
      data: metadata,
    },
  });

  if (error) {
    return { error: error.message };
  }

  const link = extractActionLink(data);
  if (!link) {
    return { error: "No se pudo generar el enlace de invitación" };
  }

  return { link, userId: data.user?.id };
}

/** Para usuarios que ya existen en Auth: enlace para definir contraseña. */
export async function generateSetupPasswordLink(
  admin: SupabaseClient<Database>,
  email: string,
) {
  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/confirmar")}&type=recovery`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  const link = extractActionLink(data);
  if (!link) {
    return { error: "No se pudo generar el enlace" };
  }

  return { link, userId: data.user?.id };
}

export async function generateInviteOrSetupLink(
  admin: SupabaseClient<Database>,
  email: string,
  metadata?: { full_name?: string },
) {
  const invite = await generateInviteLink(admin, email, metadata);

  if (!invite.error) {
    return { ...invite, reusedExistingAuth: false };
  }

  if (!isAlreadyRegisteredError(invite.error)) {
    return invite;
  }

  const userId = await findAuthUserIdByEmail(admin, email);
  const setup = await generateSetupPasswordLink(admin, email);

  if (setup.error || !setup.link) {
    return { error: setup.error ?? invite.error };
  }

  return {
    link: setup.link,
    userId: setup.userId ?? userId ?? undefined,
    reusedExistingAuth: true,
  };
}

export async function generateRecoveryLink(
  admin: SupabaseClient<Database>,
  email: string,
) {
  const redirectTo = buildRecoveryRedirectUrl();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  const link = extractActionLink(data);
  if (!link) {
    return { error: "No se pudo generar el enlace de recuperación" };
  }

  return { link };
}

/** Crea usuario en Auth o devuelve el id si ya existe. */
export async function ensureAuthUser(
  admin: SupabaseClient<Database>,
  email: string,
  metadata?: { full_name?: string },
) {
  const existingId = await findAuthUserIdByEmail(admin, email);
  if (existingId) {
    return { userId: existingId, alreadyExisted: true };
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: metadata ?? {},
    });

  if (!createError && created.user) {
    return { userId: created.user.id, alreadyExisted: false };
  }

  if (createError && isAlreadyRegisteredError(createError.message)) {
    const userId = await findAuthUserIdByEmail(admin, email);
    if (userId) {
      return { userId, alreadyExisted: true };
    }
  }

  return { error: createError?.message ?? "No se pudo crear el usuario" };
}
