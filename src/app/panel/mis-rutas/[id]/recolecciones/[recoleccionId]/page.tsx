import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RecolectorRecoleccionCampoForm } from "@/components/panel/recolector/recolector-recoleccion-campo-form";
import { requireAuth } from "@/lib/auth/session";
import { buildRecoleccionCampoFormData } from "@/lib/domain/recolector-recoleccion-form";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; recoleccionId: string }> };

export default async function RecolectorRecoleccionCampoPage({ params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/mis-rutas");
  }

  if (auth.profile.role !== "recolector") {
    redirect("/panel");
  }

  const { id: rutaId, recoleccionId } = await params;
  const supabase = await createClient();

  const { data: ruta } = await supabase
    .from("rutas")
    .select("id, nombre, asignado_a, estado")
    .eq("id", rutaId)
    .eq("asignado_a", auth.user.id)
    .maybeSingle();

  if (!ruta) notFound();

  if (ruta.estado !== "en_curso") {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Iniciá la ruta antes de cargar recolecciones.
        </p>
        <Link
          href={`/panel/mis-rutas/${rutaId}`}
          className="inline-flex min-h-[3rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Volver a la ruta
        </Link>
      </div>
    );
  }

  const { data: recoleccion } = await supabase
    .from("ruta_recolecciones")
    .select("*")
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId)
    .maybeSingle();

  if (!recoleccion) notFound();

  const formData = buildRecoleccionCampoFormData(rutaId, recoleccion);

  return <RecolectorRecoleccionCampoForm data={formData} rutaNombre={ruta.nombre} />;
}
