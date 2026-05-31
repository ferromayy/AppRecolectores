# Manual de uso — App Recolectores

Guía para usuarios de la app **sin conocimientos de programación**. Explica qué puede hacer cada rol y cómo usar las pantallas del día a día.

**App en producción:** https://app-recolectores.vercel.app

---

## Índice

1. [Acceso a la app](#1-acceso-a-la-app)
2. [Roles: quién puede hacer qué](#2-roles-quién-puede-hacer-qué)
3. [Superadmin](#3-superadmin)
4. [Operario (admin)](#4-operario-admin)
5. [Recolector](#5-recolector)
6. [Planilla Google Sheets](#6-planilla-google-sheets)
7. [Problemas frecuentes](#7-problemas-frecuentes)

---

## 1. Acceso a la app

### Ingresar

1. Abrí https://app-recolectores.vercel.app (o la URL que te haya dado el equipo)
2. Tocá **Iniciar sesión** o andá directo a `/login`
3. Escribí tu **correo** y **contraseña**
4. Al entrar, la app te lleva automáticamente a tu panel según tu rol:
   - **Recolector** → pantalla de rutas (mobile)
   - **Operario o Superadmin** → panel operativo (escritorio)

### Cambiar contraseña

- Si te crearon la cuenta con contraseña inicial, el superadmin puede enviarte un correo para cambiarla desde **Usuarios**
- El superadmin principal (`somos@ecolink.com.ar`) usa el flujo normal de “olvidé mi contraseña” de Supabase

### Salir

- En cualquier pantalla hay un botón **Salir** (arriba a la derecha)

---

## 2. Roles: quién puede hacer qué

| Función | Superadmin | Operario (admin) | Recolector |
|---------|:----------:|:----------------:|:----------:|
| Ver panel operativo (rutas, mapas, recolecciones) | ✅ | ✅ | ❌ |
| Crear usuarios **operario** | ✅ | ❌ | ❌ |
| Crear usuarios **recolector** | ✅ | ✅ | ❌ |
| Cambiar contraseña de operarios | ✅ | ❌ | ❌ |
| Cambiar contraseña de recolectores | ✅ | ✅ | ❌ |
| Ver y ejecutar **mis rutas** en el celular | ❌ | ❌ | ✅ |
| Iniciar ruta, cargar paradas, cobrar | ❌ | ❌ | ✅ |

**Operario** y **Superadmin** comparten el mismo panel de seguimiento. La diferencia principal está en la **gestión de usuarios**.

---

## 3. Superadmin

El superadmin es la cuenta principal de administración (`somos@ecolink.com.ar`). Configura la app, crea operarios y recolectores, y supervisa todo el operativo.

### 3.1 Panel operativo

Al ingresar llegás a **Panel operativo** con dos secciones:

#### Tabla **Ruta**

Lista todas las rutas importadas o creadas. Cada fila muestra, entre otros datos:

- Fecha y turno (Mañana / Tarde)
- Recolector asignado
- Estado (Pendiente, En proceso, Finalizada…)
- Cantidad de paradas
- Kilómetros, inicio/cierre de jornada, total recaudado

**Acciones por ruta:**

| Botón | Qué hace |
|-------|----------|
| Seleccionar fila | Muestra sus recolecciones abajo |
| **Ver detalle** | Resumen completo de la ruta |
| **Ver mapa** | Mapa con direcciones geocodificadas |
| **Editar** | Cambiar nombre, fecha, turno, estado, recolector, observaciones |
| **Eliminar** | Borra la ruta y todas sus paradas (acción irreversible) |

#### Tabla **Recolecciones**

Muestra las paradas de la **ruta seleccionada** arriba.

| Acción | Qué hace |
|--------|----------|
| **Editar** | Modificar datos de la parada (dirección, hora, precio, etc.) |
| **+ Agregar recolección** | Agregar una parada manual a la ruta |
| **Eliminar** | Quitar una parada |

### 3.2 Mapa y reorden de paradas

1. Seleccioná una ruta
2. Tocá **Ver mapa**
3. La app geocodifica direcciones que aún no tienen coordenadas (puede tardar unos segundos)
4. En el panel lateral podés **arrastrar** las paradas para cambiar el orden de visita
5. Al soltar, el nuevo orden se **guarda automáticamente**

Los marcadores se colorean por **zona** cuando está disponible.

### 3.3 Gestión de usuarios

Menú **Usuarios** (arriba) → `/panel/usuarios`

**Crear un usuario:**

1. Completá correo, nombre, rol (Operario o Recolector) y contraseña inicial
2. Guardá
3. Compartí las credenciales de forma segura con la persona

**Cambiar contraseña de otro usuario:**

1. En la tabla de usuarios, tocá **Enviar correo para cambiar contraseña**
2. La persona recibe un enlace (si el correo está configurado) o copiá el enlace que muestra la app

**Límites del superadmin:**

- Puede crear operarios y recolectores
- Puede resetear contraseña de operarios y recolectores
- **No** puede cambiar la contraseña del superadmin desde este panel (usa recuperación por correo)

### 3.4 Tareas de configuración (una vez)

Estas tareas las hace normalmente el superadmin o alguien técnico al inicio:

| Tarea | Dónde |
|-------|-------|
| Crear cuenta superadmin en Supabase | Dashboard Supabase |
| Configurar planilla Google Sheets | Ver sección 6 |
| Configurar mapas de Google | Documentación técnica interna |
| Crear operarios y recolectores | Usuarios en la app |

---

## 4. Operario (admin)

El operario usa el **mismo panel operativo** que el superadmin para seguir rutas, editar paradas y ver mapas.

### 4.1 Día a día

1. **Ingresá** al panel operativo
2. Revisá la tabla de **Rutas** — filtrá mentalmente por fecha/recolector
3. **Seleccioná una ruta** para ver sus recolecciones
4. Si hace falta corregir datos → **Editar** ruta o recolección
5. Para planificar el recorrido → **Ver mapa** y reordenar paradas
6. Seguí el avance: estados de ruta y de cada parada se actualizan cuando el recolector carga en campo

### 4.2 Editar una ruta

Desde **Editar** en la tabla de rutas podés modificar:

- Nombre de la ruta
- Fecha
- Turno (Mañana / Tarde)
- Estado
- Recolector asignado
- Observaciones del operario
- Kilómetros recorridos (cuando corresponda)

### 4.3 Editar o agregar una recolección

Desde la tabla de recolecciones:

- **Editar:** cambiar dirección, cliente, hora, precio, observaciones, teléfono, etc.
- **Agregar:** crear una parada nueva en la ruta seleccionada
- **Eliminar:** quitar una parada incorrecta

### 4.4 Gestión de usuarios (solo recolectores)

El operario puede:

- ✅ Crear cuentas de **recolector**
- ✅ Enviar reset de contraseña a recolectores
- ❌ **No** puede crear otros operarios
- ❌ **No** puede resetear contraseñas de operarios

Menú **Usuarios** → mismo flujo que superadmin pero con rol Recolector únicamente.

---

## 5. Recolector

La interfaz del recolector está pensada para el **celular**: pantalla angosta, botones grandes, navegación inferior.

### 5.1 Navegación

Barra inferior con dos pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Inicio** | Saludo + rutas de **hoy** + acceso rápido |
| **Mis rutas** | Todas tus rutas asignadas, agrupadas por **Mañana**, **Tarde** o sin turno |

### 5.2 Ver una ruta

1. Tocá una tarjeta de ruta
2. Entrás al **Detalle de ruta** con:
   - Turno, fecha, estado
   - Efectivo recaudado (si hay cargas)
   - Km iniciales e insumos (después de iniciar)
   - Lista de **recolecciones** en orden

### 5.3 Iniciar la ruta (obligatorio antes de cargar paradas)

1. En el detalle, tocá **Inicio de ruta**
2. Completá:
   - **Kilómetros iniciales** del odómetro (número mayor a 0)
   - **Insumos** que llevás (al menos uno):
     - Tipos disponibles: Cesto, Biotacho, KitPuntos, Ropa, Celular, Bolsa punto, Bolsa nueva, Biotachos nuevos
     - Elegí tipo + cantidad → **Agregar** (podés agregar hasta 20 ítems)
3. Tocá **Confirmar inicio de ruta**
4. Volvés al detalle con la ruta en estado **En proceso**

> Hasta que no iniciés la ruta, las paradas solo se pueden **ver** (preview), no cargar.

### 5.4 Abrir Maps (navegación)

En el detalle de ruta, tocá **Maps**. Se abre Google Maps con las direcciones de las paradas **en el orden de la ruta**.

No necesitás configurar nada: usa la app de Maps del teléfono.

### 5.5 Cargar una recolección (parada)

Con la ruta **iniciada**, tocá una parada de la lista → **Cargar en campo**.

#### Datos que no se pueden modificar (solo lectura)

- Dirección del cliente
- Cliente (nombre)
- Hora programada
- Observaciones

#### Dos caminos posibles

**A) Cancelación**

Si la parada no se pudo hacer:

1. Escribí el **Motivo de cancelación**
2. Completá **Nombre del firmante**
3. Marcá la casilla de **confirmación de firma**
4. Guardá → la parada queda como **Cancelada**

No hace falta completar bolsas ni pagos.

**B) Recolección normal**

1. Completá los cuatro contadores (podés poner **0**):
   - Bolsas llenas
   - Biotachos llenos
   - Bolsas nuevas
   - Biotachos nuevos
2. Revisá el **Precio de retiro** y el **Precio total a cobrar** (por ahora son iguales)
3. Completá **uno o más** montos de pago:
   - Monto efectivo
   - Monto transferencia
   - Monto QR
   - Cada monto, si se completa, debe ser al menos 1
   - **La suma de los montos debe ser igual al total a cobrar**
4. **Nombre del firmante** (obligatorio)
5. Marcá **Confirmo la firma del cliente**
6. Tocá **Guardar recolección** → la parada queda como **Visitada**

#### Editar una parada ya cargada

Las paradas visitadas o canceladas muestran **Editar carga →**. Podés volver a entrar y actualizar los datos.

### 5.6 Resumen del flujo del recolector

```
Login
  → Mis rutas (o Inicio si hay rutas hoy)
    → Detalle de ruta
      → Inicio de ruta (km + insumos)     ← una vez por jornada
      → Maps (navegación)
      → Por cada parada:
          → Cargar en campo (retiro + cobro + firma)
          → o Cancelar con motivo
```

---

## 6. Planilla Google Sheets

Las rutas y paradas se cargan masivamente desde una planilla de Google. Esto lo usa normalmente el operario o superadmin, no el recolector en campo.

### Columnas principales (hoja `Rutas`)

Cada fila = una parada/cliente. Campos obligatorios:

- **Nombre**, **Direccion**, **Telefono**, **Dia** (fecha), **Hora**, **Recolector** (email del recolector en la app)

### Cómo se arma una ruta

La app agrupa filas automáticamente cuando comparten:

- Misma **fecha** (columna Dia)
- Mismo **turno** (Mañana si Hora &lt; 12:00, Tarde si Hora ≥ 12:00)
- Mismo **recolector** (email)

Si cambiás fecha, turno o recolector → es **otra ruta**.

### Estados en la planilla (automáticos)

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Lista para enviar a la app |
| **Incompleto** | Faltan datos obligatorios |
| **Error** | Algún dato inválido |
| **Enviada** | Ya importada (fondo verde, no se reimporta) |

### Menú en Google Sheets

Desde el menú del script (instalado una vez):

1. **Configurar integración** — URL de la app + secreto compartido
2. **Actualizar desplegable recolectores** — trae emails desde la base
3. **Validar todas las filas** — revisa antes de enviar
4. **Enviar pendientes a la app** — importa filas Pendiente

> El recolector **no** necesita usar la planilla: solo ve en la app lo que ya fue importado y asignado a su email.

Documentación técnica de la integración: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)

---

## 7. Problemas frecuentes

### No puedo iniciar sesión

- Verificá correo y contraseña (mayúsculas/minúsculas)
- Pedile al superadmin un **reset de contraseña**
- Si es cuenta nueva, puede que necesites confirmar el correo primero

### Soy recolector y no veo rutas

- Las rutas deben estar **asignadas a tu email** en la planilla (columna Recolector) o en el panel operario
- Verificá la **fecha** — en Inicio solo aparecen las de hoy; en Mis rutas están todas

### “Inicio de ruta” no guarda / error de columnas

- Avisá al equipo técnico: puede faltar actualizar la base de datos (migraciones)
- Mientras tanto, probá cerrar sesión, volver a entrar y reintentar

### No puedo cargar una parada

- ¿Iniciaste la ruta? Sin inicio de ruta solo podés **ver** el detalle, no cargar
- Revisá que la suma de pagos sea **igual al total**
- Si cancelás, solo necesitás motivo + firmante + firma

### El mapa del operario no carga

- Puede faltar configuración de Google Maps (tarea del equipo técnico)
- Sin mapa igual podés ver y editar recolecciones en las tablas

### La planilla no importa filas

- Ejecutá **Validar todas las filas** y corregí errores en rojo
- Verificá que el email del Recolector exista en la app
- Las filas **Enviada** (verde) no se reimportan — creá fila nueva si hace falta

### Maps del recolector no abre direcciones

- Verificá que las paradas tengan **dirección** cargada
- Probá con conexión a internet activa

---

## Glosario rápido

| Término | Significado |
|---------|-------------|
| **Ruta** | Jornada de un recolector en una fecha y turno, con N paradas |
| **Recolección / parada** | Visita a un cliente (dirección, hora, precio) |
| **Turno** | Mañana (antes de 12:00) o Tarde (desde 12:00) |
| **Inicio de ruta** | Registro de km y insumos al comenzar la jornada |
| **Carga en campo** | Datos que el recolector carga en cada parada |
| **Operario** | Persona de backoffice que supervisa y edita rutas |
| **Superadmin** | Administrador principal con acceso total |

---

*Manual actualizado con las funcionalidades disponibles a la fecha. Para detalles técnicos de instalación y desarrollo, ver [GUIA_DESARROLLADORES.md](./GUIA_DESARROLLADORES.md).*
