/**
 * Borra usuarios de Auth (y perfiles en cascada) excepto somos@ecolink.com.ar
 * Uso: node scripts/reset-users-except-superadmin.mjs
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

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllUsers() {
  const all = [];
  let page = 1;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 200) break;
    page += 1;
  }
  return all;
}

async function main() {
  const users = await listAllUsers();
  const toDelete = users.filter(
    (u) => u.email?.toLowerCase() !== SUPERADMIN.toLowerCase(),
  );

  if (toDelete.length === 0) {
    console.log("No hay usuarios para borrar (solo queda el superadmin o ninguno).");
    return;
  }

  console.log(`Se borrarán ${toDelete.length} usuario(s):`);
  for (const u of toDelete) {
    console.log(`  - ${u.email}`);
  }

  for (const u of toDelete) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) {
      console.error(`Error borrando ${u.email}:`, error.message);
    } else {
      console.log(`OK borrado: ${u.email}`);
    }
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("email, role")
    .order("email");

  console.log("\nPerfiles restantes:");
  for (const p of profiles ?? []) {
    console.log(`  - ${p.email} (${p.role})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
