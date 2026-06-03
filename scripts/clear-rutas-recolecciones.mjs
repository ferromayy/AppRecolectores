/**
 * Borra todas las rutas y sus recolecciones/paradas (CASCADE).
 * No toca usuarios, perfiles ni sistema_parametros.
 *
 * Uso: node scripts/clear-rutas-recolecciones.mjs
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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

async function count(table) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function deleteAll(table) {
  const { error } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const antes = {
    rutas: await count("rutas"),
    recolecciones: await count("ruta_recolecciones"),
    paradas: await count("ruta_paradas").catch(() => 0),
  };

  console.log("Antes:", antes);

  await deleteAll("rutas");

  const despues = {
    rutas: await count("rutas"),
    recolecciones: await count("ruta_recolecciones"),
    paradas: await count("ruta_paradas").catch(() => 0),
  };

  console.log("Después:", despues);
  console.log("Listo: rutas y recolecciones en blanco.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
