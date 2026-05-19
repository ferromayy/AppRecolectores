import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { SUPERADMIN_EMAIL } from "@/lib/auth/constants";
import { requireSuperadmin } from "@/lib/auth/session";

export default async function AdminUsuariosPage() {
  const auth = await requireSuperadmin();

  if (!auth.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-red-600">
          Acceso denegado.{" "}
          <Link href="/login" className="underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
              Superadmin
            </p>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Gestión de usuarios
            </h1>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Cuenta superadmin: <strong>{SUPERADMIN_EMAIL}</strong>. Solo vos podés
          crear admins y recolectores, y enviar el correo para que cambien su
          contraseña.
        </p>
        <AdminUsersPanel />
      </main>
    </div>
  );
}
