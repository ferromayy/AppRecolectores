-- Cerrada: cierre del operario; la ruta pasa al Historial.
-- Completada (Realizado): el recolector finalizó; sigue en Operativo hasta cierre operario.

ALTER TYPE public.ruta_estado ADD VALUE IF NOT EXISTS 'cerrada';
