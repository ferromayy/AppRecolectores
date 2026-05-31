"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OperarioRecoleccionFormModal } from "@/components/panel/operario/operario-recoleccion-form-modal";
import { OperarioRecoleccionesTable } from "@/components/panel/operario/operario-recolecciones-table";
import { OperarioRutaDetalleModal } from "@/components/panel/operario/operario-ruta-detalle-modal";
import { OperarioRutaFormModal } from "@/components/panel/operario/operario-ruta-form-modal";
import { OperarioRutaMapModal } from "@/components/panel/operario/operario-ruta-map-modal";
import { OperarioRutasTable } from "@/components/panel/operario/operario-rutas-table";
import {
  buildRutaDetalle,
  pickDefaultRutaId,
  type RecolectorOption,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";

type Props = {
  rutas: RutaOperarioRow[];
  recolecciones: RecoleccionOperarioRow[];
  recolectores: RecolectorOption[];
  operarioNombre: string;
  mapsApiKey: string | null;
};

export function OperarioDashboard({
  rutas,
  recolecciones,
  recolectores,
  operarioNombre,
  mapsApiKey,
}: Props) {
  const router = useRouter();
  const defaultId = useMemo(() => pickDefaultRutaId(rutas), [rutas]);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(defaultId);
  const [detalleRutaId, setDetalleRutaId] = useState<string | null>(null);
  const [mapaRutaId, setMapaRutaId] = useState<string | null>(null);
  const [editRutaId, setEditRutaId] = useState<string | null>(null);
  const [editRecoleccionId, setEditRecoleccionId] = useState<string | null>(null);
  const [creatingRecoleccion, setCreatingRecoleccion] = useState(false);

  const selectedRuta = rutas.find((r) => r.id === selectedRutaId) ?? null;
  const detalleRuta = rutas.find((r) => r.id === detalleRutaId) ?? null;
  const mapaRuta = rutas.find((r) => r.id === mapaRutaId) ?? null;
  const editRuta = rutas.find((r) => r.id === editRutaId) ?? null;
  const editRecoleccion = recolecciones.find((r) => r.id === editRecoleccionId) ?? null;
  const recoleccionesRuta = useMemo(
    () => recolecciones.filter((r) => r.ruta_id === selectedRutaId),
    [recolecciones, selectedRutaId],
  );
  const detalle = detalleRuta ? buildRutaDetalle(detalleRuta) : null;

  function refreshData() {
    router.refresh();
  }

  function handleRutaDeleted(rutaId: string) {
    if (selectedRutaId === rutaId) setSelectedRutaId(null);
    if (mapaRutaId === rutaId) setMapaRutaId(null);
    if (detalleRutaId === rutaId) setDetalleRutaId(null);
    refreshData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Panel operativo
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Seguimiento de rutas, recolecciones y cierre de jornada.
        </p>
      </div>

      <section className="space-y-3">
        <SectionTitle title="Ruta" subtitle="Seleccioná una fila para ver sus recolecciones" />
        <OperarioRutasTable
          rutas={rutas}
          selectedRutaId={selectedRutaId}
          onSelect={setSelectedRutaId}
          onVerDetalle={setDetalleRutaId}
          onVerMapa={(id) => {
            setMapaRutaId(id);
            setSelectedRutaId(id);
          }}
          onEditar={setEditRutaId}
          mapsDisponible={!!mapsApiKey}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle
            title="Recolecciones"
            subtitle={
              selectedRuta
                ? `${selectedRuta.nombre} · ${recoleccionesRuta.length} parada(s)`
                : "Seleccioná una ruta"
            }
          />
          {selectedRuta && (
            <button
              type="button"
              onClick={() => setCreatingRecoleccion(true)}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              + Agregar recolección
            </button>
          )}
        </div>
        <OperarioRecoleccionesTable
          recolecciones={recoleccionesRuta}
          rutaSeleccionada={!!selectedRuta}
          onEditar={setEditRecoleccionId}
        />
      </section>

      <OperarioRutaDetalleModal
        open={detalleRutaId !== null}
        detalle={detalle}
        operarioNombre={operarioNombre}
        onClose={() => setDetalleRutaId(null)}
      />

      <OperarioRutaMapModal
        open={mapaRutaId !== null}
        rutaId={mapaRutaId}
        rutaNombre={mapaRuta?.nombre ?? null}
        mapsApiKey={mapsApiKey}
        onClose={() => setMapaRutaId(null)}
        onOrderChange={refreshData}
      />

      <OperarioRutaFormModal
        open={editRutaId !== null}
        ruta={editRuta}
        recolectores={recolectores}
        onClose={() => setEditRutaId(null)}
        onSaved={refreshData}
        onDeleted={handleRutaDeleted}
      />

      <OperarioRecoleccionFormModal
        open={creatingRecoleccion}
        mode="create"
        recoleccion={null}
        createTarget={
          selectedRuta
            ? { ruta: selectedRuta, nextOrden: recoleccionesRuta.length + 1 }
            : null
        }
        onClose={() => setCreatingRecoleccion(false)}
        onSaved={refreshData}
        onDeleted={refreshData}
      />

      <OperarioRecoleccionFormModal
        open={editRecoleccionId !== null}
        mode="edit"
        recoleccion={editRecoleccion}
        createTarget={null}
        onClose={() => setEditRecoleccionId(null)}
        onSaved={refreshData}
        onDeleted={refreshData}
      />
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {subtitle && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
    </div>
  );
}
