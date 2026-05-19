import Link from "next/link";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function ActualizarContrasenaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Nueva contraseña
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Definí tu nueva contraseña para continuar usando la app.
          </p>
        </div>
        <UpdatePasswordForm />
        <p className="text-center text-xs text-zinc-500">
          <Link href="/login" className="underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
