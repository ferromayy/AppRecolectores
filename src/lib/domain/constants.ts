import type { UserRole } from "@/lib/auth/constants";

export const ORGANIZACION_TIPOS = ["generador", "empresa", "cooperativa"] as const;
export type OrganizacionTipo = (typeof ORGANIZACION_TIPOS)[number];

export const ORGANIZACION_TIPO_LABELS: Record<OrganizacionTipo, string> = {
  generador: "Generador",
  empresa: "Empresa",
  cooperativa: "Cooperativa",
};

export const RECOLECCION_ESTADOS = [
  "borrador",
  "solicitada",
  "asignada",
  "en_camino",
  "recolectada",
  "en_planta",
  "transformada",
  "cancelada",
] as const;

export type RecoleccionEstado = (typeof RECOLECCION_ESTADOS)[number];

export const RECOLECCION_ESTADO_LABELS: Record<RecoleccionEstado, string> = {
  borrador: "Borrador",
  solicitada: "Solicitada",
  asignada: "Asignada",
  en_camino: "En camino",
  recolectada: "Recolectada",
  en_planta: "En planta",
  transformada: "Transformada",
  cancelada: "Cancelada",
};

export const RECOLECTOR_ESTADOS: RecoleccionEstado[] = [
  "asignada",
  "en_camino",
  "recolectada",
  "en_planta",
];

export function isStaffRole(role: UserRole) {
  return role === "superadmin" || role === "admin";
}

export const RUTA_ESTADOS = [
  "borrador",
  "activa",
  "en_curso",
  "completada",
  "cancelada",
] as const;

export type RutaEstado = (typeof RUTA_ESTADOS)[number];

export const RUTA_ESTADO_LABELS: Record<RutaEstado, string> = {
  borrador: "Borrador",
  activa: "Activa",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};
