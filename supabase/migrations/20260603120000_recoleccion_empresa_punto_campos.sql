-- Campos de retiro Empresa + tipo Punto (cobro por bolsa llena punto / bolsa punto)

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS bolsas_llenas_punto INTEGER,
ADD COLUMN IF NOT EXISTS bolsas_nuevas_vendidas INTEGER;

NOTIFY pgrst, 'reload schema';
