import Link from "next/link";

import { canManageUsers } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/domain/constants";

export default async function PanelHomePage() {
  const { profile } = await getSessionUser();
  const staff = profile && isStaffRole(profile.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Panel operativo
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Bienvenido a App Recolectores.
        </p>
      </div>

      {(staff || (profile && canManageUsers(profile))) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff && (
            <DashboardCard
              title="Rutas"
              description="Planillas importadas desde Google Sheets y seguimiento operativo."
              href="/panel/rutas"
            />
          )}
          {profile && canManageUsers(profile) && (
            <DashboardCard
              title="Usuarios"
              description={
                profile.role === "superadmin"
                  ? "Crear admins y recolectores, y gestionar contraseñas."
                  : "Crear recolectores y gestionar sus contraseñas."
              }
              href="/panel/usuarios"
            />
          )}
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <span className="mt-4 inline-block text-sm font-medium text-emerald-700">
        Abrir →
      </span>
    </Link>
  );
}
