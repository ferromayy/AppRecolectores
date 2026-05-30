"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type HashResult =
  | { type: "none" }
  | { type: "error"; message: string }
  | { type: "redirect"; path: string }
  | { type: "establish_session" };

function parseHash(): HashResult {
  if (typeof window === "undefined") return { type: "none" };

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return { type: "none" };

  const params = new URLSearchParams(hash);

  const error = params.get("error");
  const errorCode = params.get("error_code");
  const errorDescription = params.get("error_description");

  if (error || errorCode) {
    if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
      return {
        type: "error",
        message:
          "Este enlace ya venció o ya fue usado. Pedile al superadmin que te envíe uno nuevo desde Usuarios internos.",
      };
    }
    return {
      type: "error",
      message:
        errorDescription?.replace(/\+/g, " ") ??
        "No se pudo validar el enlace. Pedí una invitación nueva.",
    };
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    return { type: "establish_session" };
  }

  return { type: "none" };
}

type Props = {
  /** Después de validar tokens, navegar acá (ej. desde /login) */
  redirectAfterSession?: string;
  /** En la misma página (ej. /auth/confirmar), mostrar formulario */
  onSessionReady?: () => void;
};

export function AuthHashHandler({
  redirectAfterSession,
  onSessionReady,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const code = searchParams.get("code");
      if (code) {
        const next = encodeURIComponent(
          redirectAfterSession ?? "/auth/confirmar",
        );
        router.replace(`/auth/callback?code=${code}&next=${next}`);
        return;
      }

      const parsed = parseHash();

      if (parsed.type === "none") {
        setLoading(false);
        return;
      }

      if (parsed.type === "error") {
        setMessage(parsed.message);
        window.history.replaceState(null, "", window.location.pathname);
        setLoading(false);
        return;
      }

      if (parsed.type === "establish_session") {
        const hash = window.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);

        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: params.get("access_token"),
            refresh_token: params.get("refresh_token"),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage(data.error ?? "No se pudo validar el enlace");
          setLoading(false);
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);

        if (redirectAfterSession) {
          router.replace(redirectAfterSession);
          return;
        }

        onSessionReady?.();
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    void run();
  }, [router, searchParams, redirectAfterSession, onSessionReady]);

  if (loading) {
    return (
      <p className="text-center text-sm text-zinc-500" role="status">
        Validando enlace…
      </p>
    );
  }

  if (message) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        {message}
      </p>
    );
  }

  return null;
}
