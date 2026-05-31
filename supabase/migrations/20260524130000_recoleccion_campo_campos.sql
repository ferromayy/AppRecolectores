-- Campos de carga en campo por recolección (recolector)

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT,
ADD COLUMN IF NOT EXISTS bolsas_llenas INT,
ADD COLUMN IF NOT EXISTS biotachos_llenos INT,
ADD COLUMN IF NOT EXISTS bolsas_nuevas INT,
ADD COLUMN IF NOT EXISTS biotachos_nuevos INT,
ADD COLUMN IF NOT EXISTS monto_qr NUMERIC;
