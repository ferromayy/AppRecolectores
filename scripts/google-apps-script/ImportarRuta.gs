/**
 * Google Apps Script — importar rutas (MVP: nombre, fecha, asignado)
 *
 * Formato hoja "Rutas":
 *   Fila 1 = títulos: nombre | fecha | asignado
 *   Fila 2+ = una ruta por fila
 *
 * Instalación:
 * 1. Extensiones → Apps Script → pegar este archivo
 * 2. Ejecutar configurarIntegracion() una vez
 * 3. Recargar planilla → menú "App Recolectores"
 */

const CONFIG = {
  HOJA_RUTAS: "Rutas",
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("App Recolectores")
    .addItem("Importar rutas a la app", "importarRutas")
    .addItem("Configurar integración", "configurarIntegracion")
    .addToUi();
}

function configurarIntegracion() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const urlResponse = ui.prompt(
    "URL de la app",
    "Ej: https://tu-app.vercel.app o http://localhost:3000",
    ui.ButtonSet.OK_CANCEL,
  );
  if (urlResponse.getSelectedButton() !== ui.Button.OK) return;

  const secretResponse = ui.prompt(
    "Secreto de importación (SHEETS_IMPORT_SECRET)",
    "Mismo valor que en .env.local / Vercel",
    ui.ButtonSet.OK_CANCEL,
  );
  if (secretResponse.getSelectedButton() !== ui.Button.OK) return;

  const apiUrl = urlResponse.getResponseText().trim().replace(/\/$/, "");
  const apiSecret = secretResponse.getResponseText().trim();

  if (!apiUrl || !apiSecret) {
    ui.alert("Completá URL y secreto.");
    return;
  }

  props.setProperties({
    API_URL: apiUrl,
    API_SECRET: apiSecret,
  });

  ui.alert("Integración guardada. Ya podés importar rutas.");
}

/** Alias para botones que apunten al nombre anterior */
function importarRutaActiva() {
  importarRutas();
}

function importarRutas() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty("API_URL");
  const apiSecret = props.getProperty("API_SECRET");

  if (!apiUrl || !apiSecret) {
    ui.alert(
      "Primero configurá la integración: App Recolectores → Configurar integración.",
    );
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.HOJA_RUTAS) || ss.getActiveSheet();
    const filas = leerFilasRutas_(sheet);

    if (filas.length === 0) {
      ui.alert(
        'No hay rutas para importar.\n\nFila 1 = títulos (nombre, fecha, asignado)\nFila 2+ = datos',
      );
      return;
    }

    const spreadsheetId = ss.getId();
    const spreadsheetUrl = ss.getUrl();
    const sheetId = sheet.getSheetId();
    const sheetName = sheet.getName();

    let ok = 0;
    let fail = 0;
    const errores = [];
    const advertencias = [];

    filas.forEach(function (fila) {
      const payload = {
        ruta: {
          nombre: fila.nombre,
          fecha: fila.fecha,
          asignado: fila.asignado,
          spreadsheet_id: spreadsheetId,
          spreadsheet_url: spreadsheetUrl,
          sheet_name: sheetName,
          external_key:
            spreadsheetId +
            ":" +
            sheetId +
            ":" +
            fila.filaPlanilla +
            ":" +
            fila.fecha +
            ":" +
            fila.nombre,
        },
      };

      const response = UrlFetchApp.fetch(
        apiUrl + "/api/integrations/sheets/import-ruta",
        {
          method: "post",
          contentType: "application/json",
          headers: { Authorization: "Bearer " + apiSecret },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
        },
      );

      const status = response.getResponseCode();
      let body;
      try {
        body = JSON.parse(response.getContentText());
      } catch (e) {
        fail++;
        errores.push("Fila " + fila.filaPlanilla + ": respuesta inválida (" + status + ")");
        return;
      }

      if (status >= 400 || body.ok === false) {
        fail++;
        errores.push(
          "Fila " +
            fila.filaPlanilla +
            " (" +
            fila.nombre +
            "): " +
            (body.error || "Error " + status),
        );
        return;
      }

      ok++;
      if (body.warnings && body.warnings.length) {
        advertencias.push(
          "Fila " + fila.filaPlanilla + ": " + body.warnings.join("; "),
        );
      }
    });

    let msg = "Importación finalizada.\n\n✓ " + ok + " ruta(s) importada(s)";
    if (fail > 0) msg += "\n✗ " + fail + " con error";
    if (errores.length) msg += "\n\nErrores:\n- " + errores.join("\n- ");
    if (advertencias.length) msg += "\n\nAdvertencias:\n- " + advertencias.join("\n- ");

    ui.alert(msg);
  } catch (err) {
    ui.alert("Error: " + (err && err.message ? err.message : String(err)));
  }
}

/**
 * Fila 1 = encabezados
 * Fila 2+ = datos (nombre, fecha, asignado)
 */
function leerFilasRutas_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(normalizarEncabezado_);

  const colNombre = findCol_(headers, ["nombre", "name", "ruta", "nombre_ruta"]);
  const colFecha = findCol_(headers, ["fecha", "date", "fecha_ruta"]);
  const colAsignado = findCol_(headers, [
    "asignado",
    "recolector",
    "recolector_email",
    "email",
  ]);

  if (colNombre < 0 || colFecha < 0 || colAsignado < 0) {
    throw new Error(
      'Fila 1 debe tener columnas "nombre", "fecha" y "asignado". Encontradas: ' +
        headers.join(", "),
    );
  }

  const filas = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const nombre = String(row[colNombre] || "").trim();
    const asignado = String(row[colAsignado] || "").trim();
    let fecha = row[colFecha];

    if (fecha instanceof Date) {
      fecha = Utilities.formatDate(
        fecha,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd",
      );
    } else {
      fecha = String(fecha || "").trim();
    }

    if (!nombre && !fecha && !asignado) continue;

    if (!nombre || !fecha || !asignado) {
      throw new Error(
        "Fila " +
          (r + 1) +
          " incompleta. Completá nombre, fecha y asignado o dejá la fila vacía.",
      );
    }

    filas.push({
      filaPlanilla: r + 1,
      nombre: nombre,
      fecha: fecha.substring(0, 10),
      asignado: asignado,
    });
  }

  return filas;
}

function normalizarEncabezado_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findCol_(headers, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const idx = headers.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  return -1;
}
