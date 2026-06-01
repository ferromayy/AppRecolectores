import { notFound, redirect } from "next/navigation";

import { RecolectorFinalizarRutaForm } from "@/components/panel/recolector/recolector-finalizar-ruta-form";
import { requireAuth } from "@/lib/auth/session";
import { buildRecolectorRutaDetalle } from "@/lib/domain/recolector-ruta";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function FinalizarRutaPage({ params }: Props) {
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

  if (error || !ruta) notFound();

  if (ruta.estado !== "en_curso") {
    redirect(`/panel/mis-rutas/${id}`);
  }

  const { data: recolecciones } = await supabase
    .from("ruta_recolecciones")
    .select("*")
    .eq("ruta_id", id);

  const items = recolecciones ?? [];
  const rutaDetalle = buildRecolectorRutaDetalle(ruta, items);

  if (!rutaDetalle.puedeFinalizar) {
    redirect(`/panel/mis-rutas/${id}`);
  }

  return (
    <RecolectorFinalizarRutaForm
      rutaId={rutaDetalle.id}
      rutaNombre={rutaDetalle.nombre}
      kmInicial={rutaDetalle.kmInicial}
      efectivoRecaudado={rutaDetalle.efectivoRecaudado}
    />
  );
}

