"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useCallback, useEffect, useRef, useState } from "react";

import { getZonaMarkerColor } from "@/components/panel/operario/operario-badges";
import { OperarioMapaRecoleccionesList } from "@/components/panel/operario/operario-mapa-recolecciones-list";
import { withSequentialOrden } from "@/lib/domain/reorden-recolecciones";
import type { MapaPunto, MapaRecoleccionItem } from "@/lib/domain/mapa-puntos";
import { toMapaPuntos } from "@/lib/domain/mapa-puntos";

type Props = {
  open: boolean;
  rutaId: string | null;
  rutaNombre: string | null;
  mapsApiKey: string | null;
  onClose: () => void;
  onOrderChange?: () => void;
};

type MapaResponse = {
  ok: boolean;
  recolecciones?: MapaRecoleccionItem[];
  puntos?: MapaPunto[];
  geocodificados?: number;
  fallidos?: number;
  total?: number;
  mensaje?: string;
  error?: string;
};

const CORDOBA_CENTER = { lat: -31.4201, lng: -64.1888 };
let loaderConfigured = false;
let configuredApiKey: string | null = null;

const MAPS_REFERRER_HELP =
  "Google Maps rechazó la API key (referente no autorizado). En Google Cloud → Credenciales → la key del mapa (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), en Referentes HTTP agregá: http://localhost:3000/*, http://127.0.0.1:3000/* y https://app-recolectores.vercel.app/*. Guardá y esperá 1–2 minutos.";

function ensureLoaderOptions(apiKey: string) {
  if (loaderConfigured && configuredApiKey === apiKey) return;
  setOptions({ key: apiKey, v: "weekly", language: "es", region: "AR" });
  loaderConfigured = true;
  configuredApiKey = apiKey;
}

