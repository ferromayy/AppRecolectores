"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  type RecoleccionCampoFormData,
} from "@/lib/domain/recolector-recoleccion-form";
import { formatPrecioDisplay } from "@/lib/domain/recolector-recoleccion-campo";

type Props = {
  data: RecoleccionCampoFormData;
  rutaNombre: string;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function RecolectorRecoleccionCampoForm({ data, rutaNombre }: Props) {
  const router = useRouter();
  const [motivoCancelacion, setMotivoCancelacion] = useState(data.motivoCancelacion);
  const [bolsasLlenas, setBolsasLlenas] = useState(data.bolsasLlenas);
  const [biotachosLlenos, setBiotachosLlenos] = useState(data.biotachosLlenos);
  const [bolsasNuevas, setBolsasNuevas] = useState(data.bolsasNuevas);
  const [biotachosNuevos, setBiotachosNuevos] = useState(data.biotachosNuevos);
  const [montoEfectivo, setMontoEfectivo] = useState(data.montoEfectivo);
  const [montoTransferencia, setMontoTransferencia] = useState(data.montoTransferencia);
  const [montoQr, setMontoQr] = useState(data.montoQr);
  const [nombreFirmante, setNombreFirmante] = useState(data.nombreFirmante);
  const [firmaConfirmada, setFirmaConfirmada] = useState(data.firmaConfirmada);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const esCancelacion = motivoCancelacion.trim().length > 0;
  const precioTotalLabel = useMemo(
    () => formatPrecioDisplay(data.precioRetiro),
    [data.precioRetiro],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/recolector/rutas/${data.rutaId}/recolecciones/${data.id}/campo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivo_cancelacion: motivoCancelacion.trim() || null,
            bolsas_llenas: bolsasLlenas === "" ? null : Number.parseInt(bolsasLlenas, 10),
            biotachos_llenos:
              biotachosLlenos === "" ? null : Number.parseInt(biotachosLlenos, 10),
            bolsas_nuevas: bolsasNuevas === "" ? null : Number.parseInt(bolsasNuevas, 10),
            biotachos_nuevos:
              biotachosNuevos === "" ? null : Number.parseInt(biotachosNuevos, 10),
            monto_efectivo: montoEfectivo.trim() === "" ? null : Number(montoEfectivo),
            monto_transferencia:
              montoTransferencia.trim() === "" ? null : Number(montoTransferencia),
            monto_qr: montoQr.trim() === "" ? null : Number(montoQr),
            nombre_firmante: nombreFirmante.trim(),
            firma_confirmada: firmaConfirmada,
          }),
        },
      );
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo guardar");
      }

      router.push(`/panel/mis-rutas/${data.rutaId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <Link
        href={`/panel/mis-rutas/${data.rutaId}`}
        className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ← Volver a la ruta
      </Link>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Recolección #{data.orden} · {rutaNombre}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Carga en campo
        </h1>
        {data.completada && (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            Ya cargada ({data.estadoLabel}). Podés actualizar los datos.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Datos del cliente
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <ReadOnlyRow label="Dirección" value={data.direccion} />
            <ReadOnlyRow label="Cliente" value={data.nombre} />
            <ReadOnlyRow label="Hora programada" value={data.horaProgramada} />
            <ReadOnlyRow label="Observaciones" value={data.observaciones || "—"} />
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Motivo de cancelación
            </span>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Si completás esto, solo necesitás firmar (sin cargar bolsas ni pagos)"
              className={`${inputClass} min-h-[88px] resize-y`}
            />
          </label>
        </section>

        {!esCancelacion && (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Retiro
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bolsas llenas *" value={bolsasLlenas} onChange={setBolsasLlenas} />
                <Field
                  label="Biotachos llenos *"
                  value={biotachosLlenos}
                  onChange={setBiotachosLlenos}
                />
                <Field label="Bolsas nuevas *" value={bolsasNuevas} onChange={setBolsasNuevas} />
                <Field
                  label="Biotachos nuevos *"
                  value={biotachosNuevos}
                  onChange={setBiotachosNuevos}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Cobro
              </h2>
              <dl className="mb-4 space-y-2 text-sm">
                <ReadOnlyRow label="Precio de retiro" value={precioTotalLabel} />
                <ReadOnlyRow label="Precio total a cobrar" value={precioTotalLabel} />
              </dl>
              <p className="mb-3 text-xs text-zinc-500">
                Completá uno o más montos. La suma debe ser igual al total a cobrar.
              </p>
              <div className="space-y-3">
                <MoneyField
                  label="Monto efectivo"
                  value={montoEfectivo}
                  onChange={setMontoEfectivo}
                />
                <MoneyField
                  label="Monto transferencia"
                  value={montoTransferencia}
                  onChange={setMontoTransferencia}
                />
                <MoneyField label="Monto QR" value={montoQr} onChange={setMontoQr} />
              </div>
            </section>
          </>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Firma</h2>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Nombre del firmante *
            </span>
            <input
              className={inputClass}
              value={nombreFirmante}
              onChange={(e) => setNombreFirmante(e.target.value)}
              required
            />
          </label>
          <label className="mt-4 flex min-h-[3rem] cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={firmaConfirmada}
              onChange={(e) => setFirmaConfirmada(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-zinc-300"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Confirmo la firma del cliente (canvas de firma próximamente)
            </span>
          </label>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl bg-emerald-700 text-base font-semibold text-white active:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? "Guardando…" : esCancelacion ? "Guardar cancelación" : "Guardar recolección"}
        </button>
      </form>
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="1"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Opcional"
        className={inputClass}
      />
    </label>
  );
}
