-- Si ya se aplicó la migración anterior con 'terminada', renombrar a 'cerrada'.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ruta_estado'
      AND e.enumlabel = 'terminada'
  ) THEN
    ALTER TYPE public.ruta_estado RENAME VALUE 'terminada' TO 'cerrada';
  END IF;
END
$$;

ALTER TYPE public.ruta_estado ADD VALUE IF NOT EXISTS 'cerrada';
