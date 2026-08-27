// ══════════════════════════════════════════════════════════════════
//  APPS SCRIPT ÚNICO — Eco Doppler + Eco Estrés
//  Reemplaza al anterior. Enruta por el nombre de hoja que manda cada app.
//
//  Pegar en: el Google Sheet → Extensiones → Apps Script
//  Después:  Implementar → Nueva implementación → Aplicación web
//            Ejecutar como: Yo | Quién tiene acceso: Cualquier usuario
//  Copiar la URL /exec y ponerla en LAS DOS apps.
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
  "PE Compromiso"
];

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
  "Informe"
];

// Columnas numéricas: se les fuerza formato para que Sheets no las lea como
// fechas. Es lo que arruinó IMC y E/e' en la planilla de Doppler.
const NUM_DOPPLER = [7,8,21,22,24,28,29,30,32,33,34,35,37,38,39,40,44,45,47,48,50,52,53,54,55,57,58,59,65,66,67,68,70,72];
const NUM_ESTRES  = [23,24,36,37,38,51,52,53,54,47,26,7];

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const ss     = SpreadsheetApp.getActiveSpreadsheet();

    // La app de estrés manda data.hoja; la de Doppler no manda nada.
    const nombre = data.hoja || HOJA_DOPPLER;
    const esEstres = (nombre === HOJA_ESTRES);
    const headers  = esEstres ? HEADERS_ESTRES : HEADERS_DOPPLER;
    const numCols  = esEstres ? NUM_ESTRES : NUM_DOPPLER;

    let sheet = ss.getSheetByName(nombre);
    if (!sheet) sheet = ss.insertSheet(nombre);   // se crea sola la primera vez

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
