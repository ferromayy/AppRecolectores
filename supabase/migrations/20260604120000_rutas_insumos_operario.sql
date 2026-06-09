-- Preparación de insumos por el operario (obligatoria antes de inicio del recolector)

ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS insumos_operario JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS insumos_operario_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
