/** Actores del ecosistema logístico (modelo conceptual, sin tablas aún). */

export type ActorRole =
  | "intermediario"
  | "generador"
  | "empresa"
  | "cooperativa"
  | "recolector";

export type RecoleccionEstado =
  | "borrador"
  | "solicitada"
  | "asignada"
  | "en_camino"
  | "recolectada"
  | "en_planta"
  | "transformada"
  | "cancelada";

export interface Actor {
  id: string;
  nombre: string;
  rol: ActorRole;
}

export interface PuntoRecoleccion {
  id: string;
  direccion: string;
  lat?: number;
  lng?: number;
  generadorId: string;
}

export interface Recoleccion {
  id: string;
  estado: RecoleccionEstado;
  puntoId: string;
  cooperativaId?: string;
  programadaPara?: string;
}
