-- Teléfono obligatorio en recolecciones (si ya aplicaste la migración anterior)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE
      table_schema = 'public'
      AND table_name = 'ruta_recolecciones'
      AND column_name = 'telefono'
      AND is_nullable = 'YES'
  ) THEN
    UPDATE public.ruta_recolecciones
    SET telefono = telefono_normalizado
    WHERE telefono IS NULL AND telefono_normalizado IS NOT NULL;

    ALTER TABLE public.ruta_recolecciones
    ALTER COLUMN telefono SET NOT NULL;
  END IF;
END
$$;
