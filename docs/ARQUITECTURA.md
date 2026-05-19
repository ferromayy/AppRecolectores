# Arquitectura — App Recolectores

## Visión del producto

Sistema interno para un **intermediario logístico** que conecta:

| Actor | Rol |
|-------|-----|
| Generadores / empresas | Solicitan recolección de materiales |
| Intermediario (esta app) | Coordina, asigna y hace seguimiento |
| Cooperativas | Transforman productos recolectados |
| Recolectores / operaciones | Ejecutan la recolección en campo |

## Stack acordado

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (producción)                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js 16 · TypeScript                           │  │
│  │  · UI (App Router, React Server Components)        │  │
│  │  · Backend: Route Handlers /api/* + Server Actions │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │ @supabase/supabase-js + SSR
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (nube)                                         │
│  · PostgreSQL (datos)                                    │
│  · Auth (usuarios internos, futuro)                      │
│  · Storage (comprobantes, fotos, futuro)                   │
│  · RLS (seguridad por rol, futuro)                         │
└─────────────────────────────────────────────────────────┘
```

**Importante:** el “backend” no corre como servidor aparte en Supabase. Next.js en Vercel es el backend de aplicación; Supabase es la capa de datos y servicios gestionados.

## Carpetas clave

| Ruta | Uso |
|------|-----|
| `src/app/` | Páginas y rutas API |
| `src/lib/supabase/` | Clientes browser, server y admin |
| `src/types/domain.ts` | Modelo de negocio (TypeScript) |
| `src/types/database.ts` | Tipos generados desde Postgres |
| `supabase/migrations/` | SQL versionado del esquema |

## Flujo de despliegue

1. **Supabase:** crear proyecto, copiar URL y keys → `.env.local` / variables en Vercel.
2. **GitHub:** push del repo.
3. **Vercel:** importar repo, Framework Preset = Next.js, agregar las mismas env vars.
4. **Migraciones:** aplicar SQL en Supabase Dashboard o con `supabase db push` cuando uses CLI.

## Endpoints de diagnóstico

- `GET /api/health` — la app responde.
- `GET /api/db/status` — conectividad con Supabase.

## Próximos pasos sugeridos

1. Esquema inicial en `supabase/migrations` (actores, recolecciones, asignaciones).
2. Auth con roles (`intermediario`, `cooperativa`, etc.).
3. RLS alineado a cada rol.
4. Pantallas por journey (solicitud → asignación → recolección → planta).
