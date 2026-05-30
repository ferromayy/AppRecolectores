export type ImportRutaMeta = {
  nombre: string;
  fecha: string;
  /** Email o nombre del recolector asignado */
  asignado?: string;
  recolector_email?: string;
  spreadsheet_id?: string;
  spreadsheet_url?: string;
  sheet_name?: string;
  external_key?: string;
};

export type ImportParada = {
  orden: number;
  direccion: string;
  generador?: string;
  telefono?: string;
  notas?: string;
};

/** MVP: solo ruta (nombre, fecha, asignado). Paradas opcional para más adelante. */
export type ImportRutaPayload = {
  ruta: ImportRutaMeta;
  paradas?: ImportParada[];
};

export type ImportRutaResult = {
  ok: true;
  ruta_id: string;
  paradas_count: number;
  reimported: boolean;
  warnings: string[];
  message: string;
};

export type ImportRutaError = {
  ok: false;
  error: string;
  details?: string[];
};
