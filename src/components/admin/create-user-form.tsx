"use client";

import { useState } from "react";

import { ROLE_LABELS, type UserRole } from "@/lib/auth/constants";

type Props = {
  creatableRoles: UserRole[];
  onCreated: () => void;
};

export function CreateUserForm({ creatableRoles, onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<UserRole>(creatableRoles[0] ?? "recolector");
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
      body: JSON.stringify({
        email,
        full_name: fullName,
        role,
        password,
        password_confirm: passwordConfirm,
      }),
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
    setPassword("");
    setPasswordConfirm("");
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
        Definís la contraseña inicial acá. El usuario entra en{" "}
        <strong>/login</strong> con su correo y esa clave (comunicásela por un
        canal seguro).
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
        {creatableRoles.length > 1 && (
          <div className="space-y-1">
            <label htmlFor="role" className="text-sm font-medium">
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña inicial
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="password_confirm" className="text-sm font-medium">
            Confirmar contraseña
          </label>
          <input
            id="password_confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
