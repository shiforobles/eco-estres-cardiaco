// ══════════════════════════════════════════════════════════════════
//  APPS SCRIPT ÚNICO — Eco Doppler + Eco Estrés
//  Reemplaza al anterior, que tenía la hoja fija en 'Estudios' e ignoraba
//  el destino: los estudios de estrés habrían caído mezclados con los de
//  Doppler, con 59 valores en un encabezado de otra app.
//
//  Pegar en: el Google Sheet → Extensiones → Apps Script
//  Después:  Implementar → Nueva implementación → Aplicación web
//            Ejecutar como: Yo | Quién tiene acceso: Cualquier usuario
//  Copiar la URL /exec y ponerla en LAS DOS apps.
//
//  IMPORTANTE: el encabezado sólo se escribe cuando la hoja está VACÍA.
//  'Estudios' ya tiene datos, así que su encabezado (83 columnas, hasta
//  'PE Distribución') no se actualiza solo. Para que se llenen las
//  columnas nuevas —entre ellas 'Informe'— hay que escribirlas a mano en
//  la fila 1. La hoja 'Estrés' no existe todavía: esa sí se crea sola y
//  con el encabezado completo.
// ══════════════════════════════════════════════════════════════════

const HOJA_DOPPLER = 'Estudios';
const HOJA_ESTRES  = 'Estrés';

const HEADERS_DOPPLER = [
  "Fecha",
  "HC",
  "Edad",
  "Sexo",
  "Peso",
  "Altura",
  "IMC",
  "SC",
  "Ritmo",
  "Conducción",
  "HTA",
  "C.Isquémica",
  "CRM",
  "EPOC",
  "FA Previa",
  "Marcapasos",
  "SIV",
  "PP",
  "DDVI",
  "DSVI",
  "Masa VI Index",
  "RWT",
  "Geometría",
  "FEy",
  "Motilidad Global",
  "Motilidad Detalle",
  "Diástole",
  "E/e'",
  "E/A",
  "Vol AI",
  "EAo Grado",
  "EAo Vmax",
  "EAo GM",
  "AVA",
  "Coef Adim",
  "IAo Grado",
  "IAo VC",
  "IAo PHT",
  "IAo RVol",
  "IAo EROA",
  "IAo Alcance",
  "IAo Reverso",
  "EM Grado",
  "EM GM",
  "EM Área",
  "IM Grado",
  "IM ORE",
  "IM VR",
  "AD Estado",
  "AD Área",
  "VD Estado",
  "VD Basal",
  "TAPSE",
  "S'",
  "PSAP",
  "IT Grado",
  "IT VC",
  "IT ORE",
  "IT VR",
  "IT Flujo Hep",
  "Prótesis",
  "Prot Posición",
  "Prot Tipo",
  "Prot Modelo",
  "Prot Vmax",
  "Prot GM",
  "Prot DVI",
  "Prot iEOA",
  "Prot Insuf",
  "ASIA Excursión",
  "ASIA Shunt",
  "PE Tamaño",
  "PE Compromiso",
  "Onda E",
  "Onda A",
  "e' Septal",
  "e' Lateral",
  "TRIV",
  "TD",
  "LARS",
  "IM VC",
  "IT Vmax",
  "PE Distribución",
  "Informe",
  "ATC/Stent",
  "Recambio Ao",
  "Recambio Mitral",
  "Observaciones"
];

