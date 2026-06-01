"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OperarioRecoleccionFormModal } from "@/components/panel/operario/operario-recoleccion-form-modal";
import { OperarioRecoleccionesTable } from "@/components/panel/operario/operario-recolecciones-table";
import { OperarioConfirmDialog } from "@/components/panel/operario/operario-confirm-dialog";
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
  const [suspenderRutaId, setSuspenderRutaId] = useState<string | null>(null);
  const [suspendiendo, setSuspendiendo] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  const selectedRuta = rutas.find((r) => r.id === selectedRutaId) ?? null;
  const detalleRuta = rutas.find((r) => r.id === detalleRutaId) ?? null;
  const rutaASuspender = rutas.find((r) => r.id === suspenderRutaId) ?? null;
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

  async function handleConfirmSuspender() {
    if (!suspenderRutaId) return;

    setSuspendiendo(true);
    setSuspendError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${suspenderRutaId}/suspender`, {
        method: "POST",
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo suspender la ruta");
      }

      setSuspenderRutaId(null);
      refreshData();
    } catch (err) {
      setSuspendError(err instanceof Error ? err.message : "Error al suspender la ruta");
    } finally {
      setSuspendiendo(false);
    }
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
          onSuspender={setSuspenderRutaId}
          mapsDisponible={!!mapsApiKey}
        />
      </section>

      {suspendError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {suspendError}
        </p>
      )}

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
              disabled={selectedRuta.estado === "completada"}
              title={
                selectedRuta.estado === "completada"
                  ? "No se pueden agregar recolecciones a una ruta finalizada"
                  : undefined
              }
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
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
        onUpdated={refreshData}
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

      <OperarioConfirmDialog
        open={suspenderRutaId !== null}
        title="Suspender ruta"
        message={
          rutaASuspender
            ? `¿Suspender "${rutaASuspender.nombre}"? El recolector no podrá operarla hasta que la reactives.`
            : "¿Suspender esta ruta?"
        }
        confirmLabel="Suspender"
        destructive
        loading={suspendiendo}
        onConfirm={() => void handleConfirmSuspender()}
        onCancel={() => {
          setSuspenderRutaId(null);
          setSuspendError(null);
        }}
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
