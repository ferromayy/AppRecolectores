"use client";

import { useState } from "react";

import { ROLE_LABELS, type UserRole } from "@/lib/auth/constants";

export type AdminUserRow = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
};

type Props = {
  users: AdminUserRow[];
  onRefresh: () => void;
};

export function UsersTable({ users, onRefresh }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendPasswordReset(userId: string) {
    setLoadingId(userId);
    setFeedback(null);
    setError(null);

    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
    });
    const data = await res.json();
    setLoadingId(null);

    if (!res.ok) {
      setError(data.error ?? "No se pudo enviar el correo");
      return;
    }

    setFeedback(data.message);
  }

  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Todavía no hay admins ni recolectores. Creá el primero con el formulario.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{user.full_name ?? "—"}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={loadingId === user.id}
                    onClick={() => sendPasswordReset(user.id)}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50 dark:text-emerald-400"
                  >
                    {loadingId === user.id
                      ? "Enviando…"
                      : "Enviar correo para cambiar contraseña"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="text-sm text-zinc-500 underline hover:text-zinc-700"
      >
        Actualizar lista
      </button>
    </div>
  );
}
