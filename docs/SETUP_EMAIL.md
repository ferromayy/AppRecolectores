# Correos sin depender de Supabase

La app puede **enviar mails por SMTP** o, si no configurás correo, **mostrar un enlace para copiar** (WhatsApp, etc.).

## Si no podés activar verificación en 2 pasos en Google

Las **contraseñas de aplicación de Gmail** exigen 2FA. Sin eso, tenés estas opciones:

### Opción A — Seguir sin correo automático (más simple)

No completes `GMAIL_APP_PASSWORD`. La app funciona igual:

- Crear usuarios, organizaciones y recolecciones ✅  
- Invitaciones / reset de contraseña → **enlace para copiar** en pantalla  

Ideal mientras definen correo corporativo.

### Opción B — SMTP del proveedor de `@ecolink.com.ar` (recomendado)

Si el correo `somos@ecolink.com.ar` está en **Hostinger, DonWeb, cPanel, Microsoft 365**, etc., usá el SMTP de ese proveedor (suele bastar usuario + contraseña del buzón, **sin** 2FA de Google).

En `.env.local`:

```env
SMTP_HOST=mail.ecolink.com.ar
SMTP_PORT=587
SMTP_USER=somos@ecolink.com.ar
SMTP_PASS=la_contraseña_del_buzón
EMAIL_FROM=somos@ecolink.com.ar
EMAIL_FROM_NAME=App Recolectores Ecolink
```

Los datos exactos (`SMTP_HOST`, puerto 465 o 587) los da quien hospeda el dominio o en el panel de correo.

### Opción C — Gmail con 2FA en otra cuenta

Cuenta **solo para la app** (ej. `app.recolectores@gmail.com`) con 2FA + contraseña de aplicación. No afecta tu cuenta personal si otras herramientas usan otra.

---

## Gmail con 2FA (si en el futuro podés)

1. [Seguridad Google](https://myaccount.google.com/security) → Verificación en 2 pasos  
2. [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords)  
3. En `.env.local`:

```env
GMAIL_USER=somos@ecolink.com.ar
GMAIL_APP_PASSWORD=16caracteressins espacios
EMAIL_FROM_NAME=App Recolectores Ecolink
```

---

## Reiniciar

```bash
npm run dev
```

## Probar

Superadmin → crear admin o “Enviar correo para cambiar contraseña”.  
Si SMTP está bien configurado, llega el mail; si no, copiás el enlace que muestra la app.
