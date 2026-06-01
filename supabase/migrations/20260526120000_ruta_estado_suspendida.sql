-- Estado suspendida para rutas (admin puede suspender; recolector ve en sección aparte)

ALTER TYPE public.ruta_estado ADD VALUE IF NOT EXISTS 'suspendida';
