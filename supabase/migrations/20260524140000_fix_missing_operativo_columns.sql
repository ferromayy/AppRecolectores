-- Columnas operativas faltantes (idempotente — seguro ejecutar más de una vez)

ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS km_recorridos NUMERIC,
ADD COLUMN IF NOT EXISTS inicio_jornada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cierre_recolector_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cierre_operario_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cierre_operario_por UUID REFERENCES public.profiles (id),
ADD COLUMN IF NOT EXISTS monto_efectivo NUMERIC,
ADD COLUMN IF NOT EXISTS monto_transferencia NUMERIC,
ADD COLUMN IF NOT EXISTS observaciones_operario TEXT;

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS hora_real TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS precio_total NUMERIC,
ADD COLUMN IF NOT EXISTS monto_efectivo NUMERIC,
ADD COLUMN IF NOT EXISTS monto_transferencia NUMERIC,
ADD COLUMN IF NOT EXISTS detalle TEXT,
ADD COLUMN IF NOT EXISTS firma_digital TEXT,
ADD COLUMN IF NOT EXISTS nombre_firmante TEXT;

-- Recargar schema cache de PostgREST (evita "column not found in schema cache")
NOTIFY pgrst, 'reload schema';
