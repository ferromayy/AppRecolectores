import Link from "next/link";

import { MisRutasCards } from "@/components/panel/recolector/mis-rutas-cards";
import { canManageUsers } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { formatRutaFecha } from "@/lib/domain/rutas";
import { isStaffRole } from "@/lib/domain/constants";
import { createClient } from "@/lib/supabase/server";

export default async function PanelHomePage() {
  const { user, profile } = await getSessionUser();
  const staff = profile && isStaffRole(profile.role);
  const isRecolector = profile?.role === "recolector";

  let rutasRecolector: Awaited<
    ReturnType<typeof fetchRutasRecolector>
  > = [];

  if (isRecolector && user) {
    rutasRecolector = await fetchRutasRecolector(user.id);
  }

  const rutasHoy = rutasRecolector.filter((r) => r.fecha === todayIso());

  if (isRecolector) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Hola, {profile?.full_name?.split(" ")[0] ?? "recolector"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rutasHoy.length > 0
              ? `Tenés ${rutasHoy.length} ruta(s) para hoy.`
              : "Revisá tus rutas asignadas."}
          </p>
        </div>

        {rutasHoy.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Hoy · {formatRutaFecha(todayIso())}
            </h2>
            <MisRutasCards rutas={rutasHoy} compact />
          </section>
        )}

        <Link
          href="/panel/mis-rutas"
          className="flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-emerald-700 px-4 text-base font-semibold text-white active:bg-emerald-800"
        >
          Ver todas mis rutas
        </Link>

        {rutasRecolector.length > rutasHoy.length && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Próximas / anteriores
            </h2>
            <MisRutasCards
              rutas={rutasRecolector.filter((r) => r.fecha !== todayIso()).slice(0, 3)}
              compact
            />
          </section>
        )}
      </div>
    );
  }

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

async function fetchRutasRecolector(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rutas")
    .select("*")
    .eq("asignado_a", userId)
    .order("fecha", { ascending: false })
    .limit(20);
  return data ?? [];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
