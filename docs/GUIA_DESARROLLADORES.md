# Guía para desarrolladores — App Recolectores

Documentación de onboarding técnico para quien se sume al proyecto. Cubre stack, entorno local, base de datos, arquitectura, APIs y despliegue.

**Producción:** https://app-recolectores.vercel.app  
**Manual de uso (no técnico):** [MANUAL_USUARIO.md](./MANUAL_USUARIO.md)

**Cambios recientes (jun 2026):** Operativo / Historial / KPIs / Parámetros; estado `cerrada` y cierre operario; reactivar; export CSV; columnas `unidad` y `tipo_servicio` en tablas; reglas de cobro Empresa / Mixto / estándar; cuatro claves en `sistema_precio_historial`; API genérica `/api/panel/parametros/[clave]`.

---

## 1. Qué es esta app

App interna de **Ecolink** para operaciones de recolección en campo:

- Importar rutas y paradas desde **Google Sheets**
- Gestionar rutas y recolecciones desde el **panel operario** (admin / superadmin)
- Ejecutar la jornada desde el **panel recolector** (mobile-first): inicio de ruta, navegación, carga por parada

### Stack

| Capa | Tecnología |
|------|------------|
| Frontend + API | Next.js 16, React 19, TypeScript, App Router, Tailwind CSS 4 |
| Base de datos + Auth | Supabase (PostgreSQL + Auth) |
| Deploy app | Vercel (conectado a GitHub) |
| Planillas | Google Sheets + Apps Script |
| Mapas (operario) | Google Maps JavaScript API + Geocoding API |

---

## 2. Primeros pasos (15 minutos)

### Clonar e instalar

```bash
git clone https://github.com/ecolink2024/AppRecolectores.git
cd AppRecolectores
cp .env.example .env.local
npm install
npm run dev
```

Abrí http://localhost:3000. La home muestra el **estado de conexión** con Supabase.

### Verificar que todo responde

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/db/status
```

### Variables de entorno obligatorias

En `.env.local` (ver `.env.example`):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de servidor — **nunca commitear** |
| `NEXT_PUBLIC_SITE_URL` | URL base para enlaces de auth (`http://localhost:3000` en local) |

### Variables opcionales (según feature)

| Variable | Para qué |
|----------|----------|
| `SHEETS_IMPORT_SECRET` | Importación desde Google Sheets |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa en panel operario (navegador) |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | Geocodificación en servidor |
| `GMAIL_*` o `SMTP_*` | Envío de correos (invitaciones, reset de contraseña) |
| `SUPABASE_DB_URL` | Script `scripts/apply-pending-migrations.mjs` |

Guías detalladas:

