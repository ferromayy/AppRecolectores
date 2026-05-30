-- Rutas importadas desde Google Sheets + paradas

DO $$
BEGIN
  CREATE TYPE public.ruta_estado AS ENUM (
    'borrador',
    'activa',
    'en_curso',
    'completada',
    'cancelada'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.parada_estado AS ENUM (
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

CREATE TABLE IF NOT EXISTS public.rutas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  estado public.ruta_estado NOT NULL DEFAULT 'borrador',
  asignado_a UUID REFERENCES public.profiles (id),
  spreadsheet_id TEXT,
  spreadsheet_url TEXT,
  sheet_name TEXT,
  external_key TEXT UNIQUE,
  imported_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rutas_fecha_idx ON public.rutas (fecha DESC);

CREATE INDEX IF NOT EXISTS rutas_estado_idx ON public.rutas (estado);

CREATE INDEX IF NOT EXISTS rutas_asignado_idx ON public.rutas (asignado_a);

CREATE TABLE IF NOT EXISTS public.ruta_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES public.rutas (id) ON DELETE CASCADE,
  orden INT NOT NULL CHECK (orden > 0),
  direccion TEXT NOT NULL,
  generador_nombre TEXT,
  contacto_telefono TEXT,
  notas TEXT,
  estado public.parada_estado NOT NULL DEFAULT 'pendiente',
  recoleccion_id UUID REFERENCES public.recolecciones (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ruta_id, orden)
);

CREATE INDEX IF NOT EXISTS ruta_paradas_ruta_idx ON public.ruta_paradas (ruta_id, orden);

DROP TRIGGER IF EXISTS rutas_updated_at ON public.rutas;

CREATE TRIGGER rutas_updated_at
BEFORE UPDATE ON public.rutas
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS ruta_paradas_updated_at ON public.ruta_paradas;

CREATE TRIGGER ruta_paradas_updated_at
BEFORE UPDATE ON public.ruta_paradas
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ruta_paradas ENABLE ROW LEVEL SECURITY;

-- Staff gestiona todas las rutas
DROP POLICY IF EXISTS rutas_staff_all ON public.rutas;

CREATE POLICY rutas_staff_all ON public.rutas
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Recolector ve rutas asignadas
DROP POLICY IF EXISTS rutas_recolector_select ON public.rutas;

CREATE POLICY rutas_recolector_select ON public.rutas
FOR SELECT TO authenticated
USING (asignado_a = auth.uid());

-- Paradas: staff todo; recolector lectura en sus rutas
DROP POLICY IF EXISTS ruta_paradas_staff_all ON public.ruta_paradas;

CREATE POLICY ruta_paradas_staff_all ON public.ruta_paradas
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS ruta_paradas_recolector_select ON public.ruta_paradas;

CREATE POLICY ruta_paradas_recolector_select ON public.ruta_paradas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rutas r
    WHERE
      r.id = ruta_paradas.ruta_id
      AND r.asignado_a = auth.uid()
  )
);
