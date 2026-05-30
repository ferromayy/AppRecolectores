"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Completa el flujo del correo de invitación:
 * - ?code=... → intercambio vía /auth/callback
 * - #access_token=... → sesión vía API (sin cliente Supabase en browser)
 */
export function InviteLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const code = searchParams.get("code");
      if (code) {
        const next = encodeURIComponent("/auth/confirmar");
        router.replace(`/auth/callback?code=${code}&next=${next}`);
        return;
      }

      const hash = window.location.hash.replace(/^#/, "");
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setStatus("error");
          setMessage("Enlace incompleto. Pedí una nueva invitación al superadmin.");
          return;
        }

        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "No se pudo validar el enlace");
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);
        setStatus("ready");
        return;
      }

      setStatus("ready");
    }

    void run();
  }, [router, searchParams]);

  if (status === "loading") {
    return (
      <p className="text-center text-sm text-zinc-500" role="status">
        Validando invitación…
      </p>
    );
  }

  if (status === "error" && message) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {message}
      </p>
    );
  }

  return null;
}