- Auth: [SETUP_AUTH.md](./SETUP_AUTH.md)
- Email: [SETUP_EMAIL.md](./SETUP_EMAIL.md)
- Sheets: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)
- Maps: [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

---

## 3. Base de datos y migraciones

### Modelo principal (operativo actual)

```
rutas
  └── ruta_recolecciones (paradas / clientes)
profiles (usuarios con rol)
sistema_precio_historial (parámetros de precio con vigencia)
```

Una **ruta** se agrupa por `(fecha, turno, recolector)`. Cada fila de la planilla es una **recolección**, única por teléfono normalizado dentro de la ruta.

Tablas legacy (`organizaciones`, `recolecciones`) existen en migraciones tempranas pero el flujo operativo actual usa `rutas` + `ruta_recolecciones`.

### Aplicar migraciones

**Opción A — Supabase CLI (recomendada):**

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

**Opción B — Script del repo:**

```bash
# Agregar SUPABASE_DB_URL en .env.local (Connection string URI del dashboard)
node scripts/apply-pending-migrations.mjs
```

**Opción C — SQL Editor:** copiar el SQL que imprime el script anterior, o ejecutar archivos de `supabase/migrations/` en orden.

### Migraciones (orden cronológico)

| Archivo | Qué hace |
|---------|----------|
| `20260519150000_auth_roles.sql` | Roles, perfiles, trigger de auth |
| `20260519160000_auth_roles_idempotent.sql` | Versión idempotente del anterior |
| `20260520120000_domain_recolecciones.sql` | Tablas legacy organizaciones/recolecciones |
| `20260521120000_rutas_sheets_import.sql` | Tabla `rutas` + import Sheets |
| `20260522120000_rutas_recolecciones_full.sql` | `ruta_recolecciones` completa, turnos, estados operativos |
| `20260522130000_rutas_recolecciones_telefono_not_null.sql` | Teléfono obligatorio |
| `20260523120000_rutas_operativo_campos.sql` | Cierre jornada, km, cobros, firma |
| `20260524120000_rutas_inicio_insumos.sql` | Km inicial + insumos al iniciar ruta |
| `20260524130000_recoleccion_campo_campos.sql` | Bolsas, biotachos, QR, cancelación |
| `20260524140000_fix_missing_operativo_columns.sql` | Reparación idempotente + reload schema PostgREST |
| `20260525120000_sistema_parametros_precio.sql` | Tabla `sistema_precio_historial` (precio bolsa extra vigente) |
| `20260526120000_ruta_estado_suspendida.sql` | Estado `suspendida` en enum `ruta_estado` |
| `20260531120000_ruta_cierre_recolector_campos.sql` | Campos de cierre: km final, descarga, gastos, total efectivo, observaciones recolector |
| `20260601120000_ruta_estado_terminada.sql` | Estado `cerrada` en enum `ruta_estado` (cierre operario → Historial) |
| `20260602120000_ruta_estado_terminada_a_cerrada.sql` | Renombra `terminada` → `cerrada` si existía; idempotente |

Columnas de **cierre operario** en `rutas` (desde `20260523120000` / `20260524140000`): `cierre_operario_at`, `cierre_operario_por`.

> **Importante:** si aparece `Could not find the '...' column in the schema cache`, ejecutá la migración faltante y/o el `NOTIFY pgrst, 'reload schema'` del archivo `20260524140000`.

### Primer superadmin

1. Crear usuario `somos@ecolink.com.ar` en Supabase Auth
2. El trigger crea el perfil con rol `superadmin`
3. Desactivar registro público en Supabase

Ver [SETUP_AUTH.md](./SETUP_AUTH.md).

---

## 4. Estructura del código

```
src/
  app/
    api/                    # Route Handlers (backend)
    auth/                   # Callback, confirmar invitación, cambiar contraseña
    login/
    panel/                  # UI autenticada
      historial/            # Rutas cerradas / canceladas (staff)
      kpis/                 # Indicadores agregados (staff)
      mis-rutas/            # Recolector
      parametros/           # Parámetros de sistema (staff)
      usuarios/             # Gestión de usuarios
  components/
    admin/                  # Panel de usuarios
    auth/                   # Login, formularios auth
    panel/
      operario/             # Dashboard staff (admin/superadmin)
      recolector/           # UI mobile campo
  lib/
    auth/                   # Sesión, permisos, constantes de rol
    data/                   # Fetchers server-side
    domain/                 # Lógica de negocio, validaciones, formatters
    integrations/           # Sheets, geocoding
    supabase/               # Clientes browser, server, admin, middleware
  types/
    database.ts             # Tipos generados de Supabase
supabase/migrations/
scripts/
docs/
```

### Convenciones

- **Lógica de negocio** en `src/lib/domain/` — validaciones, parsers, builders de DTOs
- **APIs privilegiadas** usan `createAdminClient()` (service role) con verificación de rol en código
- **UI operario** = desktop/tablet; **UI recolector** = mobile (`max-w-lg`, bottom nav, safe areas)
- Cambios mínimos y focalizados; seguir patrones existentes en cada carpeta

---

## 5. Roles y permisos

| Rol | Email típico | Panel principal |
|-----|--------------|-----------------|
| `superadmin` | `somos@ecolink.com.ar` (fijo) | Operativo + usuarios (admin y recolector) |
| `admin` | Cualquier interno | Operativo + usuarios (solo recolectores) |
| `recolector` | Email del campo | `/panel/mis-rutas` (mobile) |

Matriz resumida (`src/lib/auth/permissions.ts`):

| Acción | superadmin | admin | recolector |
|--------|:----------:|:-----:|:----------:|
| Panel operario (Operativo, Historial, KPIs) | ✅ | ✅ | ❌ |
| Crear admin | ✅ | ❌ | ❌ |
| Crear recolector | ✅ | ✅ | ❌ |
| Reset password admin | ✅ | ❌ | ❌ |
| Reset password recolector | ✅ | ✅ | ❌ |
| Iniciar ruta / carga en campo | ❌ | ❌ | ✅ (propias rutas) |

**Middleware** (`src/middleware.ts` → `src/lib/supabase/middleware.ts`): protege `/panel/*`, redirige recolectores logueados a `/panel/mis-rutas`.

---

## 6. Rutas de la aplicación

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/login` | Público | Inicio de sesión |
| `/panel` | Todos | Staff → dashboard operario. Recolector → home (Hoy / Última jornada) |
| `/panel` | superadmin, admin | **Operativo:** rutas no historial (activas, en curso, realizadas, suspendidas) |
| `/panel/historial` | superadmin, admin | Rutas `cerrada` o `cancelada`; tablas ampliadas + export CSV |
| `/panel/kpis` | superadmin, admin | KPIs por período (presets o `?desde=&hasta=`) + export CSV |
| `/panel/parametros` | superadmin, admin | Cuatro precios con historial (`operario-parametros-sistema.tsx`) |
| `/panel/usuarios` | superadmin, admin | Alta y gestión de usuarios |
| `/panel/mis-rutas` | recolector | Rutas asignadas (Activas / Completadas / Suspendidas) |
| `/panel/mis-rutas/[id]` | recolector | Detalle de ruta + lista de paradas + botón **Finalizar ruta** |
| `/panel/mis-rutas/[id]/iniciar` | recolector | Formulario km + insumos |
| `/panel/mis-rutas/[id]/finalizar` | recolector | Formulario de cierre de ruta (km finales, gastos, observaciones) |
| `/panel/mis-rutas/[id]/recolecciones/[recoleccionId]` | recolector | Carga en campo por parada |

Aliases que redirigen: `/panel/rutas`, `/panel/recolecciones`, `/admin/usuarios` → rutas actuales.

---

## 7. APIs

### Salud y auth

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | Público |
| GET | `/api/db/status` | Público |
| POST | `/api/auth/session` | Público (tokens de invitación) |

### Admin / usuarios

| Método | Endpoint | Auth |
|--------|----------|------|
| GET/POST | `/api/admin/users` | superadmin, admin |
| POST | `/api/admin/users/[id]/reset-password` | según permisos |

### Panel operario (staff)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PATCH | `/api/panel/rutas/[id]` | Editar ruta |
| DELETE | `/api/panel/rutas/[id]` | Eliminar ruta |
| POST | `/api/panel/rutas/[id]/suspender` | Suspender ruta (`activa` / `en_curso` / `borrador` → `suspendida`) |
| DELETE | `/api/panel/rutas/[id]/suspender` | Reactivar (`completada` \| `suspendida` → `en_curso`; limpia cierre operario y, si aplica, cierre recolector) |
| POST | `/api/panel/rutas/[id]/cierre-operario` | Cierre operario (`completada` → `cerrada`; setea `cierre_operario_at` / `cierre_operario_por`) |
| POST | `/api/panel/rutas/[id]/recolecciones` | Agregar parada (bloqueado si ruta `completada` o `cerrada`) |
| PATCH | `/api/panel/rutas/[id]/recolecciones/[recoleccionId]` | Editar parada |
| DELETE | `/api/panel/rutas/[id]/recolecciones/[recoleccionId]` | Eliminar parada |
| PATCH | `/api/panel/rutas/[id]/recolecciones/reorden` | Reordenar (`{ orden: string[] }`) |
| GET | `/api/panel/rutas/[id]/mapa` | Puntos geocodificados para mapa |
| GET/POST | `/api/panel/parametros/[clave]` | Historial y alta de precio (`bolsa-extra`, `retiro-reciclable-mixto`, `bolsa-punto`, `bolsa-llena-punto`) |

### Recolector

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| POST | `/api/recolector/rutas/[id]/iniciar` | `{ km_inicial, insumos[] }` | Pasa ruta a `en_curso` |
| POST | `/api/recolector/rutas/[id]/finalizar` | ver cierre abajo | Cierra ruta (`completada`) si cumple condiciones |
| PATCH | `/api/recolector/rutas/[id]/recolecciones/[recoleccionId]/campo` | ver dominio | Carga retiro/cobro/firma |

Validación de carga en campo: `src/lib/domain/recolector-recoleccion-campo.ts`  
Validación inicio de ruta: `src/lib/domain/ruta-insumos.ts`  
Validación finalizar ruta: `src/lib/domain/recolector-finalizar-ruta.ts`  
Validación cierre de ruta: `src/lib/domain/recolector-cierre-ruta.ts`  
Precio total a cobrar (reglas Empresa / Mixto / estándar): `src/lib/domain/sistema-parametros.ts` (`calcPrecioTotalCobrarConReglas`, `buildPrecioCobroDetalle`)

### Integración Sheets

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/integrations/sheets/import-recolecciones` | `Bearer SHEETS_IMPORT_SECRET` |
| POST | `/api/integrations/sheets/import-recolecciones` | idem |

Script Apps Script: `scripts/google-apps-script/ImportarRuta.gs`  
Doc: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)

