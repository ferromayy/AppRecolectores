/**
 * Cambia la contraseña del superadmin SIN usar correo/enlaces.
 *
 * Uso:
 *   node scripts/reset-superadmin-password.mjs "TuNuevaClave123"
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPERADMIN = "somos@ecolink.com.ar";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const newPassword = process.argv[2];

if (!newPassword || newPassword.length < 8) {
  console.error(
    'Uso: node scripts/reset-superadmin-password.mjs "ContraseñaMin8Chars"',
  );
  process.exit(1);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email) {
  const normalized = email.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (match) return match.id;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

async function main() {
  let userId = await findUserIdByEmail(SUPERADMIN);

  if (!userId) {
    console.log(`Usuario ${SUPERADMIN} no existe. Creando…`);
    const { data, error } = await admin.auth.admin.createUser({
      email: SUPERADMIN,
      password: newPassword,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error("Error al crear:", error?.message ?? "desconocido");
      process.exit(1);
    }

    userId = data.user.id;
    console.log("Usuario creado.");
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true,
    });

    if (error) {
      console.error("Error al actualizar contraseña:", error.message);
      process.exit(1);
    }

    console.log("Contraseña actualizada.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: SUPERADMIN,
      role: "superadmin",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.warn("Aviso perfil:", profileError.message);
  }

  console.log("");
  console.log("Listo. Entrá en /login con:");
  console.log(`  Email:    ${SUPERADMIN}`);
  console.log(`  Clave:    (la que acabas de definir)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
