-- Roles y perfiles para App Recolectores

CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'recolector');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.user_role NOT NULL,
  full_name TEXT,
  created_by UUID REFERENCES auth.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT profiles_superadmin_email CHECK (
    role <> 'superadmin'
    OR email = 'somos@ecolink.com.ar'
  )
);

CREATE UNIQUE INDEX profiles_one_superadmin_idx ON public.profiles (role)
WHERE
  role = 'superadmin';

CREATE INDEX profiles_role_idx ON public.profiles (role);

CREATE INDEX profiles_email_idx ON public.profiles (email);

COMMENT ON TABLE public.profiles IS 'Perfil y rol de cada usuario interno.';

-- Solo el correo corporativo puede ser superadmin
CREATE OR REPLACE FUNCTION public.enforce_superadmin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'superadmin' AND lower(NEW.email) <> 'somos@ecolink.com.ar' THEN
    RAISE EXCEPTION 'El superadmin solo puede ser somos@ecolink.com.ar';
  END IF;

  IF lower(NEW.email) = 'somos@ecolink.com.ar' AND NEW.role <> 'superadmin' THEN
    RAISE EXCEPTION 'somos@ecolink.com.ar debe tener rol superadmin';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_enforce_superadmin_email
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_superadmin_email();

-- Al registrarse el correo corporativo (primera vez en Auth), asignar superadmin
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role;
BEGIN
  IF lower(NEW.email) = 'somos@ecolink.com.ar' THEN
    assigned_role := 'superadmin';
  ELSE
    -- Usuarios creados fuera del flujo del superadmin no reciben perfil automático
  RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    lower(NEW.email),
    assigned_role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.is_superadmin()
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
      AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY profiles_select_superadmin ON public.profiles
FOR SELECT TO authenticated
USING (public.is_superadmin());

-- Inserciones/actualizaciones de admin y recolectores vía service role en el backend
CREATE POLICY profiles_no_client_write ON public.profiles
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_profiles_updated_at();