---

## 8. Flujos técnicos clave

### Importación Sheets → Supabase

1. Operario completa planilla Google Sheets (columnas documentadas en SHEETS_INTEGRATION)
2. Apps Script valida filas y POST a `/api/integrations/sheets/import-recolecciones`
3. API agrupa filas en rutas por `(Dia, turno derivado de Hora, email Recolector)`
4. Cada fila → `ruta_recolecciones` (única por teléfono normalizado)

### Panel operario

**Operativo** (`/panel`) y **Historial** (`/panel/historial`) comparten `operario-dashboard.tsx` con distinto conjunto de rutas:

- Operativo: `esRutaOperativa(estado)` — incluye `completada` (Realizado) y `suspendida`
- Historial: `RUTA_ESTADOS_HISTORIAL` = `cerrada`, `cancelada` (`ruta-estado-transiciones.ts`)

Componentes en `src/components/panel/operario/`:

| Componente | Función |
|------------|---------|
| `operario-dashboard.tsx` | Orquestador Operativo / Historial; cierre operario, export historial |
| `operario-rutas-table.tsx` | Tabla Operativo (Suspender, Reactivar, Cierre operario) |
| `operario-historial-rutas-table.tsx` | Tabla Historial (columnas ampliadas, insumos) |
| `operario-recolecciones-table.tsx` | Paradas en Operativo (editable; columnas `unidad`, `tipo_servicio`) |
| `operario-historial-recolecciones-table.tsx` | Paradas en Historial (incl. `unidad`, `tipo_servicio` tras hora real) |
| `operario-cliente-detalle-modal.tsx` | Popup datos del cliente desde Historial |
| `operario-ruta-map-modal.tsx` | Mapa + drag-and-drop reorder |
| `operario-ruta-detalle-modal.tsx` | Detalle + suspender/reactivar |
| `operario-kpis-dashboard.tsx` | Secciones KPI + gráfico recaudación |
| `operario-kpis-filtro-fechas.tsx` | Presets y rango `desde`/`hasta` → `/panel/kpis?...` |
| `operario-kpi-recaudacion-chart.tsx` | Gráfico barras por día |
| `operario-kpi-por-zona-table.tsx` | Desglose por zona |
| Modales de edición de ruta y recolección | |
| `operario-parametros-sistema.tsx` | Orquesta secciones de precios (`PARAMETRO_PRECIO_ORDEN`) |
| `operario-parametro-precio-section.tsx` | Bloque reutilizable por parámetro (form + historial) |

