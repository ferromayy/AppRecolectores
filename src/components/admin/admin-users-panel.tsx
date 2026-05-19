"use client";

import { useCallback, useEffect, useState } from "react";

import { CreateUserForm } from "@/components/admin/create-user-form";
import {
  UsersTable,
  type AdminUserRow,
} from "@/components/admin/users-table";

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo cargar la lista");
      return;
    }

    setUsers(data.users ?? []);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <CreateUserForm onCreated={loadUsers} />
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Usuarios internos
        </h2>
        {loading && <p className="text-sm text-zinc-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <UsersTable users={users} onRefresh={loadUsers} />
        )}
      </div>
    </div>
  );
}
