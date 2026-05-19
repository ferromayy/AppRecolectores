"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  supabase: string;
};

type DbStatusResponse = {
  connected: boolean;
  error?: string;
  hint?: string;
};

export function ConnectionStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [db, setDb] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [healthRes, dbRes] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/db/status"),
        ]);
        setHealth(await healthRes.json());
        setDb(await dbRes.json());
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500" role="status">
        Verificando conexiones…
      </p>
    );
  }

  const supabaseOk = db?.connected === true;
  const envOk = health?.supabase === "configured";

  return (
    <div className="w-full max-w-md space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
        Estado de conexión
      </h2>
      <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
        <li className="flex items-center justify-between gap-4">
          <span>API Next.js (Vercel)</span>
          <StatusBadge ok={health?.status === "ok"} label="Activa" />
        </li>
        <li className="flex items-center justify-between gap-4">
          <span>Variables Supabase</span>
          <StatusBadge ok={envOk} label={envOk ? "Configuradas" : "Faltan"} />
        </li>
        <li className="flex items-center justify-between gap-4">
          <span>Supabase (Postgres + Auth)</span>
          <StatusBadge
            ok={supabaseOk}
            label={supabaseOk ? "Conectado" : "Sin conexión"}
          />
        </li>
      </ul>
      {!envOk && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          En <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">.env.local</code>{" "}
          definí <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          y{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
          (o <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">_ANON_KEY</code>
          ). Reiniciá <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">npm run dev</code>{" "}
          después de editar el archivo.
        </p>
      )}
      {envOk && !supabaseOk && db?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{db.error}</p>
      )}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {label}
    </span>
  );
}