function waitForLayout() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function refreshMapLayout(map: google.maps.Map) {
  google.maps.event.trigger(map, "resize");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function OperarioRutaMapModal({
  open,
  rutaId,
  rutaNombre,
  mapsApiKey,
  onClose,
  onOrderChange,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const setErrorRef = useRef<(value: string | null) => void>(() => {});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ geocodificados: number; fallidos: number; total: number } | null>(null);
  const [puntos, setPuntos] = useState<MapaPunto[]>([]);
  const [recolecciones, setRecolecciones] = useState<MapaRecoleccionItem[]>([]);
  const [selectedRecoleccionId, setSelectedRecoleccionId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [saveOrderError, setSaveOrderError] = useState<string | null>(null);

  setErrorRef.current = setError;

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current) marker.setMap(null);
    for (const info of infoWindowsRef.current) info.close();
    markersRef.current = [];
    infoWindowsRef.current = [];
  }, []);

  const destroyMap = useCallback(() => {
    clearMarkers();
    mapRef.current = null;
  }, [clearMarkers]);

  const placeMarkers = useCallback(
    async (nextPuntos: MapaPunto[], options?: { fitBounds?: boolean; highlightId?: string | null }) => {
      if (!mapRef.current) return;

      clearMarkers();

      if (nextPuntos.length === 0) return;

      const map = mapRef.current;
      const { LatLngBounds } = await importLibrary("core");
      const bounds = new LatLngBounds();

      for (const punto of nextPuntos) {
        const position = { lat: punto.lat, lng: punto.lng };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          map,
          position,
          title: `${punto.orden}. ${punto.nombre}`,
          label: {
            text: String(punto.orden),
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "11px",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: getZonaMarkerColor(punto.zona),
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          zIndex: options?.highlightId === punto.id ? 1000 : punto.orden,
        });

        const info = new google.maps.InfoWindow({
          content: `<div style="max-width:220px;font-family:system-ui,sans-serif">
            <strong>${punto.orden}. ${escapeHtml(punto.nombre)}</strong><br/>
            <span style="color:#52525b">${escapeHtml(punto.direccion)}</span>
            ${punto.zona ? `<br/><span style="color:#71717a">Zona: ${escapeHtml(punto.zona)}</span>` : ""}
          </div>`,
        });

        marker.addListener("click", () => {
          setSelectedRecoleccionId(punto.id);
          info.open({ map, anchor: marker });
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(info);

        if (options?.highlightId === punto.id) {
          info.open({ map, anchor: marker });
          map.panTo(position);
        }
      }

      if (options?.fitBounds !== false) {
        map.fitBounds(bounds, 48);
        window.setTimeout(() => {
          if (mapRef.current) {
            refreshMapLayout(mapRef.current);
            mapRef.current.fitBounds(bounds, 48);
          }
        }, 150);
      }
    },
    [clearMarkers],
  );

  const initMap = useCallback(async () => {
    if (!mapsApiKey || !mapContainerRef.current) {
      throw new Error("No se pudo inicializar el contenedor del mapa.");
    }

    ensureLoaderOptions(mapsApiKey);
    const { Map } = await importLibrary("maps");

    destroyMap();

    mapRef.current = new Map(mapContainerRef.current, {
      center: CORDOBA_CENTER,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    refreshMapLayout(mapRef.current);
  }, [destroyMap, mapsApiKey]);

  const persistOrder = useCallback(
    async (orderedRecolecciones: MapaRecoleccionItem[]) => {
      if (!rutaId) return;

      setSavingOrder(true);
      setSaveOrderError(null);

      try {
        const response = await fetch(`/api/panel/rutas/${rutaId}/recolecciones/reorden`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orden: orderedRecolecciones.map((item) => item.id) }),
        });
        const body = (await response.json()) as { ok?: boolean; error?: string };

        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "No se pudo guardar el orden");
        }

        onOrderChange?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo guardar el orden";
        setSaveOrderError(message);
      } finally {
        setSavingOrder(false);
      }
    },
    [onOrderChange, rutaId],
  );

  const handleReorder = useCallback(
    (next: MapaRecoleccionItem[]) => {
      const ordered = withSequentialOrden(next);
      setRecolecciones(ordered);
      const nextPuntos = toMapaPuntos(ordered);
      setPuntos(nextPuntos);
      void placeMarkers(nextPuntos, { fitBounds: false });
      void persistOrder(ordered);
    },
    [persistOrder, placeMarkers],
  );

  const handleSelectRecoleccion = useCallback(
    (id: string) => {
      setSelectedRecoleccionId(id);
      const item = recolecciones.find((entry) => entry.id === id);
      if (item?.lat != null && item.lng != null) {
        void placeMarkers(puntos, { fitBounds: false, highlightId: id });
      }
    },
    [placeMarkers, puntos, recolecciones],
  );

  useEffect(() => {
    if (!open) return;

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      setErrorRef.current(MAPS_REFERRER_HELP);
      setLoading(false);
    };

    return () => {
      window.gm_authFailure = previousAuthFailure;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !rutaId) return;

    let cancelled = false;

    async function loadMapData() {
      setLoading(true);
      setError(null);
      setMeta(null);
      setPuntos([]);
      setRecolecciones([]);
      setSelectedRecoleccionId(null);
      setSaveOrderError(null);

      if (!mapsApiKey) {
        setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el entorno.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/panel/rutas/${rutaId}/mapa`, {
          cache: "no-store",
        });
        const body = (await response.json()) as MapaResponse;

        if (cancelled) return;

        if (!response.ok || !body.ok) {
          setError(body.error ?? "No se pudo cargar el mapa");
          setLoading(false);
          return;
        }

        const loadedRecolecciones = withSequentialOrden(
          body.recolecciones ??
            body.puntos?.map((punto) => ({
              id: punto.id,
              orden: punto.orden,
              nombre: punto.nombre,
              direccion: punto.direccion,
              zona: punto.zona,
              lat: punto.lat,
              lng: punto.lng,
            })) ??
            [],
        );
        const loadedPuntos = toMapaPuntos(loadedRecolecciones);
        setRecolecciones(loadedRecolecciones);
        setPuntos(loadedPuntos);
        setMeta({
          geocodificados: body.geocodificados ?? 0,
          fallidos: body.fallidos ?? 0,
          total: body.total ?? loadedPuntos.length,
        });

        setLoading(false);
        await waitForLayout();

        try {
          await initMap();
          await placeMarkers(loadedPuntos);
        } catch (err) {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : "Error al inicializar Google Maps.";
            setError(message);
          }
          return;
        }

        if (loadedPuntos.length === 0) {
          setError(
            body.mensaje ??
              (body.total === 0
                ? "Esta ruta no tiene recolecciones importadas."
                : "No hay puntos con ubicación para esta ruta."),
          );
        }
      } catch {
        if (!cancelled) setError("Error de red al cargar el mapa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMapData();

    return () => {
      cancelled = true;
    };
  }, [open, rutaId, mapsApiKey, initMap, placeMarkers]);

  useEffect(() => {
    if (!open) {
      destroyMap();
      setError(null);
      setMeta(null);
      setLoading(false);
      setPuntos([]);
      setRecolecciones([]);
      setSelectedRecoleccionId(null);
      setSaveOrderError(null);
      setSavingOrder(false);
    }
  }, [open, destroyMap]);

  if (!open || !rutaId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar mapa"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ruta-mapa-title"
        className="relative z-10 flex h-[min(90vh,780px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="ruta-mapa-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Mapa de ruta
            </h2>
            <p className="text-sm text-zinc-500">{rutaNombre ?? "Ruta seleccionada"}</p>
            {meta && !loading && (
              <p className="mt-1 text-xs text-zinc-500">
                {meta.total} punto(s)
                {meta.geocodificados > 0 ? ` · ${meta.geocodificados} geocodificado(s) ahora` : ""}
                {meta.fallidos > 0 ? ` · ${meta.fallidos} sin ubicación` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-200"
          >
            Cerrar
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative min-h-[320px] min-w-0 flex-1 lg:min-h-0">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-zinc-600 dark:bg-zinc-900/80">
                Cargando mapa y ubicaciones…
              </div>
            )}
            {error && !loading && (
              <div className="absolute inset-x-0 top-0 z-10 border-b border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/90 dark:text-red-300">
                {error}
              </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full min-h-[320px]" />
          </div>

          <aside className="flex h-72 shrink-0 flex-col border-t border-zinc-200 dark:border-zinc-800 lg:h-auto lg:w-80 lg:border-t-0 lg:border-l">
            <OperarioMapaRecoleccionesList
              recolecciones={recolecciones}
              saving={savingOrder}
              saveError={saveOrderError}
              onReorder={handleReorder}
              onSelectRecoleccion={handleSelectRecoleccion}
              selectedRecoleccionId={selectedRecoleccionId}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
