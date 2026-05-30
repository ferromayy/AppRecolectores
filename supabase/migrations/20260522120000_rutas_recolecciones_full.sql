-- Rutas completas + recolecciones desde planilla (idempotente)

DO $$
BEGIN
  CREATE TYPE public.ruta_turno AS ENUM ('manana', 'tarde');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.recoleccion_operativa_estado AS ENUM (
    'pendiente',
    'en_camino',
    'visitada',
    'omitida',
    'cancelada'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS turno public.ruta_turno;

CREATE INDEX IF NOT EXISTS rutas_fecha_turno_recolector_idx ON public.rutas (fecha, turno, asignado_a);

CREATE TABLE IF NOT EXISTS public.ruta_recolecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES public.rutas (id) ON DELETE CASCADE,
  orden INT NOT NULL CHECK (orden > 0),
  -- Cliente / punto de recolección
  zona TEXT,
  nombre TEXT NOT NULL,
  unidad TEXT,
  tipo_servicio TEXT,
  frecuencia TEXT,
  barrio TEXT,
  direccion TEXT NOT NULL,
  depto TEXT,
  telefono TEXT NOT NULL,
  telefono_normalizado TEXT NOT NULL,
  observaciones TEXT,
  dia DATE NOT NULL,
  hora TIME NOT NULL,
  nota_encargado TEXT,
  precio TEXT,
  deuda TEXT,
  -- Geocoding (futuro)
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  coordenadas_dms TEXT,
  direccion_google TEXT,
  estado_operativo public.recoleccion_operativa_estado NOT NULL DEFAULT 'pendiente',
  sheet_fila INT,
  sheet_estado TEXT,
  sheet_mensaje TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ruta_id, telefono_normalizado),
  UNIQUE (ruta_id, orden)
);

CREATE INDEX IF NOT EXISTS ruta_recolecciones_ruta_idx ON public.ruta_recolecciones (ruta_id, orden);

CREATE INDEX IF NOT EXISTS ruta_recolecciones_telefono_idx ON public.ruta_recolecciones (telefono_normalizado);

DROP TRIGGER IF EXISTS ruta_recolecciones_updated_at ON public.ruta_recolecciones;

CREATE TRIGGER ruta_recolecciones_updated_at
BEFORE UPDATE ON public.ruta_recolecciones
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.ruta_recolecciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ruta_recolecciones_staff_all ON public.ruta_recolecciones;

CREATE POLICY ruta_recolecciones_staff_all ON public.ruta_recolecciones
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS ruta_recolecciones_recolector_select ON public.ruta_recolecciones;

CREATE POLICY ruta_recolecciones_recolector_select ON public.ruta_recolecciones
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE
      r.id = ruta_recolecciones.ruta_id
      AND r.asignado_a = auth.uid()
  )
);

DROP POLICY IF EXISTS ruta_recolecciones_recolector_update ON public.ruta_recolecciones;

CREATE POLICY ruta_recolecciones_recolector_update ON public.ruta_recolecciones
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE
      r.id = ruta_recolecciones.ruta_id
      AND r.asignado_a = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE
      r.id = ruta_recolecciones.ruta_id
      AND r.asignado_a = auth.uid()
  )
);
