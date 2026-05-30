export function validatePasswordPair(
  password: string | undefined,
  confirm: string | undefined,
): { ok: true; password: string } | { ok: false; error: string } {
  const p = password?.trim() ?? "";
  const c = confirm?.trim() ?? "";

  if (p.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (p !== c) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }

  return { ok: true, password: p };
}
