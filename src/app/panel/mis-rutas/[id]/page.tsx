import { notFound, redirect } from "next/navigation";

import { RecolectorRutaDetalle } from "@/components/panel/recolector/recolector-ruta-detalle";
import { requireAuth } from "@/lib/auth/session";
import {
  buildRecolectorRecoleccionDetalle,
  buildRecolectorRecoleccionPreview,
  buildRecolectorRutaDetalle,
  buildDireccionesMapsActivas,
} from "@/lib/domain/recolector-ruta";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function MisRutaDetallePage({ params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/mis-rutas");
  }

  if (auth.profile.role !== "recolector") {
    redirect("/panel");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: ruta, error } = await supabase
    .from("rutas")
    .select("*")
    .eq("id", id)
    .eq("asignado_a", auth.user.id)
    .maybeSingle();

  if (error || !ruta) {
    notFound();
  }

  const { data: recolecciones } = await supabase
    .from("ruta_recolecciones")
    .select("*")
    .eq("ruta_id", id)
    .order("orden", { ascending: true });

  const items = recolecciones ?? [];
  const rutaDetalle = buildRecolectorRutaDetalle(ruta, items);
  const preview = items.map(buildRecolectorRecoleccionPreview);
  const detalle = items.map(buildRecolectorRecoleccionDetalle);
  const direccionesMaps = buildDireccionesMapsActivas(items);

  return (
    <RecolectorRutaDetalle
      ruta={rutaDetalle}
      recolectorNombre={auth.profile.full_name ?? ""}
      recoleccionesPreview={preview}
      recoleccionesDetalle={detalle}
      direccionesMaps={direccionesMaps}
    />
  );
}
