# Autenticación y roles

## Roles

| Rol | Quién lo crea | Correo |
|-----|---------------|--------|
| **superadmin** | Solo `somos@ecolink.com.ar` (automático al registrarse) | Fijo: somos@ecolink.com.ar |
| **admin** | Superadmin | Cualquier correo interno |
| **recolector** | Superadmin | Cualquier correo interno |

## Reglas de contraseña

- **Admin y recolector:** el superadmin los crea por invitación y, si necesitan cambiar la contraseña después, **solo el superadmin** puede disparar el correo de recuperación desde `/admin/usuarios`.
- **Superadmin:** gestiona su propia contraseña con el flujo normal de Supabase / “Olvidé mi contraseña” en `somos@ecolink.com.ar` (no desde el panel de usuarios).

## 1. Aplicar migración en Supabase

En el [SQL Editor](https://supabase.com/dashboard) del proyecto, ejecutá el contenido de:

`supabase/migrations/20260519150000_auth_roles.sql`

## 2. Variables de entorno

En `.env.local` y en Vercel:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...   # Settings → API → service_role (solo servidor)
```

## 3. URLs de redirección en Supabase

**Authentication → URL Configuration:**

- Site URL: `http://localhost:3000` (o tu dominio en producción)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirmar`
  - `http://localhost:3000/auth/actualizar-contrasena`

## 4. Crear el superadmin (primera vez)

1. En Supabase → **Authentication → Users** → **Add user**
2. Email: `somos@ecolink.com.ar`
3. Contraseña temporal y marcar email como confirmado
4. El trigger crea el perfil con rol `superadmin`
5. Iniciá sesión en `/login` y entrá a `/admin/usuarios`

## 5. Desactivar registro público

**Authentication → Providers → Email:** desactivá “Enable sign ups” para que nadie se registre solo; solo el superadmin crea usuarios desde la app.

## 6. Plantillas de correo (opcional)

**Authentication → Email Templates:** personalizá “Invite user” y “Reset password” con la marca Ecolink.
