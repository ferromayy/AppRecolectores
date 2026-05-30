import { redirect } from "next/navigation";

import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { SUPERADMIN_EMAIL } from "@/lib/auth/constants";
import { creatableRolesFor } from "@/lib/auth/permissions";
import { requireUserManager } from "@/lib/auth/session";

export default async function PanelUsuariosPage() {
  const auth = await requireUserManager();

  if (!auth.ok) {
    redirect("/panel");
  }

  const { profile } = auth;
  const creatableRoles = creatableRolesFor(profile.role);
  const isSuperadmin = profile.role === "superadmin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Gestión de usuarios
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {isSuperadmin ? (
            <>
              Como superadmin ({SUPERADMIN_EMAIL}) podés crear admins y
              recolectores, y cambiar sus contraseñas.
            </>
          ) : (
            <>
              Como admin podés crear recolectores y cambiar sus contraseñas.
            </>
          )}
        </p>
      </div>
      <AdminUsersPanel creatableRoles={[...creatableRoles]} />
    </div>
  );
}