Datos:

- `src/lib/data/operario-dashboard.ts` — Operativo / Historial (~200 rutas por vista)
- `src/lib/data/operario-kpis.ts` — KPIs: rutas por `fecha` en rango, `.limit(5000)` + recolecciones de esas rutas

Dominio KPI: `src/lib/domain/operario-kpis.ts` (`resolveKpiFiltroFechas`, `buildOperarioKpis`, constante `KPI_LABEL_SERVICIOS` = `"Recolecciones (servicios)"`).

Exportación CSV (cliente):

- `src/lib/domain/csv-download.ts` — `downloadCsvFile()` (UTF-8 BOM, `;` separador)
- `src/lib/domain/operario-kpis-export.ts` — filas del dashboard KPI
- `src/lib/domain/operario-historial-export.ts` — rutas + recolecciones del historial

Navegación staff: `panel-shell.tsx` — enlaces Operativo, KPIs, Historial, Parámetros, Usuarios. Middleware permite `/panel/historial` y `/panel/kpis` solo a staff.

### Parámetros de sistema

Ruta `/panel/parametros` (staff). Tabla `sistema_precio_historial` (migración `20260525120000`); una fila activa por `clave` (`vigencia_hasta IS NULL`).

| Slug API | Clave DB | Uso en app |
|----------|----------|------------|
| `bolsa-extra` | `bolsa_extra` | Cobro estándar y Mixto 3+ bolsas |
| `retiro-reciclable-mixto` | `retiro_reciclable_mixto` | Cobro Mixto (1–2 bolsas incluidas en un solo monto) |
| `bolsa-punto` | `bolsa_punto` | Configurado; pendiente de lógica de cobro |
| `bolsa-llena-punto` | `bolsa_llena_punto` | Configurado; pendiente de lógica de cobro |

