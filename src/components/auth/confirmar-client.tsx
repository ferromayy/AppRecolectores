"use client";

import Link from "next/link";
import { Suspense, useState } from "react";

import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

function ConfirmarInner() {
  const [sessionReady, setSessionReady] = useState(false);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Activar cuenta
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Definí tu <strong>contraseña nueva</strong> (dos campos iguales). Después
          entrás en Iniciar sesión con tu correo y esa clave.
        </p>
      </div>

      <AuthHashHandler onSessionReady={() => setSessionReady(true)} />

      {!sessionReady && (
        <p className="text-center text-sm text-zinc-500">
          Abrí el enlace del correo en esta misma pestaña. Si venció, pedí uno nuevo
          al superadmin.
        </p>
      )}

      {sessionReady && (
        <>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Enlace válido. Guardá tu contraseña.
          </p>
          <UpdatePasswordForm />
        </>
      )}

      <p className="text-center text-xs text-zinc-500">
        ¿Ya activaste la cuenta?{" "}
        <Link href="/login" className="underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export function ConfirmarClient() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
      <ConfirmarInner />
    </Suspense>
  );
}
