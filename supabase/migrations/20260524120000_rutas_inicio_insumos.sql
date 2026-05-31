-- Datos de inicio de jornada del recolector

ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS km_inicial NUMERIC,
ADD COLUMN IF NOT EXISTS insumos_inicio JSONB NOT NULL DEFAULT '[]'::jsonb;