Constantes y UI: `PARAMETRO_PRECIO_SLUGS`, `PARAMETRO_PRECIO_ORDEN`, `PARAMETRO_PRECIO_UI` en `sistema-parametros.ts`.

- Alta: `POST /api/panel/parametros/[clave]` con `{ precio }` — cierra vigente anterior e inserta nueva fila
- Lectura activa: `fetchPrecioActivoByClave(clave)` o helpers (`fetchPrecioBolsaExtraActivo`, etc.)
- Página: `src/app/panel/parametros/page.tsx` carga historial de las cuatro claves en paralelo

### Reglas de cobro en campo (recolector)

Entrada: `PrecioCobroInput` (`unidad`, `tipoServicio`, `precioRetiro` de planilla, `precioBolsaExtra`, `precioRetiroReciclableMixto`, `bolsasLlenas`).

Resolución de regla (`resolvePrecioCobroRegla`): **Empresa** gana sobre Mixto si ambos aplican.

| Regla | Condición | Total |
|-------|-----------|-------|
| `empresa_punto` | `unidad === "Empresa"` y `tipo_servicio` Punto/Puntos | `bolsasLlenasPunto × precioBolsaLlenaPunto + bolsasNuevasVendidas × precioBolsaPunto` |
| `empresa` | `unidad === "Empresa"` (sin Punto) | `precioRetiro` |
| `mixto` | `tipo_servicio === "Mixto"` | `0 bolsas` → `precioRetiro`; `1–2` → `precioRetiroReciclableMixto`; `3+` → mixto + `bolsaExtra × (bolsas−2)` |
| `estandar` | resto | `precioRetiro + bolsaExtra × max(0, bolsas−2)` |

