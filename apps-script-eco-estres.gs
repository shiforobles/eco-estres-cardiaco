// ─── Crear este script DESDE dentro del Google Sheet ───────────────
// Abrí tu Google Sheet → Extensiones → Apps Script
// Borrá lo que haya y pegá esto
// Después: Implementar → Nueva implementación → Aplicación web
//   Ejecutar como: Yo   |   Quién tiene acceso: Cualquier usuario
// Copiá la URL que termina en /exec y pegala en la app
//
// Script propio de la planilla de eco estrés (Base de Datos Eco Estrés). Mismo
// funcionamiento que el de eco Doppler convencional: espera su turno si hay dos
// guardados a la vez, responde recién con la fila escrita y la app lo confirma.
// Guardar dos veces el mismo estudio REEMPLAZA su fila (columna 'ID').
// ──────────────────────────────────────────────────────────────────

const HOJA_POR_DEFECTO = 'Estrés';

const HEADERS_ESTRES = [
  "Fecha",
  "HC",
  "Edad",
  "Sexo",
  "Peso",
  "Altura",
  "SC",
  "Indicación",
  "Medicación",
  "Betabloqueo",
  "Valvulopatía",
  "Severidad valvular",
  "Bicúspide",
  "Fecha estudio previo",
  "Vmax previa",
  "Gradiente previo",
  "AVA previa",
  "Aorta previa",
  "Δ Vmax/año",
  "Δ Gradiente/año",
  "Δ AVA/año",
  "Δ Aorta/año",
  "Otros antecedentes",
  "Protocolo",
  "Carga Kgm/min",
  "Etapa",
  "Duración",
  "Causa detención",
  "FC reposo",
  "TA basal",
  "FC pico",
  "TA pico",
  "FC rec 1min",
  "DP máximo",
  "% FCMT",
  "Índice cronotrópico",
  "Reserva FC",
  "HRR1",
  "METs",
  "% METs predicho",
  "Ventana",
  "Seg hasta imagen",
  "FC al adquirir",
  "% FC pico al adquirir",
  "FEy reposo",
  "FEy post",
  "Delta FEy",
  "Función VD",
  "WMSI reposo",
  "WMSI post",
  "Delta WMSI",
  "Escala WMSI",
  "Motor texto",
  "Seg isquémicos",
  "Seg secuela",
  "Territorio",
  "Patrón",
  "Ritmo",
  "Conducción",
  "ST basal",
  "ST tipo",
  "ST mm",
  "ST morfología",
  "ST derivaciones",
  "Arritmias",
  "E/e' reposo",
  "E/e' esfuerzo",
  "VRT reposo",
  "VRT esfuerzo",
  "Diastólico esfuerzo",
  "Resultado",
  "Categorización",
  "Avisos",
  "Informe",
  "ID",
  "Q/secuela",
  "Arritmias basales",
  "ST aparición",
  "ST recuperación",
  "ECG interpretable",
  "Motivo no interpretable",
  "ECG resultado"
];

// Columnas de ratios: se les fuerza formato numérico para que Sheets no
// las interprete como fechas, que es lo que pasó en la planilla de Doppler
// con E/e' e IMC (7.3 terminaba siendo el 7 de marzo).
const COLUMNAS_NUMERICAS = [36,37,49,50,51,66,67,68,69,62,39,7];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // dos guardados a la vez no se pisan
    const data   = JSON.parse(e.postData.contents);
    const ss     = SpreadsheetApp.getActiveSpreadsheet();
    const nombre = data.hoja || HOJA_POR_DEFECTO;
    let   sheet  = ss.getSheetByName(nombre);
    if (!sheet) sheet = ss.insertSheet(nombre);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS_ESTRES);
      sheet.getRange(1, 1, 1, HEADERS_ESTRES.length)
        .setFontWeight('bold')
        .setBackground('#059669')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      // El formato se fija de entrada sobre toda la columna
      COLUMNAS_NUMERICAS.forEach(function (col) {
        sheet.getRange(2, col, sheet.getMaxRows() - 1, 1).setNumberFormat('0.00');
      });
    }

    // Una fila con otra cantidad de columnas se escribiría CORRIDA: se rechaza.
    if (!Array.isArray(data.row) || data.row.length !== HEADERS_ESTRES.length) {
      return json_({ status: 'error', error: 'ESQUEMA_DESALINEADO',
        msg: 'La app mandó ' + (Array.isArray(data.row) ? data.row.length : 0) +
             ' columnas y la planilla espera ' + HEADERS_ESTRES.length +
             '. Pegá de nuevo el código del script desde la app (⚙ Configurar planilla).' });
    }
    // getLastColumn() mira la fila más ancha, no el encabezado: se cuentan sólo
    // las celdas con texto de la fila 1.
    var cab = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    while (cab.length && String(cab[cab.length - 1]) === '') cab.pop();
    if (cab.length !== HEADERS_ESTRES.length) {
      return json_({ status: 'error', error: 'HOJA_SIN_MIGRAR',
        msg: 'La hoja "' + nombre + '" tiene ' + cab.length + ' columnas y se esperan ' +
             HEADERS_ESTRES.length + '. Revisá el encabezado de la hoja.' });
    }

    // Upsert por ID: si la fila trae un id ya presente en la columna 'ID', se
    // reemplaza esa fila en vez de agregar otra. Así, reguardar un estudio
    // corregido deja en la planilla la versión final, no dos filas.
    var idCol = HEADERS_ESTRES.indexOf('ID') + 1;
    var destino = 0;
    if (idCol > 0 && data.row[idCol - 1] !== '' && data.row[idCol - 1] != null) {
      var ultima = sheet.getLastRow();
      if (ultima >= 2) {
        var ids = sheet.getRange(2, idCol, ultima - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(data.row[idCol - 1])) { destino = i + 2; break; }
        }
      }
    }

    var accion;
    if (destino) {
      sheet.getRange(destino, 1, 1, data.row.length).setValues([data.row]);
      accion = 'reemplazada';
    } else {
      sheet.appendRow(data.row);
      destino = sheet.getLastRow();
      accion = 'agregada';
    }

    COLUMNAS_NUMERICAS.forEach(function (col) {
      sheet.getRange(destino, col).setNumberFormat('0.00');
    });
    SpreadsheetApp.flush(); // la respuesta ok sale recién con la fila escrita

    return json_({ status: 'ok', hoja: nombre, fila: destino, accion: accion });

  } catch (err) {
    return json_({ status: 'error', msg: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Script activo ✓ — Eco estrés' }))
    .setMimeType(ContentService.MimeType.JSON);
}
