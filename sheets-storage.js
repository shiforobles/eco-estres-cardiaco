/* ================================================
   Guardado de estudios en Google Sheets
   ================================================

   Mismo patrón que la app de Eco Doppler —una fila plana por estudio,
   enviada a un Apps Script que la agrega a una hoja— con estas correcciones
   sobre aquel diseño, tomadas de mirar la planilla real:

   1. Los ratios viajan como NÚMERO, no como texto, y el script les fuerza
      formato numérico. En la planilla de Doppler, Sheets interpretó E/e'
      e IMC como fechas (7.3 → 7 de marzo) y quedaron inservibles.
   2. La columna Informe se llena siempre: si no se generó, se genera.
   3. Hay una columna Resultado con valor categórico único, para poder
      graficar sin parsear texto.
   4. Va el identificador de HC, no el nombre del paciente.

   El estudio se envía DIRECTO al Sheet: sin copia local, sin cola, sin
   contador. El POST usa mode:'no-cors', que entrega pero impide leer la
   respuesta, así que la app no puede confirmar la recepción; si alguna vez
   falla, se ve al revisar la planilla.

   Para no duplicar filas, cada estudio lleva un ID propio (columna 'ID',
   última). El ID se arma al empezar el estudio y se mantiene mientras sea el
   mismo: guardar dos veces manda el MISMO id y el Apps Script REEMPLAZA la
   fila en vez de agregar otra. Un estudio nuevo lleva un id nuevo.
   ================================================ */

