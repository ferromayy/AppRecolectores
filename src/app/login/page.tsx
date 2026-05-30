import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { LoginHashHandler } from "@/app/login/login-extras";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string; mensaje?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  sin_permiso: "No tenés permiso para acceder a esa sección.",
  auth_callback:
    "No se pudo validar el enlace del correo. Pedile al superadmin un enlace nuevo.",
  link_expired:
    "El enlace del correo venció o ya se usó. Pedile al superadmin que reenvíe la invitación.",
};

const INFO_MESSAGES: Record<string, string> = {
  contrasena_activada:
    "Contraseña guardada. Ya podés iniciar sesión con tu correo y la nueva clave.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const bannerError = params.error
    ? ERROR_MESSAGES[params.error] ?? params.error
    : undefined;
  const bannerInfo = params.mensaje
    ? INFO_MESSAGES[params.mensaje] ?? params.mensaje
    : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            App Recolectores
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Iniciar sesión
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Acceso interno para superadmin, administradores y recolectores.
          </p>
        </div>

        {bannerInfo && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            {bannerInfo}
          </p>
        )}

        <LoginHashHandler />

        {bannerError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {bannerError}
          </p>
        )}

        <LoginForm />

        <p className="text-center text-xs text-zinc-500">
          Superadmin:{" "}
          <span className="font-medium">somos@ecolink.com.ar</span>
          <br />
          <Link href="/" className="underline hover:text-zinc-700">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