Columnas DB (`20260603120000_recoleccion_empresa_punto_campos.sql`): `bolsas_llenas_punto`, `bolsas_nuevas_vendidas`. `bolsas_llenas` = hogar en UI Empresa+Punto.

Implementación: `calcPrecioTotalCobrarConReglas`, `buildPrecioCobroDetalle` en `sistema-parametros.ts`.

Consumidores:

- UI: `recolector-recoleccion-campo-form.tsx` (desglose y `ayudaCobro`)
- API: `parseRecoleccionCampoBody` en `recolector-recoleccion-campo.ts` — valida suma de pagos ≥ total
- Página: `mis-rutas/.../recoleccionId/page.tsx` — fetch `fetchPrecioBolsaExtraActivo` + `fetchPrecioRetiroReciclableMixtoActivo`
- PATCH: `api/recolector/.../campo/route.ts` — mismos precios en servidor

Enums de planilla (`sheet-recoleccion-validation.ts`): `UNIDADES` = Hogar, Empresa, Puntos; `TIPOS_SERVICIO` = Reciclaje, Mixto, Organico, Punto.

### Panel recolector

Componentes en `src/components/panel/recolector/`:

| Componente | Función |
|------------|---------|
| `recolector-shell.tsx` | Layout mobile + header + bottom nav |
| `mis-rutas-cards.tsx` | Listado agrupado por categoría (Activas / Completadas / Suspendidas) |
| `recolector-ruta-detalle.tsx` | Detalle, Maps, lista de paradas, botón **Finalizar ruta** |
| `recolector-finalizar-ruta-form.tsx` | Formulario de cierre antes de finalizar |
| `recolector-inicio-ruta-form.tsx` | Km + insumos |
| `recolector-recoleccion-campo-form.tsx` | Carga por parada (desglose según regla empresa/mixto/estándar) |
| `recolector-recoleccion-sheet.tsx` | Preview read-only (ruta no iniciada) |

Dominio: `src/lib/domain/recolector-ruta.ts`, `recolector-recoleccion-form.ts`, `recolector-rutas-list.ts`, `ruta-estado-transiciones.ts`

**Estados de ruta:** `borrador`, `activa`, `en_curso`, `completada` (UI: Realizado), `cerrada` (Historial), `cancelada`, `suspendida`

```
Operativo                          Historial
─────────                          ─────────
borrador, activa, en_curso    →    cerrada (POST cierre-operario desde completada)
completada, suspendida             cancelada
```

Transiciones staff: `src/lib/domain/ruta-estado-transiciones.ts` (`puedeSuspenderRuta`, `puedeReactivarRuta`, `puedeCierreOperario`, `limpiezaTrasReactivar`).

**Estados de parada:** `pendiente`, `en_camino`, `visitada`, `omitida`, `cancelada`

**Bloqueos recolector:** no editar carga si parada ya `visitada`/`cancelada`; no PATCH campo si ruta `completada`, `cerrada`, `cancelada` o `suspendida` (API + UI read-only).

#### Finalizar ruta (recolector)

Condiciones previas (cliente y servidor en `recolector-finalizar-ruta.ts`):

1. Ruta en estado `en_curso` (o con `inicio_jornada_at` en columna o `metadata`)
2. Todas las paradas en `visitada` o `cancelada` (pendientes u omitidas bloquean)

Flujo:

1. Botón **Finalizar ruta** en detalle → navega a `/panel/mis-rutas/[id]/finalizar`
2. Formulario de cierre (`recolector-finalizar-ruta-form.tsx`)
3. `POST /api/recolector/rutas/[id]/finalizar` con body de cierre
4. Ruta pasa a `completada`, se guarda `cierre_recolector_at` y datos de cierre
5. UI redirige a `/panel`
6. Staff puede aplicar **Cierre operario** → `cerrada` (Historial); hasta entonces la ruta sigue en Operativo

