"use client";

import { useState } from "react";

import { CREATABLE_ROLES, ROLE_LABELS } from "@/lib/auth/constants";

type Props = {
  onCreated: () => void;
};

export function CreateUserForm({ onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof CREATABLE_ROLES)[number]>("admin");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: fullName, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el usuario");
      return;
    }

    setMessage(data.message);
    setEmail("");
    setFullName("");
    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        Crear usuario
      </h2>
      <p className="text-sm text-zinc-500">
        Solo el superadmin puede dar de alta admins y recolectores. Se envía un
        correo de invitación para definir la contraseña.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="full_name" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="role" className="text-sm font-medium">
            Rol
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as (typeof CREATABLE_ROLES)[number])
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {CREATABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Creando…" : "Crear y enviar invitación"}
      </button>
    </form>
  );
}
