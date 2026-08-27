/* ================================================
   Guardado de estudios en Google Sheets
   ================================================

   Mismo patrón que la app de Eco Doppler —una fila plana por estudio,
   enviada a un Apps Script que la agrega a una hoja— con cuatro
   correcciones sobre aquel diseño, tomadas de mirar la planilla real:

   1. Los ratios viajan como NÚMERO, no como texto, y el script les fuerza
      formato numérico. En la planilla de Doppler, Sheets interpretó E/e'
      e IMC como fechas (7.3 → 7 de marzo) y quedaron inservibles.
   2. La columna Informe se llena siempre: si no se generó, se genera.
   3. Hay una columna Resultado con valor categórico único, para poder
      graficar sin parsear texto.
   4. Va el identificador, no el nombre del paciente.

   Además, acá el estudio se guarda LOCAL ANTES de intentar el envío. El
   POST usa mode:'no-cors', que entrega pero impide leer la respuesta: sin
   respaldo, un script caído hace perder el estudio sin aviso.
   ================================================ */

const EstresSheets = {

    URL_KEY:   'ecoestres_script_url',
    HOJA_KEY:  'ecoestres_hoja',
    SHEET_KEY: 'ecoestres_sheet_url',
    COLA_KEY:  'ecoestres_cola_envio',
    HOJA_DEF:  'Estrés',

    getUrl()          { return localStorage.getItem(this.URL_KEY) || ''; },
    setUrl(u)         { localStorage.setItem(this.URL_KEY, (u || '').trim()); },
    getHoja()         { return localStorage.getItem(this.HOJA_KEY) || this.HOJA_DEF; },
    setHoja(h)        { localStorage.setItem(this.HOJA_KEY, (h || '').trim() || this.HOJA_DEF); },
    getSheetUrl()     { return localStorage.getItem(this.SHEET_KEY) || ''; },
    setSheetUrl(u)    { localStorage.setItem(this.SHEET_KEY, (u || '').trim()); },
    estaConfigurado() { return !!this.getUrl(); },

    // ── Columnas: filiación → antecedentes → hemodinamia → dominios → informe ──
    HEADERS: [
        // Filiación (sin nombre: sólo el identificador)
        'Fecha', 'HC', 'Edad', 'Sexo', 'Peso', 'Altura', 'SC',
        // Antecedentes y contexto
        'Indicación', 'Medicación', 'Betabloqueo',
        // Protocolo
        'Protocolo', 'Carga Kgm/min', 'Etapa', 'Duración', 'Causa detención',
        // Hemodinamia
        'FC reposo', 'TA basal', 'FC pico', 'TA pico', 'FC rec 1min',
        'DP máximo', '% FCMT', 'Índice cronotrópico', 'Reserva FC', 'HRR1',
        'METs', '% METs predicho',
        // Calidad de la adquisición
        'Ventana', 'Seg hasta imagen', 'FC al adquirir', '% FC pico al adquirir',
        // Función ventricular
        'FEy reposo', 'FEy post', 'Delta FEy', 'Función VD',
        // Motilidad
        'WMSI reposo', 'WMSI post', 'Delta WMSI',
        'Seg isquémicos', 'Seg secuela', 'Territorio', 'Patrón',
        // ECG
        'Ritmo', 'Conducción', 'ST basal', 'ST tipo', 'ST mm', 'ST morfología',
        'ST derivaciones', 'Arritmias',
        // Diastólico
        "E/e' reposo", "E/e' esfuerzo", 'VRT reposo', 'VRT esfuerzo', 'Diastólico esfuerzo',
        // Resultado
        'Resultado', 'Categorización', 'Avisos',
        // Texto completo, al final
        'Informe'
    ],

    // Columnas que Sheets puede confundir con fechas si van como texto.
    // Se mandan como número y el script les aplica formato numérico.
    COLUMNAS_RATIO: ['Índice cronotrópico', 'Reserva FC', 'WMSI reposo', 'WMSI post',
                     'Delta WMSI', "E/e' reposo", "E/e' esfuerzo", 'VRT reposo', 'VRT esfuerzo',
                     'ST mm', 'METs', 'SC'],

    // ── Resultado categórico, para graficar sin parsear texto ──
    resultadoCategorico(H) {
        const rama = elegirRama(H);
        if (rama === 'noConcluyente') return 'no concluyente';
        if (rama === 'discordancia')  return 'discordante';
        if (rama === 'dilatada')      return 'dilatada';
        if (rama === 'secuela')       return 'secuela';
        if (rama === 'positivaMulti') return 'multiterritorial';
        if (rama === 'positivaUnico' || rama === 'hipotensiva') {
            if (H.territoriosIsquemia.length > 1) return 'multiterritorial';
            const t = H.territoriosIsquemia[0];
            return t ? 'positivo ' + t : 'positivo apical';
        }
        // La rama diastólica es negativa para isquemia; el hallazgo diastólico
        // se cruza con la columna "Diastólico esfuerzo".
        return 'negativo';
    },

    // ── Armado de la fila ──
    // Se apoya en recolectarHallazgos(): no duplica la lectura del formulario.
    // El informe narrativo empieza con un encabezado que incluye nombre y HC.
    // Como a la planilla va sólo el identificador, se le quita el encabezado y
    // se reemplaza el nombre donde aparezca en la prosa.
    limpiarInforme(informe) {
        if (!informe) return '';
        const nombre = (document.getElementById('paciente_nombre') || {}).value || '';
        let txt = informe.split('\n').slice(2).join('\n').trim();
        if (nombre.trim()) txt = txt.split(nombre.trim()).join('[paciente]');
        return txt;
    },

    construirFila(informe) {
        const H = recolectarHallazgos();
        const nada = '-';
        const t = x => (x === null || x === undefined || x === '' || Number.isNaN(x)) ? nada : x;
        // Los ratios van como número real: si van como texto, Sheets los lee como fecha.
        // Un campo sin cargar vale '-', no 0: un cero cuenta como dato y ensucia
        // los promedios. Los deltas sí pueden ser cero de verdad (ceroVale).
        const num_ = (x, ceroVale = false) => {
            const p = typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'));
            if (!Number.isFinite(p)) return nada;
            if (p === 0 && !ceroVale) return nada;
            return Math.round(p * 100) / 100;
        };

        const fechaEst = v('fecha_estudio')
            ? new Date(v('fecha_estudio') + 'T12:00:00').toLocaleDateString('es-AR')
            : new Date().toLocaleDateString('es-AR');

        const cat = evaluarCategorizacion();
        const avisos = evaluarAvisosClinicos().map(a => a.titulo).join(' | ');

        return [
            fechaEst, v('paciente_id') || nada,
            t(H.edad), H.sexo === 'F' ? 'F' : 'M', t(v('peso')), t(v('altura')),
            num_(document.getElementById('sc_display').value),

            v('indicacion_libre') || textoSelect('indicacion'),
            medicacionEnTexto() || nada,
            H.betabloqueante ? 'Sí' : 'No',

            H.protocoloTxt || nada, t(H.cargaKgm), t(H.etapa), v('ej_duracion') || nada,
            H.causaDetencionTxt || nada,

            t(H.fcBasal), H.taBasal || nada, t(H.fcPico), H.taPico || nada, t(H.fcRec),
            t(H.dobleProducto), t(H.pctFCmax),
            num_(H.indiceCronotropico), num_(H.reservaFC), t(H.hrr1),
            num_(H.mets), t(H.pctMets),

            H.ventanaTxt || nada, t(H.segImagen), t(H.fcImagen), t(H.pctFCadq),

            t(H.feyReposo), t(H.feyEstres), H.deltaFey === null ? nada : H.deltaFey,
            H.vd ? textoSelect('vd_funcion') : nada,

            num_(H.wmsiReposo), num_(H.wmsiEstres), num_(H.deltaWMSI, true),
            H.isquemicos.length, H.secuelas.length,
            H.territoriosIsquemia.join('+') || nada,
            H.patronGlobal ? 'Global' : 'Segmentaria',

            H.ritmoTxt || nada, H.conduccionTxt || 'Ninguno', H.stBasalTxt || nada,
            H.stTipo ? textoSelect('ecg_st_tipo') : 'Sin cambios',
            num_(v('ecg_st_mm')), H.stMorfologiaTxt || nada, v('ecg_st_deriv') || nada,
            (H.arrLibre || H.arritmias.map(a => a.txt).join(', ')) || 'Sin arritmias',

            num_(H.eeReposo), num_(H.eeEstres), num_(H.vrtReposo), num_(H.vrtEstres),
            textoSelect('diast_resultado'),

            this.resultadoCategorico(H),
            cat.noConcluyente ? 'no categorizable' : cat.nivel,
            avisos || nada,

            this.limpiarInforme(informe) || nada
        ];
    },

    // ── Cola de envíos pendientes ──
    leerCola() {
        try { return JSON.parse(localStorage.getItem(this.COLA_KEY)) || []; }
        catch (e) { return []; }
    },
    guardarCola(c) {
        try { localStorage.setItem(this.COLA_KEY, JSON.stringify(c.slice(0, 200))); } catch (e) { /* noop */ }
    },
    encolar(fila, etiqueta) {
        const cola = this.leerCola();
        cola.push({ ts: Date.now(), etiqueta, fila, enviado: false });
        this.guardarCola(cola);
        return cola.length;
    },
    marcarEnviado(ts) {
        const cola = this.leerCola().map(x => x.ts === ts ? { ...x, enviado: true } : x);
        this.guardarCola(cola);
    },
    quitarDeCola(ts) {
        this.guardarCola(this.leerCola().filter(x => x.ts !== ts));
    },
    pendientes() {
        return this.leerCola().filter(x => !x.enviado);
    },

    async enviar(fila) {
        const url = this.getUrl();
        if (!url) throw new Error('Falta configurar la URL del script');
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'save', hoja: this.getHoja(), row: fila })
        });
    },

    urlDePrueba() {
        const u = this.getUrl();
        return u ? `${u}?action=test&_t=${Date.now()}` : null;
    },

    // ── Código del Apps Script ──
    codigoScript() {
        const headers = JSON.stringify(this.HEADERS, null, 2);
        // Índices 1-based de las columnas que deben quedar como número
        const idxRatio = this.COLUMNAS_RATIO
            .map(h => this.HEADERS.indexOf(h) + 1)
            .filter(i => i > 0);
        return `// ─── Crear este script DESDE dentro del Google Sheet ───────────────
// Abrí tu Google Sheet → Extensiones → Apps Script
// Borrá lo que haya y pegá esto
// Después: Implementar → Nueva implementación → Aplicación web
//   Ejecutar como: Yo   |   Quién tiene acceso: Cualquier usuario
// Copiá la URL que termina en /exec y pegala en la app
// ──────────────────────────────────────────────────────────────────

const HOJA_POR_DEFECTO = '${this.HOJA_DEF}';

const HEADERS_ESTRES = ${headers};

// Columnas de ratios: se les fuerza formato numérico para que Sheets no
// las interprete como fechas, que es lo que pasó en la planilla de Doppler
// con E/e' e IMC (7.3 terminaba siendo el 7 de marzo).
const COLUMNAS_NUMERICAS = ${JSON.stringify(idxRatio)};

function doPost(e) {
  try {
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

    sheet.appendRow(data.row);

    // Y se reafirma en la fila recién escrita, por si la columna se reformateó
    const fila = sheet.getLastRow();
    COLUMNAS_NUMERICAS.forEach(function (col) {
      sheet.getRange(fila, col).setNumberFormat('0.00');
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', fila: fila }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Script activo ✓' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
    },

    // ── Exportación local a CSV ──
    exportarCSV(filas) {
        if (!filas || !filas.length) return false;
        const esc = x => `"${String(x ?? '-').replace(/"/g, '""')}"`;
        const csv = [this.HEADERS.map(esc).join(';')]
            .concat(filas.map(f => f.map(esc).join(';'))).join('\r\n');
        descargarTexto('﻿' + csv, `eco-estres-${new Date().toISOString().slice(0, 10)}.csv`);
        return true;
    }
};

if (typeof window !== 'undefined') window.EstresSheets = EstresSheets;
