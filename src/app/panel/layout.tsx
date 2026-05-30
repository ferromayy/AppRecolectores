import { redirect } from "next/navigation";

import { PanelShell } from "@/components/panel/panel-shell";
import { getSessionUser } from "@/lib/auth/session";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSessionUser();

  if (!user || !profile) {
    redirect("/login?next=/panel");
  }

  return (
    <PanelShell
      role={profile.role}
      userName={profile.full_name || user.email || "Usuario"}
    >
      {children}
    </PanelShell>
  );
}
