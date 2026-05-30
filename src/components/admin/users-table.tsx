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

function ChangePasswordForm({
  userId,
  email,
  onDone,
  onCancel,
}: {
  userId: string;
  email: string;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        password_confirm: passwordConfirm,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    onDone(data.message);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
      <p className="text-xs text-zinc-600">
        Nueva contraseña para <strong>{email}</strong>
      </p>
      <input
        type="password"
        required
        minLength={8}
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        type="password"
        required
        minLength={8}
        placeholder="Confirmar contraseña"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-zinc-500 underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function UsersTable({ users, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
                <td className="px-4 py-3 align-top">{user.full_name ?? "—"}</td>
                <td className="px-4 py-3 align-top">{user.email}</td>
                <td className="px-4 py-3 align-top">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-3 align-top">
                  {editingId === user.id ? (
                    <ChangePasswordForm
                      userId={user.id}
                      email={user.email}
                      onDone={(msg) => {
                        setEditingId(null);
                        setFeedback(msg);
                        setError(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(user.id);
                        setFeedback(null);
                        setError(null);
                      }}
                      className="text-left text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
                    >
                      Cambiar contraseña
                    </button>
                  )}
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
