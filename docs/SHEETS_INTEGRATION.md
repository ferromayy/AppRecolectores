# Integración Google Sheets → App Recolectores

Importá una **ruta** desde Google Sheets con un botón, usando **Apps Script**.

> **MVP actual:** solo 3 datos por ruta — **nombre**, **fecha** y **asignado** (recolector).  
> Las paradas y columnas reales se agregan cuando la automatización esté validada.

## Arquitectura

```
Google Sheet (hoja "Rutas")
        │
        │  Botón → Apps Script
        ▼
POST /api/integrations/sheets/import-ruta
        │
        ▼
Supabase: tabla rutas
        │
        ▼
Panel admin → /panel/rutas
```

## 1. Configurar la app

En `.env.local` (y en Vercel):

```env
SHEETS_IMPORT_SECRET=un_secreto_largo_y_aleatorio
```

```bash
openssl rand -base64 32
```

## 2. Migración SQL

Ejecutá en Supabase: `supabase/migrations/20260521120000_rutas_sheets_import.sql`

## 3. Estructura de la planilla (MVP)

Hoja **`Rutas`** con **fila 1 = títulos** y **una ruta por fila** desde la fila 2:

| nombre | fecha | asignado |
|--------|-------|----------|
| Ruta Norte 19/05 | 2026-05-19 | recolector@ecolink.com.ar |
| Ruta Sur 19/05 | 2026-05-19 | otro@ecolink.com.ar |

- **nombre**: identificador de la ruta
- **fecha**: formato `YYYY-MM-DD` (Google Sheets puede usar celda fecha; el script la convierte)
- **asignado**: email del recolector (debe existir en la app). También acepta nombre completo si coincide exactamente
- Filas vacías se ignoran
- El botón importa **todas** las filas con datos de una vez

## 4. Apps Script

1. Abrí tu Google Sheet
2. **Extensiones → Apps Script**
3. Pegá `scripts/google-apps-script/ImportarRuta.gs`
4. Ejecutá **configurarIntegracion** (URL + secreto)
5. Recargá la planilla → menú **App Recolectores → Importar rutas a la app**
6. (Opcional) Botón de dibujo → función `importarRutas` (o `importarRutaActiva`)

## 5. Probar

1. Completá los 3 campos en la hoja `Rutas`
2. Importá desde el menú
3. Verificá en `/panel/rutas`

Reimportar la misma planilla **actualiza** la ruta existente.

## 6. API (referencia)

**POST** `/api/integrations/sheets/import-ruta`

```json
{
  "ruta": {
    "nombre": "Ruta Norte",
    "fecha": "2026-05-19",
    "asignado": "recolector@ecolink.com.ar"
  }
}
```

Respuesta:

```json
{
  "ok": true,
  "ruta_id": "uuid",
  "paradas_count": 0,
  "reimported": false,
  "warnings": [],
  "message": "Ruta \"Ruta Norte\" importada."
}
```

## Próximo paso

Cuando funcione el flujo básico, se activa el envío de **paradas** (direcciones, generadores, etc.) desde otra hoja de la misma planilla.
