export const UNIDADES = ["Hogar", "Empresa", "Puntos"] as const;
export const TIPOS_SERVICIO = ["Reciclaje", "Mixto", "Organico"] as const;
export const FRECUENCIAS = ["Mensual", "Puntual", "Semanal"] as const;
export const ESTADOS_HOJA = ["Pendiente", "Incompleto", "Error", "Enviada"] as const;

export type Unidad = (typeof UNIDADES)[number];
export type TipoServicio = (typeof TIPOS_SERVICIO)[number];
export type Frecuencia = (typeof FRECUENCIAS)[number];
export type EstadoHoja = (typeof ESTADOS_HOJA)[number];
export type RutaTurno = "manana" | "tarde";

export type RecoleccionSheetRow = {
  fila?: number;
  zona?: string;
  nombre?: string;
  unidad?: string;
  tipo_servicio?: string;
  frecuencia?: string;
  barrio?: string;
  direccion?: string;
  depto?: string;
  telefono?: string;
  observaciones?: string;
  dia?: string;
  hora?: string;
  nota_encargado?: string;
  precio?: string | number;
  deuda?: string | number;
  recolector?: string;
  /** Alias enviado por Apps Script */
  recolector_email?: string;
  turno?: RutaTurno;
};

export type FieldError = {
  field: string;
  message: string;
};

export type ValidatedRecoleccion = {
  fila: number;
  zona: string | null;
  nombre: string;
  unidad: string | null;
  tipo_servicio: string | null;
  frecuencia: string | null;
  barrio: string | null;
  direccion: string;
  depto: string | null;
  telefono: string;
  telefono_normalizado: string;
  observaciones: string | null;
  dia: string;
  hora: string;
  nota_encargado: string | null;
  precio: string | null;
  deuda: string | null;
  recolector_email: string;
  turno: RutaTurno;
};

export type RowValidationResult = {
  estado: EstadoHoja;
  mensaje: string;
  errors: FieldError[];
  missing: string[];
  data: ValidatedRecoleccion | null;
};

const AR_PHONE_RE =
  /^\+54(?:9)?(?:11|[2368]\d{2}|3[0-9]{2}|4[0-9]{2}|5[0-9]{2}|6[0-9]{2}|7[0-9]{2}|9[0-9]{2})\d{6,8}$/;

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "");
}

function matchEnum<T extends string>(value: string, allowed: readonly T[]): T | null {
  if (!value) return null;
  const found = allowed.find((a) => a.toLowerCase() === value.toLowerCase());
  return found ?? null;
}

export function normalizeArgPhone(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  let v = str(raw);
  if (!v) return { ok: false, error: "Teléfono vacío" };

  v = v.replace(/[\s\-().]/g, "");
  if (v.startsWith("00")) v = "+" + v.slice(2);
  if (v.startsWith("54") && !v.startsWith("+")) v = "+" + v;
  if (/^\d{10,11}$/.test(v) && !v.startsWith("+")) {
    v = "+54" + v;
  }
  if (/^9\d{10}$/.test(v)) {
    v = "+54" + v;
  }

  if (v.length > 30) {
    return { ok: false, error: "Teléfono muy largo (>30)" };
  }

  if (!AR_PHONE_RE.test(v)) {
    return { ok: false, error: "Teléfono (formato argentino inválido)" };
  }

  return { ok: true, value: v };
}

export function parseDia(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { ok: true, value: value.toISOString().slice(0, 10) };
  }
  const s = str(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return { ok: false, error: "Dia (formato YYYY-MM-DD)" };
  }
  return { ok: true, value: s };
}