Body de cierre (`recolector-cierre-ruta.ts`):

```json
{
  "km_final": 45200,
  "descarga": true,
  "combustible": 0,
  "descuento": 0,
  "otros_gastos": 0,
  "total_efectivo": 15000,
  "observaciones_recolector": "Opcional"
}
```

Validaciones de cierre:

- `km_final` obligatorio; **≥ km_inicial**
- `combustible`, `descuento`, `otros_gastos`: ≥ 0
- Si **efectivo recaudado = 0**, no se permiten gastos
- Gastos no pueden superar el efectivo recaudado
- `total_efectivo = efectivo recaudado − combustible − descuento − otros_gastos`

Columnas en `rutas` (migración `20260531120000`): `km_final`, `descarga`, `combustible`, `descuento`, `otros_gastos`, `total_efectivo`, `observaciones_recolector`

#### Ruta iniciada (detección unificada)

Función `getInicioJornadaAt()` en `recolector-ruta.ts`:

- Lee `inicio_jornada_at` de columna **o** de `metadata.inicio_jornada_at`
- Una ruta se considera iniciada si `estado === "en_curso"` **o** existe inicio de jornada

Usada en detalle recolector, formulario de campo, API PATCH de carga y evaluación de finalizar.

#### Suspender, reactivar y cierre operario (staff)

- **Suspender:** `POST .../suspender` desde `borrador`, `activa`, `en_curso` → `suspendida`
- **Reactivar:** `DELETE .../suspender` desde `completada` o `suspendida` → `en_curso`; aplica `limpiezaTrasReactivar()` (borra `cierre_operario_*`; si venía de `completada`, también cierre recolector y gastos)
- **Cierre operario:** `POST .../cierre-operario` desde `completada` → `cerrada`; solo en Operativo (no en Historial)
- Recolector bloqueado en `suspendida`, `completada`, `cerrada`, `cancelada`

#### KPIs (staff)

- Página: `src/app/panel/kpis/page.tsx` — query `periodo` | `desde` + `hasta`
- Filtro: `resolveKpiFiltroFechas()` — si `desde` y `hasta` válidos, rango custom; si no, preset (`7d`, `30d`, `mes`, `90d`)
- Agregación en memoria sobre rutas del rango (por `rutas.fecha`) y sus `ruta_recolecciones`
- Export: botón en `operario-kpis-dashboard.tsx` → `operario-kpis-export.ts`

#### Validación de pagos en campo

En `recolector-recoleccion-campo.ts`:

- Efectivo, transferencia y QR: obligatorios, mínimo 0 (default `"0"` en el form)
- Suma de los tres montos **≥ total a cobrar** (puede ser mayor, no menor)

#### Recolecciones manuales (operario)

Al crear/editar parada desde el panel (`operario-recoleccion-form-modal.tsx`), campos adicionales:

- `precio`, `deuda`, `frecuencia`, `tipo_servicio`, `unidad`

Parser: `parseRecoleccionFields()` en `operario-crud.ts`.

**Restricción:** no se puede agregar/editar parada en ruta `completada` o `cerrada` (409 en API; botón deshabilitado en UI). En Historial las tablas son solo lectura.

#### UX: botones deshabilitados

Cuando una acción está bloqueada, la UI debe mostrar **el motivo visible** (texto debajo del botón o recuadro informativo), no solo `disabled` o `title`. Ejemplos:

- Finalizar ruta sin km finales
- Gastos sin efectivo recaudado
- Agregar recolección en ruta finalizada

#### Fechas y timezone

Formateo de fechas/horas usa `timeZone: "America/Argentina/Buenos_Aires"` en:

- `formatInicioJornada()` (recolector)
- `formatDateTime()` / `formatHoraReal()` (operario)