// ESQUEMA ESTRÉS v3 — 74 columnas. Generado del contrato de la app
// (EstresSheets.HEADERS): no transcribir a mano. Si la app agrega una columna,
// este bloque, ESQUEMA_ESTRES_V y ESQUEMAS_PREVIOS se actualizan JUNTOS.
const ESQUEMA_ESTRES_V = 3;
const HEADERS_ESTRES = [
  "Fecha", "HC", "Edad", "Sexo",
  "Peso", "Altura", "SC", "Indicación",
  "Medicación", "Betabloqueo", "Valvulopatía", "Severidad valvular",
  "Bicúspide", "Fecha estudio previo", "Vmax previa", "Gradiente previo",
  "AVA previa", "Aorta previa", "Δ Vmax/año", "Δ Gradiente/año",
  "Δ AVA/año", "Δ Aorta/año", "Otros antecedentes", "Protocolo",
  "Carga Kgm/min", "Etapa", "Duración", "Causa detención",
  "FC reposo", "TA basal", "FC pico", "TA pico",
  "FC rec 1min", "DP máximo", "% FCMT", "Índice cronotrópico",
  "Reserva FC", "HRR1", "METs", "% METs predicho",
  "Ventana", "Seg hasta imagen", "FC al adquirir", "% FC pico al adquirir",
  "FEy reposo", "FEy post", "Delta FEy", "Función VD",
  "WMSI reposo", "WMSI post", "Delta WMSI", "Escala WMSI",
  "Motor texto", "Seg isquémicos", "Seg secuela", "Territorio",
  "Patrón", "Ritmo", "Conducción", "ST basal",
  "ST tipo", "ST mm", "ST morfología", "ST derivaciones",
  "Arritmias", "E/e' reposo", "E/e' esfuerzo", "VRT reposo",
  "VRT esfuerzo", "Diastólico esfuerzo", "Resultado", "Categorización",
  "Avisos", "Informe"
];

// Encabezados de los esquemas anteriores, para migrar las filas ya guardadas.
// La migración es POR NOMBRE de columna, no por posición: así sirve para
// cualquier inserción futura en el medio.
const ESQUEMAS_PREVIOS = {
  59: [
    "Fecha", "HC", "Edad", "Sexo",
    "Peso", "Altura", "SC", "Indicación",
    "Medicación", "Betabloqueo", "Protocolo", "Carga Kgm/min",
    "Etapa", "Duración", "Causa detención", "FC reposo",
    "TA basal", "FC pico", "TA pico", "FC rec 1min",
    "DP máximo", "% FCMT", "Índice cronotrópico", "Reserva FC",
    "HRR1", "METs", "% METs predicho", "Ventana",
    "Seg hasta imagen", "FC al adquirir", "% FC pico al adquirir", "FEy reposo",
    "FEy post", "Delta FEy", "Función VD", "WMSI reposo",
    "WMSI post", "Delta WMSI", "Seg isquémicos", "Seg secuela",
    "Territorio", "Patrón", "Ritmo", "Conducción",
    "ST basal", "ST tipo", "ST mm", "ST morfología",
    "ST derivaciones", "Arritmias", "E/e' reposo", "E/e' esfuerzo",
    "VRT reposo", "VRT esfuerzo", "Diastólico esfuerzo", "Resultado",
    "Categorización", "Avisos", "Informe"
  ],
  61: [
    "Fecha", "HC", "Edad", "Sexo",
    "Peso", "Altura", "SC", "Indicación",
    "Medicación", "Betabloqueo", "Protocolo", "Carga Kgm/min",
    "Etapa", "Duración", "Causa detención", "FC reposo",
    "TA basal", "FC pico", "TA pico", "FC rec 1min",
    "DP máximo", "% FCMT", "Índice cronotrópico", "Reserva FC",
    "HRR1", "METs", "% METs predicho", "Ventana",
    "Seg hasta imagen", "FC al adquirir", "% FC pico al adquirir", "FEy reposo",
    "FEy post", "Delta FEy", "Función VD", "WMSI reposo",
    "WMSI post", "Delta WMSI", "Escala WMSI", "Motor texto",
    "Seg isquémicos", "Seg secuela", "Territorio", "Patrón",
    "Ritmo", "Conducción", "ST basal", "ST tipo",
    "ST mm", "ST morfología", "ST derivaciones", "Arritmias",
    "E/e' reposo", "E/e' esfuerzo", "VRT reposo", "VRT esfuerzo",
    "Diastólico esfuerzo", "Resultado", "Categorización", "Avisos",
    "Informe"
  ]
};

