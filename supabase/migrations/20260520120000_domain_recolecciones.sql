-- Organizaciones externas + recolecciones (idempotente)

DO $$
BEGIN
  CREATE TYPE public.organizacion_tipo AS ENUM ('generador', 'empresa', 'cooperativa');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.recoleccion_estado AS ENUM (
    'borrador',
    'solicitada',
    'asignada',
    'en_camino',
    'recolectada',
    'en_planta',
    'transformada',
    'cancelada'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.organizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.organizacion_tipo NOT NULL,
  nombre TEXT NOT NULL,
  contacto_email TEXT,
  contacto_telefono TEXT,
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizaciones_tipo_idx ON public.organizaciones (tipo);

CREATE INDEX IF NOT EXISTS organizaciones_nombre_idx ON public.organizaciones (nombre);

CREATE TABLE IF NOT EXISTS public.recolecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado public.recoleccion_estado NOT NULL DEFAULT 'solicitada',
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones (id),
  cooperativa_id UUID REFERENCES public.organizaciones (id),
  asignado_a UUID REFERENCES public.profiles (id),
  direccion TEXT NOT NULL,
  programada_para TIMESTAMPTZ,
  notas TEXT,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recolecciones_estado_idx ON public.recolecciones (estado);

CREATE INDEX IF NOT EXISTS recolecciones_asignado_idx ON public.recolecciones (asignado_a);

CREATE INDEX IF NOT EXISTS recolecciones_organizacion_idx ON public.recolecciones (organizacion_id);

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE
      id = auth.uid()
      AND role IN ('superadmin', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizaciones_updated_at ON public.organizaciones;

CREATE TRIGGER organizaciones_updated_at
BEFORE UPDATE ON public.organizaciones
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS recolecciones_updated_at ON public.recolecciones;

CREATE TRIGGER recolecciones_updated_at
BEFORE UPDATE ON public.recolecciones
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.organizaciones ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.recolecciones ENABLE ROW LEVEL SECURITY;

-- Organizaciones: staff lee/escribe; recolector solo lectura
DROP POLICY IF EXISTS organizaciones_staff_all ON public.organizaciones;

CREATE POLICY organizaciones_staff_all ON public.organizaciones
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS organizaciones_recolector_select ON public.organizaciones;

CREATE POLICY organizaciones_recolector_select ON public.organizaciones
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.recolecciones r
    WHERE
      r.organizacion_id = organizaciones.id
      AND r.asignado_a = auth.uid()
  )
);

-- Recolecciones: staff todo; recolector ve y actualiza las suyas
DROP POLICY IF EXISTS recolecciones_staff_all ON public.recolecciones;

CREATE POLICY recolecciones_staff_all ON public.recolecciones
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS recolecciones_recolector_select ON public.recolecciones;

CREATE POLICY recolecciones_recolector_select ON public.recolecciones
FOR SELECT TO authenticated
USING (asignado_a = auth.uid());

DROP POLICY IF EXISTS recolecciones_recolector_update ON public.recolecciones;

CREATE POLICY recolecciones_recolector_update ON public.recolecciones
FOR UPDATE TO authenticated
USING (asignado_a = auth.uid())
WITH CHECK (asignado_a = auth.uid());