export function parseHora(value: unknown): { ok: true; value: string; turno: RutaTurno } | { ok: false; error: string } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const h = value.getHours();
    const m = value.getMinutes();
    const s = value.getSeconds();
    const formatted = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    return { ok: true, value: formatted, turno: h < 12 ? "manana" : "tarde" };
  }

  const raw = str(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return { ok: false, error: "Hora (formato hora inválido)" };
  }

  const hh = Number(match[1]);
  const mm = Number(match[2]);
  const ss = Number(match[3] ?? 0);

  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) {
    return { ok: false, error: "Hora (formato hora inválido)" };
  }

  const formatted = `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  return { ok: true, value: formatted, turno: hh < 12 ? "manana" : "tarde" };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function checkLength(
  field: string,
  label: string,
  value: string,
  max: number,
  errors: FieldError[],
) {
  if (value.length > max) {
    errors.push({ field, message: `${label} (muy largo (>${max}))` });
  }
}

function parsePrecio(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === null || value === undefined || str(value) === "") {
    return { ok: true, value: null };
  }
  if (typeof value === "number") {
    if (value < 0) return { ok: false, error: "Precio (negativo)" };
    return { ok: true, value: String(value) };
  }
  const s = str(value);
  if (s.length > 50) return { ok: false, error: "Precio (muy largo (>50))" };
  const n = Number(s.replace(",", "."));
  if (!Number.isNaN(n)) {
    if (n < 0) return { ok: false, error: "Precio (negativo)" };
    return { ok: true, value: s };
  }
  return { ok: true, value: s };
}

function parseDeuda(value: unknown): string | null {
  if (value === null || value === undefined || str(value) === "") return null;
  if (typeof value === "number") return String(value);
  return str(value);
}

export function validateRecoleccionRow(
  row: RecoleccionSheetRow,
  recolectoresEmails: Set<string>,
): RowValidationResult {
  const fila = row.fila ?? 0;
  const errors: FieldError[] = [];
  const missing: string[] = [];

  const nombre = str(row.nombre);
  const direccion = str(row.direccion);
  const recolector = str(row.recolector ?? row.recolector_email).toLowerCase();

  if (!nombre) missing.push("Nombre");
  else checkLength("nombre", "Nombre", nombre, 150, errors);

  if (!direccion) missing.push("Direccion");
  else checkLength("direccion", "Direccion", direccion, 255, errors);

  const zona = str(row.zona);
  if (zona) checkLength("zona", "Zona", zona, 10, errors);

  const unidadRaw = str(row.unidad);
  let unidad: string | null = null;
  if (unidadRaw) {
    checkLength("unidad", "Unidad", unidadRaw, 100, errors);
    const matched = matchEnum(unidadRaw, UNIDADES);
    if (!matched) errors.push({ field: "unidad", message: "Unidad (valor inválido)" });
    else unidad = matched;
  }

  const tipoRaw = str(row.tipo_servicio);
  let tipo_servicio: string | null = null;
  if (tipoRaw) {
    checkLength("tipo_servicio", "Tipo de servicio", tipoRaw, 50, errors);
    const matched = matchEnum(tipoRaw, TIPOS_SERVICIO);
    if (!matched) errors.push({ field: "tipo_servicio", message: "Tipo de servicio (valor inválido)" });
    else tipo_servicio = matched;
  }

  const freqRaw = str(row.frecuencia);
  let frecuencia: string | null = null;
  if (freqRaw) {
    checkLength("frecuencia", "Frecuencia", freqRaw, 50, errors);
    const matched = matchEnum(freqRaw, FRECUENCIAS);
    if (!matched) errors.push({ field: "frecuencia", message: "Frecuencia (valor inválido)" });
    else frecuencia = matched;
  }

  const barrio = str(row.barrio);
  if (barrio) checkLength("barrio", "Barrio", barrio, 100, errors);

  const depto = str(row.depto);
  if (depto) checkLength("depto", "Depto", depto, 50, errors);

  const telefonoRaw = str(row.telefono);
  let telefono = "";
  let telefono_normalizado = "";
  if (!telefonoRaw) {
    missing.push("Telefono");
  } else {
    const phone = normalizeArgPhone(telefonoRaw);
    if (!phone.ok) {
      errors.push({ field: "telefono", message: phone.error });
    } else {
      telefono = telefonoRaw;
      telefono_normalizado = phone.value;
    }
  }

  const diaParsed = parseDia(row.dia);
  if (!diaParsed.ok) {
    if (!str(row.dia)) missing.push("Dia");
    else errors.push({ field: "dia", message: diaParsed.error });
  }

  const horaParsed = parseHora(row.hora);
  if (!horaParsed.ok) {
    if (!str(row.hora)) missing.push("Hora");
    else errors.push({ field: "hora", message: horaParsed.error });
  }

  if (!recolector) missing.push("Recolector");
  else if (!recolectoresEmails.has(recolector)) {
    errors.push({ field: "recolector", message: "Recolector (no existe en la base)" });
  }

  const precioParsed = parsePrecio(row.precio);
  if (!precioParsed.ok) {
    errors.push({ field: "precio", message: precioParsed.error });
  }

  const deuda = parseDeuda(row.deuda);

  const observaciones = str(row.observaciones) || null;
  const nota_encargado = str(row.nota_encargado) || null;

  let estado: EstadoHoja = "Pendiente";
  const parts: string[] = [];

  if (errors.length > 0) {
    estado = "Error";
    parts.push(errors.map((e) => `❌ Error: ${e.message}`).join(" · "));
  }
  if (missing.length > 0) {
    if (estado !== "Error") estado = "Incompleto";
    parts.push(`⚠️ Falta: ${missing.join(", ")}`);
  }

  const mensaje = parts.join(" · ");

  if (estado !== "Pendiente") {
    return { estado, mensaje, errors, missing, data: null };
  }

  return {
    estado: "Pendiente",
    mensaje: "",
    errors: [],
    missing: [],
    data: {
      fila,
      zona: zona || null,
      nombre,
      unidad,
      tipo_servicio,
      frecuencia,
      barrio: barrio || null,
      direccion,
      depto: depto || null,
      telefono,
      telefono_normalizado,
      observaciones,
      dia: diaParsed.ok ? diaParsed.value : "",
      hora: horaParsed.ok ? horaParsed.value : "",
      nota_encargado,
      precio: precioParsed.ok ? precioParsed.value : null,
      deuda,
      recolector_email: recolector,
      turno: horaParsed.ok ? horaParsed.turno : "manana",
    },
  };
}

export function buildRutaExternalKey(
  spreadsheetId: string,
  fecha: string,
  turno: RutaTurno,
  recolectorEmail: string,
): string {
  return [spreadsheetId, fecha, turno, recolectorEmail.toLowerCase()].join(":");
}

export function buildRutaNombre(fecha: string, turno: RutaTurno, recolectorLabel: string): string {
  const turnoLabel = turno === "manana" ? "Mañana" : "Tarde";
  return `Ruta ${fecha} ${turnoLabel} · ${recolectorLabel}`;
}

export const SHEET_COLUMN_MAP: Record<string, keyof RecoleccionSheetRow> = {
  zona: "zona",
  nombre: "nombre",
  unidad: "unidad",
  "tipo de servicio": "tipo_servicio",
  tipodeservicio: "tipo_servicio",
  frecuencia: "frecuencia",
  barrio: "barrio",
  direccion: "direccion",
  depto: "depto",
  telefono: "telefono",
  observaciones: "observaciones",
  dia: "dia",
  hora: "hora",
  "nota encargado": "nota_encargado",
  notaencargado: "nota_encargado",
  precio: "precio",
  deuda: "deuda",
  recolector: "recolector",
  estado: "estado" as keyof RecoleccionSheetRow,
  mensajesistema: "mensaje_sistema" as keyof RecoleccionSheetRow,
};

export function mapSheetHeaders(headers: string[]): Map<keyof RecoleccionSheetRow, number> {
  const map = new Map<keyof RecoleccionSheetRow, number>();
  headers.forEach((h, i) => {
    const key = normalizeHeader(h);
    const field = SHEET_COLUMN_MAP[key];
    if (field) map.set(field, i);
  });
  return map;
}