El home del recolector (`/panel`) calcula “hoy” con timezone Argentina y muestra **Última jornada** si no hay rutas de hoy.

---

## 9. Scripts de mantenimiento

| Script | Uso |
|--------|-----|
| `scripts/apply-pending-migrations.mjs` | Aplicar migraciones operativas/recolector |
| `scripts/reset-superadmin-password.mjs` | Reset de contraseña del superadmin vía API |
| `scripts/reset-users-except-superadmin.mjs` | Limpiar usuarios Auth (excepto superadmin) |
| `scripts/google-apps-script/ImportarRuta.gs` | Menú en Google Sheets |

---

## 10. Despliegue

### Vercel

1. Push a GitHub → deploy automático
2. Configurar **las mismas variables** que `.env.local` en Vercel → Settings → Environment Variables
3. Incluir `SUPABASE_SERVICE_ROLE_KEY` en Production (y Preview si aplica)

### Supabase (post-deploy)

- **Authentication → URL Configuration:** agregar `https://app-recolectores.vercel.app/auth/callback` y `/auth/confirmar`
- Aplicar migraciones si el entorno remoto está desactualizado
- Verificar que el schema cache de PostgREST esté al día

### Google Cloud (mapas)

- Restricciones HTTP referrer para la key pública (localhost + dominio Vercel)
- Geocoding key restringida por IP del servidor
- Ver [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

---

## 11. Comandos útiles

```bash
npm run dev      # Desarrollo local
npm run build    # Build de producción (correr antes de PR)
npm run lint     # ESLint
npm run start    # Servidor de producción local
```

---

## 12. Checklist para un PR

- [ ] `npm run build` pasa sin errores
- [ ] Si hay cambios de schema: migración SQL en `supabase/migrations/` + tipos en `src/types/database.ts`
- [ ] Variables nuevas documentadas en `.env.example`
- [ ] Permisos verificados por rol (no confiar solo en ocultar botones en UI)
- [ ] Flujo recolector probado en viewport mobile (~390px)

---

## 13. Referencias rápidas

| Tema | Archivo |
|------|---------|
| Arquitectura general | [ARQUITECTURA.md](./ARQUITECTURA.md) |
| Manual de usuarios | [MANUAL_USUARIO.md](./MANUAL_USUARIO.md) |
| Tipos de DB | `src/types/database.ts` |
| Constantes de dominio | `src/lib/domain/constants.ts` |
| Finalizar ruta (dominio) | `src/lib/domain/recolector-finalizar-ruta.ts` |
| Cierre de ruta (dominio) | `src/lib/domain/recolector-cierre-ruta.ts` |
| Formulario cierre recolector | `src/components/panel/recolector/recolector-finalizar-ruta-form.tsx` |
| Estados ruta / historial / reactivar | `src/lib/domain/ruta-estado-transiciones.ts` |
| KPIs y filtros de fecha | `src/lib/domain/operario-kpis.ts` |
| Fetch KPIs | `src/lib/data/operario-kpis.ts` |
| Export CSV KPIs / Historial | `operario-kpis-export.ts`, `operario-historial-export.ts`, `csv-download.ts` |
| Cierre operario API | `src/app/api/panel/rutas/[id]/cierre-operario/route.ts` |
| Listado recolector por categoría | `src/lib/domain/recolector-rutas-list.ts` |
| Precios de sistema (claves, slugs API) | `src/lib/domain/sistema-parametros.ts` |
| Fetch precio activo / historial | `src/lib/data/sistema-parametros.ts` |
| Cobro en campo (parse + reglas) | `src/lib/domain/recolector-recoleccion-campo.ts` |
| Formulario campo recolector | `src/lib/domain/recolector-recoleccion-form.ts` |
| Permisos | `src/lib/auth/permissions.ts` |

Si algo no está documentado aquí, buscá en `docs/` o en el código bajo `src/lib/domain/` — ahí vive la lógica de negocio explícita.
