# Integración Google Sheets — Rutas y recolecciones

## Modelo de datos

### Ruta (se agrupa automáticamente)

Una **ruta** se identifica por:

| Clave | Origen en planilla |
|-------|-------------------|
| **Fecha** | Columna `Dia` (YYYY-MM-DD) |
| **Turno** | Derivado de `Hora`: antes de 12:00 = Mañana, desde 12:00 = Tarde |
| **Recolector** | Columna `Recolector` (email que existe en la app) |

Si cambia la fecha, el turno o el recolector → es **otra ruta**.

### Recolección (cada fila de la planilla)

Cada fila es una recolección/cliente, único por **teléfono normalizado** dentro de la ruta.

## Columnas de la hoja `Rutas`

Fila 1 = encabezados exactos:

```
Zona | Nombre | Unidad | Tipo de servicio | Frecuencia | Barrio | Direccion | Depto | Telefono* | Observaciones | Dia | Hora | Nota encargado | Precio | Deuda | Recolector | Estado | MensajeSistema
```

### Obligatorios por fila

- Nombre, Direccion, Dia, Hora, Recolector, Telefono

### Enums

| Campo | Valores |
|-------|---------|
| Unidad | Hogar, Empresa, Puntos |
| Tipo de servicio | Reciclaje, Mixto, Organico |
| Frecuencia | Mensual, Puntual, Semanal |

### Estado (automático — no editar)

| Estado | Significado |
|--------|-------------|
| Pendiente | Lista para enviar (fondo amarillo) |
| Incompleto | Faltan datos (rojo suave) |
| Error | Datos inválidos (rojo suave + celda en rojo fuerte) |
| Enviada | Ya importada (verde, no se revalida) |

## Apps Script — instalación

1. Pegar `scripts/google-apps-script/ImportarRuta.gs` en Extensiones → Apps Script
2. **Configurar integración** → URL `https://app-recolectores.vercel.app` + secreto
3. **Actualizar desplegable recolectores** (trae emails de la base)
4. Completar filas de datos
5. **Validar todas las filas**
6. **Enviar pendientes a la app**

## API

- `GET /api/integrations/sheets/import-recolecciones` — lista recolectores
- `POST /api/integrations/sheets/import-recolecciones` — importa filas Pendiente

## Migraciones SQL (Supabase)

1. `20260521120000_rutas_sheets_import.sql`
2. `20260522120000_rutas_recolecciones_full.sql`

## Depto — evitar que Sheets lo convierta a fecha

Seleccioná la columna Depto → Formato → **Texto plano**.