const EstresSheets = {

    URL_KEY:   'ecoestres_script_url',
    HOJA_KEY:  'ecoestres_hoja',
    SHEET_KEY: 'ecoestres_sheet_url',
    HOJA_DEF:  'Estrés',

    getUrl()          { return localStorage.getItem(this.URL_KEY) || ''; },
    setUrl(u)         { localStorage.setItem(this.URL_KEY, (u || '').trim()); },
    getHoja()         { return localStorage.getItem(this.HOJA_KEY) || this.HOJA_DEF; },
    setHoja(h)        { localStorage.setItem(this.HOJA_KEY, (h || '').trim() || this.HOJA_DEF); },
    getSheetUrl()     { return localStorage.getItem(this.SHEET_KEY) || ''; },
    setSheetUrl(u)    { localStorage.setItem(this.SHEET_KEY, (u || '').trim()); },
    estaConfigurado() { return !!this.getUrl(); },

    // Versión del contrato de columnas de la hoja de Estrés. Tiene que coincidir con
    // ESQUEMA_ESTRES_V del Apps Script. Al subir de versión (columnas nuevas), hay que
    // migrar la hoja ANTES de volver a enviar.
    ESQUEMA: 5,
    MIGRADO_KEY: 'ecoestres_esquema_migrado',
    // El POST usa no-cors y no puede leer la respuesta: si la hoja quedó en el esquema
    // viejo, el script rechaza la fila (HOJA_SIN_MIGRAR) y la app no se entera. Por eso
    // se avisa hasta que el operador confirme que migró, en vez de dar un falso "guardado".
    migrada()       { return localStorage.getItem(this.MIGRADO_KEY) === String(this.ESQUEMA); },
    marcarMigrada() { try { localStorage.setItem(this.MIGRADO_KEY, String(this.ESQUEMA)); } catch (e) { /* noop */ } },

    // ── Columnas: filiación → antecedentes → hemodinamia → dominios → informe ──
    HEADERS: [
        // Filiación (sin nombre: sólo el identificador)
        'Fecha', 'HC', 'Edad', 'Sexo', 'Peso', 'Altura', 'SC',
        // Antecedentes y contexto
        'Indicación', 'Medicación', 'Betabloqueo',
        // Valvulopatía estructurada: cada dato en su columna, para poder contarlos.
        // En texto libre no hay forma de saber cuántas EAo bicúspides hubo en el año.
        'Valvulopatía', 'Severidad valvular', 'Bicúspide',
        // Estudio previo y progresión anual calculada.
        'Fecha estudio previo', 'Vmax previa', 'Gradiente previo', 'AVA previa', 'Aorta previa',
        'Δ Vmax/año', 'Δ Gradiente/año', 'Δ AVA/año', 'Δ Aorta/año',
        // Texto libre del operador. Sale acá y en el informe; las notas privadas NO.
        'Otros antecedentes',
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
        // La escala con la que se calculó el índice. Sin esto, los estudios cargados
        // antes del 25/10/2026 —con puntaje crudo 1-5, que inflaba el WMSI— se
        // comparan con los nuevos sin que nada lo advierta.
        'WMSI reposo', 'WMSI post', 'Delta WMSI', 'Escala WMSI',
        // Qué motor redactó la motilidad de reposo: se elige por estudio.
        'Motor texto',
        'Seg isquémicos', 'Seg secuela', 'Territorio', 'Patrón',
        // ECG
        'Ritmo', 'Conducción', 'ST basal', 'ST tipo', 'ST mm', 'ST morfología',
        'ST derivaciones', 'Arritmias',
        // Diastólico
        "E/e' reposo", "E/e' esfuerzo", 'VRT reposo', 'VRT esfuerzo', 'Diastólico esfuerzo',
        // Resultado
        'Resultado', 'Categorización', 'Avisos',
        // Texto completo
        'Informe',
        // Identificador propio del estudio, para no duplicar filas al reguardar.
        // En el Apps Script, si el ID ya está en la hoja se reemplaza esa fila; si no,
        // se agrega.
        'ID',
        // ── ECG (rediseño V9) ──
        // Las 8 columnas de ECG de arriba (Ritmo … Arritmias) quedan en su lugar y con
        // su nombre, llenas con los datos nuevos. Estas SIETE van al final, después de
        // 'ID', para no correr ninguna columna anterior: las filas ya guardadas
        // conservan todas sus posiciones y estas quedan vacías hasta migrar la hoja.
        'Q/secuela', 'Arritmias basales', 'ST aparición', 'ST recuperación',
        'ECG interpretable', 'Motivo no interpretable', 'ECG resultado'
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
            // Un ápex comprometido en bloque toca tres territorios por anatomía: no es
            // multiterritorial y no debe contarse como tal.
            if (H.patronApical) return 'positivo apical';
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

    // Identificador de reserva: sólo se usa si el llamador no pasó uno (p. ej. los
    // tests). En la app el id lo arma y lo mantiene app.js, para que guardar dos
    // veces el mismo estudio mande el mismo id.
    idDeReserva() {
        return 'ee-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    },

    construirFila(informe, id) {
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
        const idEstudio = id || this.idDeReserva();

        return [
            fechaEst, v('paciente_id') || nada,
            t(H.edad), H.sexo === 'F' ? 'F' : 'M', t(v('peso')), t(v('altura')),
            num_(document.getElementById('sc_display').value),

            v('indicacion_libre') || textoSelect('indicacion'),
            medicacionEnTexto() || nada,
            H.betabloqueante ? 'Sí' : 'No',

            H.valvTipoTxt || nada, H.valvSeveridadTxt || nada,
            H.valvBicuspide === 'si' ? 'Sí' : (H.valvBicuspide === 'no' ? 'No' : nada),

            v('prev_fecha') || nada, num_(v('prev_vmax')), num_(v('prev_grad')),
            num_(v('prev_ava')), num_(v('prev_aorta')),
            num_(H.progresion && H.progresion.vmax, true),
            num_(H.progresion && H.progresion.grad, true),
            num_(H.progresion && H.progresion.ava, true),
            num_(H.progresion && H.progresion.aorta, true),

            H.antOtros || nada,

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
            (typeof ESCALA_WMSI !== 'undefined' ? ESCALA_WMSI : nada),
            H.motorTexto === 'doppler' ? 'Doppler A+C' : 'propio',
            H.isquemicos.length, H.secuelas.length,
            H.territoriosIsquemia.join('+') || nada,
            H.patronGlobal ? 'Global' : 'Segmentaria',

            H.ritmoTxt || nada, H.conduccionTxt || 'Ninguno', H.stBasalTxt || nada,
            H.stTipo ? textoSelect('ecg_st_tipo') : 'Sin cambios',
            num_(v('ecg_st_mm')), H.stMorfologiaTxt || nada, v('ecg_st_deriv') || nada,
            H.ecgArritmiasEsfuerzoTxt || 'Sin arritmias',

            num_(H.eeReposo), num_(H.eeEstres), num_(H.vrtReposo), num_(H.vrtEstres),
            textoSelect('diast_resultado'),

            this.resultadoCategorico(H),
            cat.noConcluyente ? 'no categorizable' : cat.nivel,
            avisos || nada,

            this.limpiarInforme(informe) || nada,

            idEstudio,

            // ── ECG (rediseño V9): columnas nuevas al final ──
            H.ecgQSecuela || nada,
            H.ecgArritmiasBasales || nada,
            H.ecgStAparicionTxt || nada,
            H.ecgStRecuperacionTxt || nada,
            H.ecgInterpretable,
            H.ecgNoInterpretableMotivo || nada,
            H.ecgResultado
        ];
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

    if (destino) {
      sheet.getRange(destino, 1, 1, data.row.length).setValues([data.row]);
    } else {
      sheet.appendRow(data.row);
      destino = sheet.getLastRow();
    }

    COLUMNAS_NUMERICAS.forEach(function (col) {
      sheet.getRange(destino, col).setNumberFormat('0.00');
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', fila: destino }))
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
    }
};

if (typeof window !== 'undefined') window.EstresSheets = EstresSheets;
