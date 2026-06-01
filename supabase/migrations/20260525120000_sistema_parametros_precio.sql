-- Historial de parámetros de sistema con vigencia (precio bolsa extra, etc.)

CREATE TABLE IF NOT EXISTS public.sistema_precio_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL,
  precio NUMERIC NOT NULL CHECK (precio >= 0),
  vigencia_desde TIMESTAMPTZ NOT NULL,
  vigencia_hasta TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (vigencia_hasta IS NULL OR vigencia_hasta >= vigencia_desde)
);

CREATE INDEX IF NOT EXISTS sistema_precio_historial_clave_vigencia_idx
  ON public.sistema_precio_historial (clave, vigencia_desde DESC);

CREATE UNIQUE INDEX IF NOT EXISTS sistema_precio_historial_activo_idx
  ON public.sistema_precio_historial (clave)
  WHERE vigencia_hasta IS NULL;

ALTER TABLE public.sistema_precio_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sistema_precio_historial_staff_select ON public.sistema_precio_historial;

CREATE POLICY sistema_precio_historial_staff_select ON public.sistema_precio_historial
  FOR SELECT
  TO authenticated
  USING (public.is_staff());