// Columnas numéricas: se les fuerza formato para que Sheets no las lea
// como fechas, que es lo que invirtió los dígitos de IMC y E/e'.
const NUM_DOPPLER = [7,8,21,22,24,28,29,30,32,33,34,35,37,38,39,40,44,45,47,48,50,52,53,54,55,57,58,59,65,66,67,68,70,72,74,75,76,77,78,79,80,81,82];
const NUM_ESTRES  = [36, 37, 49, 50, 51, 66, 67, 68, 69, 62, 39, 7];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();

    // La app de estrés manda data.hoja; la de Doppler no manda nada.
    const nombre   = data.hoja || HOJA_DOPPLER;
    const esEstres = (nombre === HOJA_ESTRES);
    const headers  = esEstres ? HEADERS_ESTRES : HEADERS_DOPPLER;
    const numCols  = esEstres ? NUM_ESTRES : NUM_DOPPLER;

    let sheet = ss.getSheetByName(nombre);
    if (!sheet) sheet = ss.insertSheet(nombre);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground(esEstres ? '#059669' : '#1a73e8')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      numCols.forEach(function (col) {
        sheet.getRange(2, col, sheet.getMaxRows() - 1, 1).setNumberFormat('0.00');
      });
    }

    // Una fila con otra cantidad de columnas se escribe CORRIDA y queda indetectable
    // después: se rechaza en vez de guardarla. Esto es lo que faltaba cuando la app
    // pasó a 61 columnas y este script seguía en 59.
    if (!Array.isArray(data.row) || data.row.length !== headers.length) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'ESQUEMA_DESALINEADO',
        esperadas: headers.length,
        recibidas: Array.isArray(data.row) ? data.row.length : 0,
        detalle: 'La fila no coincide con el encabezado de la hoja. Actualizá el Apps ' +
                 'Script o la app para que usen el mismo contrato de columnas.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Hoja ya existente con el encabezado viejo: no se escribe encima en silencio.
    if (esEstres && sheet.getLastRow() > 0) {
      var cab = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (cab.length !== headers.length) {
        return ContentService.createTextOutput(JSON.stringify({
          ok: false,
          error: 'HOJA_SIN_MIGRAR',
          encabezado: cab.length,
          esperadas: headers.length,
          detalle: 'La hoja tiene el encabezado viejo. Corré migrarEstresV1aV2() una vez ' +
                   'desde el editor de Apps Script antes de volver a enviar.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    sheet.appendRow(data.row);

    const fila = sheet.getLastRow();
    numCols.forEach(function (col) {
      sheet.getRange(fila, col).setNumberFormat('0.00');
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', hoja: nombre, fila: fila }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Script activo ✓ — Doppler + Estrés' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════════
//  MIGRACIÓN DEL ESQUEMA DE ESTRÉS — v1 (59 columnas) → v2 (61)
//
//  El 25/10/2026 la app pasó a mandar 61 valores: se agregaron 'Escala WMSI' y
//  'Motor texto' en las columnas 39 y 40, lo que corrió todo lo posterior. Este
//  script seguía con 59 encabezados, así que:
//
//    · las filas ANTERIORES al cambio tienen 59 valores y coinciden con el
//      encabezado viejo;
//    · las filas POSTERIORES tienen 61 valores y están corridas respecto de ese
//      encabezado: desde la columna 39 cada dato cae bajo otro rótulo.
//
//  Las dos están bien escritas; lo que no coincide es el esquema entre ellas. La
//  migración mete dos celdas vacías en las posiciones 39 y 40 SÓLO de las filas
//  viejas, y después reescribe el encabezado.
//
//  CÓMO USARLO
//    1. Corré `migrarEstresV1aV2_simular()` y leé el registro: dice cuántas filas
//       de cada tipo hay y no toca nada.
//    2. Hacé una copia de la hoja (Archivo › Hacer una copia).
//    3. Corré `migrarEstresV1aV2()`.
//
//  Si una fila no tiene 59 ni 61 valores se deja como está y se informa: no se
//  adivina a qué esquema pertenece.
// ══════════════════════════════════════════════════════════════════

function migrarEstresV1aV2_simular() { return migrarEstres_(true); }
function migrarEstresV1aV2()         { return migrarEstres_(false); }
// Nombres nuevos, más claros: la migración ya no es sólo de v1 a v2.
function migrarEstres_simular() { return migrarEstres_(true); }
function migrarEstres()         { return migrarEstres_(false); }

function migrarEstres_(simular) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_ESTRES);
  if (!sheet) { Logger.log('No existe la hoja ' + HOJA_ESTRES); return; }

  var ultimaFila = sheet.getLastRow();
  if (ultimaFila < 1) { Logger.log('La hoja está vacía: nada que migrar.'); return; }

  var ancho = Math.max(sheet.getLastColumn(), HEADERS_ESTRES.length);
  var datos = sheet.getRange(1, 1, ultimaFila, ancho).getValues();

  // Largo real de una fila: la última celda con contenido.
  function largo(f) {
    for (var i = f.length - 1; i >= 0; i--) {
      if (f[i] !== '' && f[i] !== null) return i + 1;
    }
    return 0;
  }

  // Reubica una fila de un esquema viejo al actual, buscando cada columna POR
  // NOMBRE. Lo que el esquema viejo no tenía queda vacío; nada se pierde ni se
  // corre, por más que las columnas nuevas se hayan insertado en el medio.
  function reubicar(fila, viejos) {
    var indice = {};
    for (var i = 0; i < viejos.length; i++) indice[viejos[i]] = i;
    var salida = [];
    for (var j = 0; j < HEADERS_ESTRES.length; j++) {
      var pos = indice[HEADERS_ESTRES[j]];
      salida.push(pos === undefined ? '' : (fila[pos] === undefined ? '' : fila[pos]));
    }
    return salida;
  }

  var cuenta = {}, raras = [], salida = [];

  for (var r = 1; r < datos.length; r++) {
    var fila = datos[r].slice();
    var n = largo(fila);
    if (n === 0) continue;

    var esquema = null;
    if (n <= HEADERS_ESTRES.length && ESQUEMAS_PREVIOS[n]) esquema = n;
    else if (n <= 59) esquema = 59;        // filas v1 con celdas finales vacías
    else if (n <= 61) esquema = 61;

    if (n === HEADERS_ESTRES.length) {
      var igual = fila.slice(0, HEADERS_ESTRES.length);
      while (igual.length < HEADERS_ESTRES.length) igual.push('');
      salida.push(igual);
      cuenta['v' + ESQUEMA_ESTRES_V] = (cuenta['v' + ESQUEMA_ESTRES_V] || 0) + 1;
    } else if (esquema && ESQUEMAS_PREVIOS[esquema]) {
      salida.push(reubicar(fila, ESQUEMAS_PREVIOS[esquema]));
      cuenta[esquema] = (cuenta[esquema] || 0) + 1;
    } else {
      var tal = fila.slice(0, HEADERS_ESTRES.length);
      while (tal.length < HEADERS_ESTRES.length) tal.push('');
      salida.push(tal);
      raras.push({ fila: r + 1, columnas: n });
    }
  }

  Logger.log('Hoja: ' + HOJA_ESTRES + ' — esquema actual v' + ESQUEMA_ESTRES_V +
             ' (' + HEADERS_ESTRES.length + ' columnas)');
  Logger.log('Filas de datos: ' + salida.length);
  for (var k in cuenta) Logger.log('  esquema de ' + k + ' columnas: ' + cuenta[k]);
  Logger.log('  sin reconocer, se dejan como están: ' + raras.length);
  raras.forEach(function (x) { Logger.log('    fila ' + x.fila + ': ' + x.columnas + ' columnas'); });

  if (simular) {
    Logger.log('SIMULACIÓN: no se escribió nada. Hacé una copia de la hoja y corré migrarEstres().');
    return;
  }

  sheet.getRange(1, 1, 1, HEADERS_ESTRES.length).setValues([HEADERS_ESTRES])
    .setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff');
  if (salida.length) {
    sheet.getRange(2, 1, salida.length, HEADERS_ESTRES.length).setValues(salida);
  }
  NUM_ESTRES.forEach(function (col) {
    if (salida.length) sheet.getRange(2, col, salida.length, 1).setNumberFormat('0.00');
  });
  sheet.setFrozenRows(1);
  Logger.log('Migración aplicada. Revisá una fila vieja y una nueva antes de volver a enviar.');
}
