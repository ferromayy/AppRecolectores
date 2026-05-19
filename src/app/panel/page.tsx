import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { ROLE_LABELS } from "@/lib/auth/constants";
import { getSessionUser } from "@/lib/auth/session";

export default async function PanelPage() {
  const { user, profile } = await getSessionUser();

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Link href="/login" className="text-sm underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-700">
            Panel
          </p>
          <h1 className="text-2xl font-semibold">
            Hola, {profile.full_name || user.email}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Rol: {ROLE_LABELS[profile.role]}
          </p>
        </div>
        <p className="text-sm text-zinc-500">
          Próximamente: módulos según tu rol (recolecciones, asignaciones, etc.).
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
