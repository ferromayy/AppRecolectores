-- Campos de cierre de ruta por recolector
-- Se completan al finalizar la ruta desde el panel del recolector.

ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS km_final NUMERIC,
ADD COLUMN IF NOT EXISTS descarga BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS combustible NUMERIC,
ADD COLUMN IF NOT EXISTS descuento NUMERIC,
ADD COLUMN IF NOT EXISTS otros_gastos NUMERIC,
ADD COLUMN IF NOT EXISTS total_efectivo NUMERIC,
ADD COLUMN IF NOT EXISTS observaciones_recolector TEXT;

