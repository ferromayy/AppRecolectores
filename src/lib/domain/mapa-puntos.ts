export type MapaPunto = {
  id: string;
  orden: number;
  nombre: string;
  direccion: string;
  zona: string | null;
  lat: number;
  lng: number;
};

export type MapaRecoleccionItem = {
  id: string;
  orden: number;
  nombre: string;
  direccion: string;
  zona: string | null;
  lat: number | null;
  lng: number | null;
};

export function toMapaPuntos(items: MapaRecoleccionItem[]): MapaPunto[] {
  return items
    .filter((item): item is MapaRecoleccionItem & { lat: number; lng: number } =>
      item.lat != null && item.lng != null,
    )
    .map((item) => ({
      id: item.id,
      orden: item.orden,
      nombre: item.nombre,
      direccion: item.direccion,
      zona: item.zona,
      lat: item.lat,
      lng: item.lng,
    }));
}
