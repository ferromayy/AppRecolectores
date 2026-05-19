import Link from "next/link";

import { ConnectionStatus } from "@/components/connection-status";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            App Recolectores
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Plataforma logística interna
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Intermediación entre generadores de residuos, empresas, cooperativas
            de transformación y operaciones de recolección.
          </p>
        </div>

        <ConnectionStatus />

        <Link
          href="/login"
          className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Iniciar sesión
        </Link>

        <p className="max-w-md text-xs text-zinc-500">
          Stack: Next.js + TypeScript en Vercel · PostgreSQL en Supabase · API
          en rutas <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/api/*</code>
        </p>
      </main>
    </div>
  );
}
