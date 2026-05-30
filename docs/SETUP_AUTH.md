# Autenticación y roles

## Roles

| Rol | Quién lo crea | Correo |
|-----|---------------|--------|
| **superadmin** | Solo `somos@ecolink.com.ar` (automático al registrarse) | Fijo: somos@ecolink.com.ar |
| **admin** | Superadmin | Cualquier correo interno |
| **recolector** | Superadmin | Cualquier correo interno |

## Reglas de contraseña

- **Admin y recolector:** el superadmin los crea con **contraseña inicial** en el formulario y puede **cambiar la contraseña** desde Usuarios internos (sin correo de enlace).
- **Superadmin:** gestiona su propia contraseña con el flujo normal de Supabase / “Olvidé mi contraseña” en `somos@ecolink.com.ar`.

## 1. Aplicar migración en Supabase

En el [SQL Editor](https://supabase.com/dashboard) del proyecto:

- **Primera vez:** `supabase/migrations/20260519150000_auth_roles.sql`
- **Si sale** `type "user_role" already exists` **(ya corriste una parte):** usá en su lugar  
  `supabase/migrations/20260519160000_auth_roles_idempotent.sql`  
  (es seguro ejecutarlo completo otra vez).

## 2. Variables de entorno

En `.env.local` y en Vercel:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=...   # Settings → API Keys → Secret key (solo servidor)
```

En el dashboard nuevo de Supabase las claves se llaman **Publishable** (pública, ya la tenés) y **Secret** (privada). No existe un ítem que diga literalmente "role key": en la documentación vieja se llamaba `service_role`.

## 3. URLs de redirección en Supabase

**Authentication → URL Configuration:**

- Site URL: `http://localhost:3000` (o tu dominio en producción)
- Redirect URLs (agregá todas):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/callback?**`
  - `http://localhost:3000/auth/confirmar`
  - `http://localhost:3000/auth/actualizar-contrasena`

Los correos de invitación pasan primero por `/auth/callback` y luego a la pantalla de contraseña.

## 4. Crear el superadmin (primera vez)

1. En Supabase → **Authentication → Users** → **Add user**
2. Email: `somos@ecolink.com.ar`
3. Contraseña temporal y marcar email como confirmado
4. El trigger crea el perfil con rol `superadmin`
5. Iniciá sesión en `/login` y entrá a `/panel/usuarios`

## Permisos de usuarios

| Rol | Puede crear | Puede cambiar contraseña |
|-----|-------------|--------------------------|
| **Superadmin** | Admin y recolector | Admin y recolector |
| **Admin** | Solo recolector | Solo recolector |
| **Recolector** | — | — |

La gestión está en **`/panel/usuarios`** (visible en el menú para superadmin y admin).

## 5. Desactivar registro público

**Authentication → Providers → Email:** desactivá “Enable sign ups” para que nadie se registre solo; los usuarios los crean superadmin o admin desde la app.

## 6. Correos (fuera de Supabase)

Los invitaciones y cambios de contraseña **no usan** el correo de Supabase. Se envían con **Gmail** (cuenta de Ecolink).

Guía: [SETUP_EMAIL.md](./SETUP_EMAIL.md)

## 7. Plantillas de correo en Supabase (opcional)

**Authentication → Email Templates:** personalizá “Invite user” y “Reset password” con la marca Ecolink.
