/* ================================================
   Eco Estrés Cardíaco — app.js  v1.0
   ================================================ */

// ── ESTADO GLOBAL ──────────────────────────────
const WM = {
    reposo: {},   // segId → score 0-5
    estres: {}
};

// Definición de los 17 segmentos AHA
// Orientación estándar eco: visto desde el ápex, LATERAL a la derecha, SEPTAL a la izquierda.
// Sentido horario desde 12h: Anterior → Anterolateral → Inferolateral → Inferior → Inferoseptal → Anteroseptal
const SEGMENTS = [
    // Basales (ring 0) — horario desde 12h: Ant(0), AL(1), IL(2), Inf(3), IS(4), AS(5)
    { id:1,  name:'Basal Anterior',       ring:0, pos:0, territory:'DA' },
    { id:6,  name:'Basal Anterolateral',  ring:0, pos:1, territory:'Cx' },
    { id:5,  name:'Basal Inferolateral',  ring:0, pos:2, territory:'Cx' },
    { id:4,  name:'Basal Inferior',       ring:0, pos:3, territory:'CD' },
    { id:3,  name:'Basal Inferoseptal',   ring:0, pos:4, territory:'CD' },
    { id:2,  name:'Basal Anteroseptal',   ring:0, pos:5, territory:'DA' },
    // Medios (ring 1) — mismo orden horario
    { id:7,  name:'Mid Anterior',         ring:1, pos:0, territory:'DA' },
    { id:12, name:'Mid Anterolateral',    ring:1, pos:1, territory:'Cx' },
    { id:11, name:'Mid Inferolateral',    ring:1, pos:2, territory:'Cx' },
    { id:10, name:'Mid Inferior',         ring:1, pos:3, territory:'CD' },
    { id:9,  name:'Mid Inferoseptal',     ring:1, pos:4, territory:'CD' },
    { id:8,  name:'Mid Anteroseptal',     ring:1, pos:5, territory:'DA' },
    // Apicales (ring 2, 4 seg a 90°) — horario: Ant(0), Lat(1), Inf(2), Sep(3)
    { id:13, name:'Apical Anterior',      ring:2, pos:0, territory:'DA' },
    { id:16, name:'Apical Lateral',       ring:2, pos:1, territory:'Cx' },
    { id:15, name:'Apical Inferior',      ring:2, pos:2, territory:'CD' },
    { id:14, name:'Apical Septal',        ring:2, pos:3, territory:'DA' },
    // Apex (ring 3)
    { id:17, name:'Apex',                 ring:3, pos:0, territory:'DA' }
];

// Radios [interior, exterior] por anillo
const RING_RADII = [[85,140],[45,85],[15,45],[0,15]];
const RING_COUNTS = [6,6,4,1];
const CX = 150, CY = 150;

const SCORE_COLORS = ['#9CA3AF','#22C55E','#FDE047','#FB923C','#EF4444','#A855F7'];
const SCORE_LABELS = ['—','Normal','Hipoc.L','Hipoc.M','Acinesia','Discinesia'];

let currentProtocol = 'ejercicio';
let currentSpecialTab = 'viabilidad';

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar scores en 0 (no evaluado)
    SEGMENTS.forEach(s => { WM.reposo[s.id] = 0; WM.estres[s.id] = 0; });

    initTheme();
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

    buildSegmentsTable();
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    updateWMSI();

    // Sincronizar peso dobutamina/dipiridamol con peso principal
    document.getElementById('peso').addEventListener('input', () => {
        const p = document.getElementById('peso').value;
        if (p) document.getElementById('dob_peso').value = p;
        if (p) document.getElementById('dip_peso').value = p;
        calcDobutamina();
        calcDipiridamol();
    });

    // Recalcular lo derivado al cambiar datos que lo alimentan
    ['sexo', 'ant_betabloq', 'fevi_reposo', 'fevi_pico'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', calcEjercicio);
    });

    // Cambiar el trastorno de conducción reclasifica los segmentos septales:
    // hay que rehacer el resumen de motilidad y el aviso del WMSI.
    ['change', 'input'].forEach(ev =>
        document.getElementById('ecg_conduccion').addEventListener(ev, updateWMSI));

    // "Ritmo de marcapasos" se puede marcar en Ritmo de base o en Trastorno de conducción.
    // Si sólo se marca en el primero, la exclusión septal no se aplicaba y los segmentos
    // septales salían atribuidos a un territorio coronario. Se mantienen sincronizados.
    document.getElementById('ecg_ritmo').addEventListener('change', () => {
        const cond = document.getElementById('ecg_conduccion');
        if (document.getElementById('ecg_ritmo').value === 'marcapasos' && cond.value !== 'marcapasos') {
            cond.value = 'marcapasos';
            updateWMSI();
            showNotice('Ritmo de marcapasos: los segmentos septales quedan fuera del análisis isquémico.', 'warn');
        }
    });
    document.getElementById('ecg_conduccion').addEventListener('change', () => {
        const ritmo = document.getElementById('ecg_ritmo');
        if (document.getElementById('ecg_conduccion').value === 'marcapasos' && ritmo.value !== 'marcapasos') {
            ritmo.value = 'marcapasos';
        }
    });

    // Fecha del estudio: por defecto hoy
    setFechaHoy();
    initFirma();

    calcEjercicio();
    document.querySelectorAll('.chk-pre').forEach(el => el.addEventListener('change', updateChecklistBadge));
    document.querySelectorAll('.chk-arr').forEach(el => el.addEventListener('change', avisarArritmias));
    document.getElementById('arr_sintomas').addEventListener('change', avisarArritmias);
    updateChecklistBadge();
    renderBancos();
    renderMedicacion();
    renderHistorial(true);

    // Autosave / recuperación del estudio en curso (al final, con todo ya construido)
    setupAutosave();
});

// ── TEMA ──────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('eco-estres-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-icon').textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('eco-estres-theme', next);
}

// ── PATRÓN DE LA ALTERACIÓN: autocompletado con override ──
// Global = hipoquinesia difusa sin distribución coronaria (miocardiopatía dilatada).
// Criterio: ≥12 de 17 segmentos alterados en reposo, los tres territorios y FEy ≤40%.
let patronTocadoAMano = false;

function marcarPatronManual() {
    patronTocadoAMano = true;
    const nota = document.getElementById('patron_origen');
    if (nota) nota.textContent = 'Elegido a mano: la app ya no lo modifica.';
    scheduleSave();
}

function detectarPatronGlobal() {
    const alterados = SEGMENTS.filter(sg => WM.reposo[sg.id] > 1);
    if (alterados.length < 12) return false;
    const terr = new Set(alterados.map(sg => sg.territory));
    if (terr.size < 3) return false;
    const fey = num('fevi_reposo');
    return fey > 0 && fey <= 40;
}

function autocompletarPatron() {
    const el = document.getElementById('patron_motilidad');
    if (!el || patronTocadoAMano) return;
    const global = detectarPatronGlobal();
    el.value = global ? 'global' : 'segmentaria';
    const nota = document.getElementById('patron_origen');
    if (nota) nota.textContent = global
        ? 'Propuesto global: ≥12 segmentos, los tres territorios y FEy ≤40 %. Podés corregirlo.'
        : 'Se propone solo según extensión, territorios y FEy.';
}

// ── ESTUDIO DIASTÓLICO: autocompletado con override ───
// El select arranca con lo que dio el cálculo; si el operador lo toca, manda su criterio.
let diastolicoTocadoAMano = false;

function marcarDiastolicoManual() {
    diastolicoTocadoAMano = true;
    const nota = document.getElementById('diast_origen');
    if (nota) nota.textContent = 'Corregido a mano: el cálculo ya no lo modifica.';
    scheduleSave();
}

function autocompletarDiastolico(veredicto) {
    const el = document.getElementById('diast_resultado');
    if (!el || diastolicoTocadoAMano) return;
    el.value = veredicto;
    const nota = document.getElementById('diast_origen');
    if (nota) nota.textContent = veredicto === 'no_evaluado'
        ? 'Se completa solo desde E/e\' y VRT; podés corregirlo.'
        : `Completado desde E/e' y VRT; podés corregirlo.`;
}

// ── FIRMA DEL INFORME ─────────────────────────
// Es configuración del operador, no un dato del estudio: vive en localStorage,
// fuera del borrador y fuera del repositorio.
const FIRMA_KEY = 'eco-estres-firma';

function initFirma() {
    const el = document.getElementById('firma_informe');
    if (!el) return;
    try { el.value = localStorage.getItem(FIRMA_KEY) || ''; } catch (e) { /* noop */ }
    el.addEventListener('input', () => {
        try { localStorage.setItem(FIRMA_KEY, el.value); } catch (e) { /* noop */ }
    });
}

function firmaInforme() {
    return v('firma_informe') || (typeof NARRATIVA !== 'undefined' ? NARRATIVA.firma : '') || '';
}

// ── FECHA DEL ESTUDIO ─────────────────────────
function setFechaHoy() {
    const el = document.getElementById('fecha_estudio');
    if (!el || el.value) return;
    const d = new Date();
    el.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── BSA ───────────────────────────────────────
function calcBSA() {
    const peso = parseFloat(document.getElementById('peso').value);
    const altura = parseFloat(document.getElementById('altura').value);
    if (peso > 0 && altura > 0) {
        const bsa = 0.007184 * Math.pow(altura, 0.725) * Math.pow(peso, 0.425);
        document.getElementById('sc_display').value = bsa.toFixed(2) + ' m²';
    } else {
        document.getElementById('sc_display').value = '';
    }
}

// ── CAMBIO DE EDAD ─────────────────────────────
function onEdadChange() {
    calcEjercicio();
    calcDobutamina();
}

// ── PROTOCOLO TABS ────────────────────────────
function setProtocol(proto) {
    currentProtocol = proto;
    document.querySelectorAll('.protocol-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.protocol === proto);
    });
    document.querySelectorAll('.protocol-panel').forEach(p => p.style.display = 'none');
    document.getElementById('panel-' + proto).style.display = 'block';
    scheduleSave();
}

// ── HELPERS HEMODINÁMICOS ─────────────────────
function num(id) {
    const el = document.getElementById(id);
    const n = parseFloat(el ? el.value : '');
    return isNaN(n) ? 0 : n;
}
// Extrae la sistólica de un texto tipo "185/90" (protocolos farmacológicos)
function sistolica(txt) {
    if (!txt) return 0;
    const m = String(txt).match(/(\d{2,3})/);
    return m ? parseInt(m[1]) : 0;
}
// TA de una fila del registro hemodinámico como texto "130/80"
function taFila(fila) {
    const s = num('esf_' + fila + '_tas'), d = num('esf_' + fila + '_tad');
    if (!s && !d) return '';
    return s + '/' + (d || '—');
}
// METs predichos por edad y sexo (nomogramas de población referida)
function metsPredichos(edad, sexo) {
    if (!(edad > 0)) return null;
    return sexo === 'F' ? 14.7 - 0.13 * edad : 18 - 0.15 * edad;
}
function categoriaMETs(mets) {
    if (!(mets > 0)) return null;
    if (mets < 5)  return 'capacidad funcional reducida';
    if (mets < 7)  return 'capacidad funcional regular';
    if (mets < 10) return 'buena capacidad funcional';
    return 'excelente capacidad funcional';
}

// ── CALCULADORA EJERCICIO (post-esfuerzo) ─────
function calcEjercicio() {
    const edad = parseInt(v('edad')) || 0;
    const sexo = document.getElementById('sexo').value;
    const fcPico  = num('esf_max_fc');
    const fcRec   = num('esf_rec_fc');
    const tasBasal = num('esf_basal_tas');
    const tasPico  = num('esf_max_tas');
    const fcImg = num('ej_fc_img');
    const set = (id, txt, color) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = txt;
        el.style.color = color || '';
    };

    // Doble producto por fila
    ['basal', 'max', 'rec'].forEach(f => {
        const fc = num('esf_' + f + '_fc'), tas = num('esf_' + f + '_tas');
        const cel = document.getElementById('esf_' + f + '_dp');
        if (cel) cel.textContent = (fc > 0 && tas > 0) ? (fc * tas).toLocaleString('es-AR') : '—';
    });

    // FC predicha y adecuación
    if (edad > 0) {
        const fcMax = 220 - edad;
        const fc85 = Math.round(fcMax * 0.85);
        set('fc_max_predicha', fcMax + ' lpm');
        set('fc_85', fc85 + ' lpm');
        if (fcPico > 0) {
            const pct = Math.round((fcPico / fcMax) * 100);
            const ok = pct >= 85;
            set('pct_fc', pct + ' %', ok ? 'var(--color-success)' : 'var(--color-error)');
            const bb = document.getElementById('ant_betabloq').checked;
            set('resp_cronotrop',
                ok ? '✓ Adecuada (≥85%)'
                   : '✗ Sub-máxima — reduce la sensibilidad del estudio' + (bb ? ' (bajo betabloqueante)' : ''),
                ok ? 'var(--color-success)' : 'var(--color-error)');
        } else {
            set('pct_fc', '—'); set('resp_cronotrop', '—');
        }
    } else {
        ['fc_max_predicha', 'fc_85', 'pct_fc', 'resp_cronotrop'].forEach(id => set(id, '—'));
    }

    // Doble producto en el máximo esfuerzo
    const avisoDP = document.getElementById('aviso-dp');
    if (fcPico > 0 && tasPico > 0) {
        const dp = fcPico * tasPico;
        const pctFC = edad > 0 ? Math.round((fcPico / (220 - edad)) * 100) : 0;
        set('doble_producto', `${dp.toLocaleString('es-AR')} — ${dp >= 25000 ? '✓ Carga hemodinámica adecuada' : dp < 20000 ? '⚠ <20.000: estímulo insuficiente' : '⚠ <25.000: carga submáxima'}`,
            dp >= 25000 ? 'var(--color-success)' : dp < 20000 ? 'var(--color-error)' : 'var(--color-warning)');
        // En el borde del umbral con buena respuesta cronotrópica, la decisión es del operador
        if (avisoDP) {
            if (dp >= 18000 && dp < 20000 && pctFC >= 85) {
                avisoDP.style.display = 'block';
                avisoDP.innerHTML = `<strong>⚠ Doble producto en el límite.</strong> ${dp.toLocaleString('es-AR')} ` +
                    `queda por debajo de 20.000 y el informe va a salir <strong>no concluyente por estímulo insuficiente</strong>, ` +
                    `pero la respuesta cronotrópica fue buena (${pctFC} % de la FCMT). ` +
                    `Si considerás que el estímulo fue adecuado, corregí el resultado a mano antes de firmar.`;
            } else avisoDP.style.display = 'none';
        }
    } else {
        set('doble_producto', '—');
        if (avisoDP) avisoDP.style.display = 'none';
    }

    // Respuesta tensional
    if (tasBasal > 0 && tasPico > 0) {
        const d = tasPico - tasBasal;
        let txt, col;
        if (d <= -10) { txt = `${d} mmHg — ⚠ RESPUESTA HIPOTENSIVA (marcador de alto riesgo)`; col = 'var(--color-error)'; }
        else if (tasPico >= 210) { txt = `+${d} mmHg (pico ${tasPico}) — ⚠ Respuesta hipertensiva`; col = 'var(--color-warning)'; }
        else if (d < 20) { txt = `+${d} mmHg — ⚠ Respuesta tensional plana (<20 mmHg)`; col = 'var(--color-warning)'; }
        else { txt = `+${d} mmHg — ✓ Normotensiva`; col = 'var(--color-success)'; }
        set('resp_tensional', txt, col);
    } else set('resp_tensional', '—');

    // HRR al primer minuto
    if (fcPico > 0 && fcRec > 0) {
        const hrr = fcPico - fcRec;
        set('hrr1', `${hrr} lpm — ${hrr > 12 ? '✓ Normal (>12 lpm)' : '⚠ Anormal (≤12 lpm): marcador pronóstico adverso'}`,
            hrr > 12 ? 'var(--color-success)' : 'var(--color-warning)');
    } else set('hrr1', '—');

    // Capacidad funcional (METs cargados a mano)
    const mets = num('ej_mets');
    if (mets > 0) {
        const pred = metsPredichos(edad, sexo);
        const pctMets = pred ? Math.round((mets / pred) * 100) : null;
        set('cap_funcional', `${mets.toFixed(1)} METs${pctMets ? ` · ${pctMets} % del predicho` : ''} — ${categoriaMETs(mets)}`,
            mets < 5 ? 'var(--color-error)' : mets < 7 ? 'var(--color-warning)' : 'var(--color-success)');
    } else set('cap_funcional', '—');

    // % de FC pico al adquirir la primera imagen post-esfuerzo
    const aviso = document.getElementById('aviso-adquisicion');
    if (fcPico > 0 && fcImg > 0) {
        const pctAdq = Math.round((fcImg / fcPico) * 100);
        const ok = pctAdq >= 85;
        set('pct_fc_adq', `${pctAdq} % (${fcImg} de ${fcPico} lpm)`, ok ? 'var(--color-success)' : 'var(--color-error)');
        if (aviso) {
            if (ok) aviso.style.display = 'none';
            else {
                aviso.style.display = 'block';
                aviso.innerHTML = `<strong>⚠ Adquisición tardía.</strong> La primera imagen post-esfuerzo se tomó con el ` +
                    `${pctAdq} % de la FC pico${num('ej_seg_img') ? ', a los ' + num('ej_seg_img') + ' segundos' : ''}. ` +
                    `Por debajo del 85 % la isquemia puede haberse resuelto: <strong>la sensibilidad del estudio está reducida</strong> ` +
                    `y así debe constar en el informe.`;
            }
        }
    } else {
        set('pct_fc_adq', '—');
        if (aviso) aviso.style.display = 'none';
    }

    sugerirCategorizacion();
    avisarArritmias();
}

// Aviso de pantalla: qué arritmias van a pasar a la conclusión y cuáles no.
function avisarArritmias() {
    const aviso = document.getElementById('aviso-arritmias');
    if (!aviso) return;
    const marcadas = ARRITMIAS.filter(a => document.getElementById(a.id) && document.getElementById(a.id).checked);
    if (!marcadas.length) { aviso.style.display = 'none'; return; }
    const relevantes = marcadas.filter(a => a.relevante);
    const sintomatica = document.getElementById('arr_sintomas').value === 'sintomatica';
    aviso.style.display = 'block';
    if (relevantes.length || sintomatica) {
        aviso.style.borderLeftColor = 'var(--color-warning)';
        aviso.style.background = 'var(--color-warning-bg)';
        aviso.innerHTML = '<strong>Pasa a la conclusión.</strong> ' +
            (relevantes.length ? relevantes.map(a => a.txt).join(', ') : marcadas.map(a => a.txt).join(', ')) +
            (sintomatica && !relevantes.length ? ' (por ser sintomática)' : '') +
            ' — tiene peso pronóstico propio.';
    } else {
        aviso.style.borderLeftColor = 'var(--color-success)';
        aviso.style.background = 'var(--color-success-bg)';
        aviso.innerHTML = '<strong>Queda sólo en el bloque ECG.</strong> ' + marcadas.map(a => a.txt).join(', ') +
            ' — patrón benigno, no modifica la conclusión.';
    }
}

// ══════════════════════════════════════════════
//  LISTAS QUE APRENDEN (indicaciones y medicación)
//  Se guardan en esta computadora y se ordenan por frecuencia:
//  lo que más usás queda primero y a un clic.
// ══════════════════════════════════════════════
const BANCO_IND_KEY = 'eco-estres-indicaciones';
const BANCO_MED_KEY = 'eco-estres-medicacion';
const BANCO_TOPE = 14;

let medicacionActual = [];   // [{nombre, dosis}] del estudio en curso

function leerBanco(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
}
function guardarBanco(key, lista) {
    try { localStorage.setItem(key, JSON.stringify(lista.slice(0, 60))); } catch (e) { /* noop */ }
}

// Suma un uso o lo crea si es nuevo, y reordena por frecuencia
function registrarEnBanco(key, item) {
    if (!item.nombre) return;
    const lista = leerBanco(key);
    const clave = item.nombre.trim().toLowerCase();
    const yaEsta = lista.find(x => x.nombre.trim().toLowerCase() === clave);
    if (yaEsta) {
        yaEsta.usos = (yaEsta.usos || 0) + 1;
        if (item.dosis) yaEsta.dosis = item.dosis;   // la última dosis usada manda
    } else {
        lista.push({ nombre: item.nombre.trim(), dosis: (item.dosis || '').trim(), usos: 1 });
    }
    lista.sort((a, b) => (b.usos || 0) - (a.usos || 0));
    guardarBanco(key, lista);
}

function olvidarDelBanco(key, nombre) {
    guardarBanco(key, leerBanco(key).filter(x => x.nombre.trim().toLowerCase() !== nombre.trim().toLowerCase()));
    renderBancos();
}

function usarIndicacion(nombre) {
    const el = document.getElementById('indicacion_libre');
    const actual = el.value.trim();
    if (actual.toLowerCase().includes(nombre.toLowerCase())) return;
    el.value = actual ? actual.replace(/\.?\s*$/, '') + '. ' + nombre : nombre;
    el.dispatchEvent(new Event('input', { bubbles: true }));
}

function agregarMedicacion(nombre, dosis) {
    const elN = document.getElementById('med_nombre'), elD = document.getElementById('med_dosis');
    const n = (nombre !== undefined ? nombre : elN.value).trim();
    const d = (dosis !== undefined ? dosis : elD.value).trim();
    if (!n) { elN.focus(); return; }
    if (!medicacionActual.some(m => m.nombre.toLowerCase() === n.toLowerCase()))
        medicacionActual.push({ nombre: n, dosis: d });
    registrarEnBanco(BANCO_MED_KEY, { nombre: n, dosis: d });
    if (nombre === undefined) { elN.value = ''; elD.value = ''; elN.focus(); }
    renderMedicacion(); renderBancos(); scheduleSave();
}

function quitarMedicacion(i) {
    medicacionActual.splice(i, 1);
    renderMedicacion(); scheduleSave();
}

function renderMedicacion() {
    const cont = document.getElementById('med-lista');
    if (!cont) return;
    cont.innerHTML = medicacionActual.length
        ? medicacionActual.map((m, i) =>
            `<span class="med-item">${m.nombre}${m.dosis ? ' <em>' + m.dosis + '</em>' : ''}` +
            `<button type="button" class="med-quitar" onclick="quitarMedicacion(${i})" title="Quitar">✕</button></span>`).join('')
        : '<span class="firma-nota">Sin medicación cargada.</span>';
}

function medicacionEnTexto() {
    return medicacionActual.map(m => m.nombre + (m.dosis ? ' ' + m.dosis : '')).join(', ');
}

function chipHTML(x, accion) {
    return `<span class="chip" onclick="${accion}" title="${x.usos || 1} uso(s)">` +
        `${x.nombre}${x.dosis ? ' <em>' + x.dosis + '</em>' : ''}</span>`;
}

function renderBancos() {
    const esc = t => JSON.stringify(t).replace(/"/g, '&quot;');
    const ind = document.getElementById('chips-indicacion');
    if (ind) {
        const lista = leerBanco(BANCO_IND_KEY).slice(0, BANCO_TOPE);
        ind.innerHTML = lista.length
            ? '<span class="chips-titulo">Usadas antes:</span>' +
              lista.map(x => chipHTML(x, `usarIndicacion(${esc(x.nombre)})`)).join('')
            : '';
    }
    const med = document.getElementById('chips-medicacion');
    if (med) {
        const lista = leerBanco(BANCO_MED_KEY).slice(0, BANCO_TOPE);
        med.innerHTML = lista.length
            ? '<span class="chips-titulo">Un clic para agregar:</span>' +
              lista.map(x => chipHTML(x, `agregarMedicacion(${esc(x.nombre)},${esc(x.dosis || '')})`)).join('')
            : '<span class="firma-nota">Los fármacos que cargues quedan acá, a un clic, ordenados por uso.</span>';
    }
}

// La indicación escrita se aprende al generar el informe, no en cada tecla
function aprenderIndicacion() {
    const txt = v('indicacion_libre');
    if (txt) registrarEnBanco(BANCO_IND_KEY, { nombre: txt });
}

// ══════════════════════════════════════════════
//  CATEGORIZACIÓN DE RIESGO SUGERIDA
//  Anclada en el WMSI pico, el predictor más validado del eco estrés:
//  1,0 → 0,8-0,9 % de eventos/año · 1,1-1,7 → 2,6-3,1 % · >1,7 → 5,2-5,5 %.
//  Sugiere y explica el porqué; la decisión es del operador.
// ══════════════════════════════════════════════
function evaluarCategorizacion() {
    const H = recolectarHallazgos();
    const alto = [], intermedio = [];
    const wmsiPico = H.wmsiEstres !== null ? parseFloat(H.wmsiEstres) : null;

    // ── Riesgo alto ──
    if (wmsiPico !== null && wmsiPico > 1.7)
        alto.push(`WMSI pico ${H.wmsiEstres} (>1,7): ~5 % de eventos cardíacos por año`);
    if (H.feyReposo > 0 && H.feyReposo <= 45)
        alto.push(`FEy en reposo ${H.feyReposo} % (≤45 %): marcador independiente de riesgo`);
    if (H.caidaFey)
        alto.push(`la FEy cae de ${H.feyReposo} % a ${H.feyEstres} % con el esfuerzo: sugiere isquemia extensa`);
    if (H.territoriosIsquemia.length > 1)
        alto.push(`isquemia en ${H.territoriosIsquemia.length} territorios coronarios`);
    if (H.hipotension)
        alto.push('respuesta hipotensiva al esfuerzo');
    if (H.mets > 0 && H.mets < 5)
        alto.push(`capacidad funcional ${H.mets} METs (<5): predictor independiente de mortalidad`);
    if (H.isquemicos.length && H.dobleProducto > 0 && H.dobleProducto < 20000)
        alto.push(`isquemia con doble producto ${H.dobleProducto.toLocaleString('es-AR')}: umbral isquémico bajo`);
    if (H.arritmias.some(a => ['arr_tvns', 'arr_ev_poli', 'arr_dupletas'].includes(a.id)))
        alto.push('arritmia ventricular compleja durante el estudio');

    // ── Riesgo intermedio ──
    if (wmsiPico !== null && wmsiPico > 1.0 && wmsiPico <= 1.7)
        intermedio.push(`WMSI pico ${H.wmsiEstres} (1,1-1,7): ~3 % de eventos por año`);
    if (H.isquemicos.length && H.territoriosIsquemia.length <= 1)
        intermedio.push(`isquemia inducible en ${H.isquemicos.length} ` +
            `${H.isquemicos.length === 1 ? 'segmento' : 'segmentos'} de un solo territorio`);
    if (H.secuelas.length)
        intermedio.push('secuela sin reserva contráctil regional');
    if (H.diastResultado === 'positivo')
        intermedio.push('test diastólico de esfuerzo positivo');
    if (H.pctFCmax > 0 && H.pctFCmax < 85 && !H.betabloqueante)
        intermedio.push(`respuesta cronotrópica ${H.pctFCmax} % sin betabloqueo: posible incompetencia cronotrópica`);

    const nivel = alto.length ? 'alto' : intermedio.length ? 'intermedio' : 'bajo';
    return {
        nivel,
        motivos: alto.length ? alto : intermedio,
        noConcluyente: elegirRama(H) === 'noConcluyente',
        hayDatos: H.wmsiEstres !== null || H.feyReposo > 0
    };
}

function sugerirCategorizacion() {
    const el = document.getElementById('categorizacion-sugerida');
    if (!el) return;
    let r;
    try { r = evaluarCategorizacion(); }
    catch (e) { el.textContent = ''; return; }
    if (!r.hayDatos) { el.textContent = ''; el.className = 'hint-sugerida'; return; }

    const etiqueta = { bajo: '1 · Bajo', intermedio: '2 · Intermedio', alto: '3 · Alto' }[r.nivel];
    let html = `<strong>Sugerido: ${etiqueta}</strong>`;
    html += r.motivos.length
        ? '<ul class="cat-motivos">' + r.motivos.map(m => `<li>${m}</li>`).join('') + '</ul>'
        : '<div class="cat-motivos">Sin criterios de riesgo: WMSI pico normal, sin isquemia inducible ' +
          'ni marcadores de mal pronóstico.</div>';
    if (r.noConcluyente)
        html += '<div class="cat-salvedad">⚠ El estudio es no concluyente: esta categoría no descarta isquemia.</div>';
    el.innerHTML = html;
    el.className = 'hint-sugerida cat-panel hint-' + r.nivel;
}

// ── CALCULADORA DOBUTAMINA ────────────────────
function calcDobutamina() {
    const edad = parseInt(document.getElementById('edad').value) || 0;
    const peso = parseFloat(document.getElementById('dob_peso').value) || 0;
    const fcPico = parseInt(document.getElementById('dob_fc_pico').value) || 0;
    const dosisMax = parseInt(document.getElementById('dob_dosis_max').value) || 40;

    // FC targets
    if (edad > 0) {
        const fcMax = 220 - edad;
        const fc85 = Math.round(fcMax * 0.85);
        document.getElementById('dob_fc_max').textContent = fcMax + ' lpm';
        document.getElementById('dob_fc_target').textContent = fc85 + ' lpm';
        if (fcPico > 0) {
            const pct = Math.round((fcPico / fcMax) * 100);
            document.getElementById('dob_pct_fc').textContent = pct + '%';
            document.getElementById('dob_adecuacion').textContent = pct >= 85 ? '✓ Estudio adecuado' : '✗ FC sub-máxima';
            document.getElementById('dob_adecuacion').style.color = pct >= 85 ? 'var(--color-success)' : 'var(--color-error)';
        }
    }

    // Tabla de etapas
    const etapas = [5, 10, 20, 30, 40];
    const tbody = document.getElementById('dob-etapas');
    tbody.innerHTML = '';

    etapas.forEach((dosis, i) => {
        if (dosis > dosisMax) return;
        const velH = peso > 0 ? ((dosis * peso * 60) / 1000).toFixed(1) : '—';
        let rowClass = '';
        if (dosis <= 10) rowClass = 'dob-stage-low';
        else if (dosis <= 20) rowClass = 'dob-stage-mid';
        else if (dosis <= 30) rowClass = 'dob-stage-high';
        else rowClass = 'dob-stage-max';

        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `
            <td><strong>E${i+1}</strong></td>
            <td><strong>${dosis}</strong></td>
            <td>3 min</td>
            <td>${velH}${peso > 0 ? ' mL/h' : ''}</td>
            <td><input type="number" placeholder="lpm" style="width:65px"></td>
            <td><input type="text" placeholder="SIS/DIA" style="width:75px"></td>
            <td><input type="text" placeholder="Sin síntomas" style="width:120px"></td>
        `;
        tbody.appendChild(tr);
    });

    // Fila atropina
    const trAtr = document.createElement('tr');
    trAtr.style.background = '#FDF4FF';
    trAtr.innerHTML = `
        <td colspan="2"><strong style="color:#7C3AED">Atropina</strong> (0.25 mg c/1 min, máx 1 mg)</td>
        <td>—</td><td>—</td>
        <td><input type="number" placeholder="lpm" style="width:65px"></td>
        <td><input type="text" placeholder="SIS/DIA" style="width:75px"></td>
        <td><input type="text" placeholder="Sin síntomas" style="width:120px"></td>
    `;
    tbody.appendChild(trAtr);
}

// ── CALCULADORA DIPIRIDAMOL ───────────────────
function calcDipiridamol() {
    const peso = parseFloat(document.getElementById('dip_peso').value) || 0;
    const protocolo = document.getElementById('dip_protocolo').value;

    if (peso <= 0) {
        ['dip_dosis_total','dip_volumen','dip_fase1','dip_fase2'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
        return;
    }

    const dosis1 = 0.56 * peso;
    const vol1 = dosis1 / 5; // amp 5 mg/mL
    const velH1 = (vol1 * 60 / 4).toFixed(1); // 4 min

    document.getElementById('dip_fase1').textContent =
        `${dosis1.toFixed(1)} mg | Vol: ${vol1.toFixed(1)} mL | Vel: ${velH1} mL/h (en 4 min)`;

    const fase2Row = document.getElementById('dip_fase2_row');

    if (protocolo === 'alto') {
        const dosis2 = 0.28 * peso;
        const vol2 = dosis2 / 5;
        const velH2 = (vol2 * 60 / 2).toFixed(1); // 2 min
        document.getElementById('dip_fase2').textContent =
            `${dosis2.toFixed(1)} mg | Vol: ${vol2.toFixed(1)} mL | Vel: ${velH2} mL/h (en 2 min)`;
        fase2Row.style.display = 'flex';
        document.getElementById('dip_dosis_total').textContent = `${(dosis1 + dosis2).toFixed(1)} mg (0.84 mg/kg)`;
        document.getElementById('dip_volumen').textContent = `${(vol1 + vol2).toFixed(1)} mL`;
    } else {
        fase2Row.style.display = 'none';
        document.getElementById('dip_dosis_total').textContent = `${dosis1.toFixed(1)} mg (0.56 mg/kg)`;
        document.getElementById('dip_volumen').textContent = `${vol1.toFixed(1)} mL`;
    }
}

// ── FEY ───────────────────────────────────────
function calcFEVI() {
    const rep = parseFloat(document.getElementById('fevi_reposo').value);
    const pico = parseFloat(document.getElementById('fevi_pico').value);
    if (rep > 0 && pico > 0) {
        const delta = pico - rep;
        const txt = (delta >= 0 ? '+' : '') + delta.toFixed(0) + '%';
        document.getElementById('delta_fevi').value = txt +
            (delta >= 5 ? ' ▲ Adecuada' : delta >= 0 ? ' → Preservada' : ' ▼ Caída (isquemia / fatiga)');
    } else {
        document.getElementById('delta_fevi').value = '';
    }
}

// ── BULL'S EYE SVG ────────────────────────────
function polar2cart(r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function makeSegPath(ring, pos) {
    const [r1, r2] = RING_RADII[ring];
    const count = RING_COUNTS[ring];

    if (count === 1) {
        return `M ${CX} ${CY} m -${r2} 0 a ${r2} ${r2} 0 1 0 ${r2*2} 0 a ${r2} ${r2} 0 1 0 -${r2*2} 0`;
    }

    const step = 360 / count;
    const a1 = pos * step;
    const a2 = (pos + 1) * step;
    const [x1i, y1i] = polar2cart(r1, a1);
    const [x1o, y1o] = polar2cart(r2, a1);
    const [x2i, y2i] = polar2cart(r1, a2);
    const [x2o, y2o] = polar2cart(r2, a2);
    const large = step > 180 ? 1 : 0;
    return `M ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${r1} ${r1} 0 ${large} 0 ${x1i} ${y1i} Z`;
}

function getSegLabelPos(seg) {
    if (seg.ring === 3) return [CX, CY];
    const [r1, r2] = RING_RADII[seg.ring];
    const rMid = (r1 + r2) / 2;
    const step = 360 / RING_COUNTS[seg.ring];
    const aMid = (seg.pos + 0.5) * step;
    return polar2cart(rMid, aMid);
}

function renderBullsEye(svgId, stateKey) {
    const svg = document.getElementById(svgId);
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';

    // Background circle
    const bg = document.createElementNS(NS, 'circle');
    bg.setAttribute('cx', CX); bg.setAttribute('cy', CY); bg.setAttribute('r', 148);
    bg.setAttribute('fill', 'var(--color-bg-card)');
    svg.appendChild(bg);

    SEGMENTS.forEach(seg => {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'seg-group');

        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', makeSegPath(seg.ring, seg.pos));
        path.setAttribute('class', 'seg-path');
        path.setAttribute('data-id', seg.id);
        path.setAttribute('data-key', stateKey);
        path.setAttribute('fill', SCORE_COLORS[WM[stateKey][seg.id]]);
        path.setAttribute('stroke', 'var(--color-bg-card)');
        path.setAttribute('stroke-width', '2');
        path.style.cursor = 'pointer';

        path.addEventListener('click', () => {
            WM[stateKey][seg.id] = (WM[stateKey][seg.id] + 1) % 6;
            path.setAttribute('fill', SCORE_COLORS[WM[stateKey][seg.id]]);
            updateWMSI();
            updateSegTableRow(seg.id);
            scheduleSave();
        });

        // Tooltip
        const title = document.createElementNS(NS, 'title');
        title.textContent = `${seg.id}. ${seg.name} (${seg.territory}) — ${SCORE_LABELS[WM[stateKey][seg.id]]}`;
        path.appendChild(title);
        path.addEventListener('click', () => {
            title.textContent = `${seg.id}. ${seg.name} (${seg.territory}) — ${SCORE_LABELS[WM[stateKey][seg.id]]}`;
        });

        // Número
        const [lx, ly] = getSegLabelPos(seg);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', lx); txt.setAttribute('y', ly);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('font-size', seg.ring === 3 ? '11' : '9');
        txt.setAttribute('font-weight', 'bold');
        txt.setAttribute('fill', [2,3].includes(seg.id) || WM[stateKey][seg.id] === 0 ? '#374151' : '#fff');
        txt.style.pointerEvents = 'none';
        txt.textContent = seg.id;

        g.appendChild(path);
        g.appendChild(txt);
        svg.appendChild(g);
    });

    // Labels de anillos
    addRingLabels(svg, NS);
}

function addRingLabels(svg, NS) {
    const labels = [
        { text: 'Basal', r: 115, a: 272 },
        { text: 'Mid', r: 65, a: 272 },
        { text: 'Ap.', r: 30, a: 272 }
    ];
    labels.forEach(l => {
        const [x, y] = polar2cart(l.r, l.a);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', x); txt.setAttribute('y', y);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('font-size', '7');
        txt.setAttribute('fill', 'var(--color-text-secondary)');
        txt.setAttribute('font-style', 'italic');
        txt.style.pointerEvents = 'none';
        txt.textContent = l.text;
        svg.appendChild(txt);
    });
}

// ── WMSI ─────────────────────────────────────
// `excluir` = ids que no deben entrar en el índice. Se usa con trastorno de
// conducción: el WMSI es un índice de MOTILIDAD, y un septum alterado por
// activación eléctrica anómala no describe contractilidad. Incluirlo hace que el
// número se lea como disfunción inexistente y arruina la comparación entre
// estudios seriados del mismo paciente.
function calcWMSI(stateKey, excluir) {
    let sum = 0, n = 0;
    SEGMENTS.forEach(s => {
        if (excluir && excluir.includes(s.id)) return;
        const score = WM[stateKey][s.id];
        if (score > 0) { sum += score; n++; }
    });
    if (n === 0) return null;
    return (sum / n).toFixed(2);
}

function updateWMSI() {
    const wmsiRep = calcWMSI('reposo');
    const wmsiEst = calcWMSI('estres');

    const repTxt = wmsiRep !== null ? wmsiRep : '—';
    const estTxt = wmsiEst !== null ? wmsiEst : '—';

    document.getElementById('wmsi-reposo').textContent = repTxt;
    document.getElementById('wmsi-estres').textContent = wmsiEst !== null ? wmsiEst : '—';
    document.getElementById('wmsi-rep-tabla').textContent = repTxt;
    document.getElementById('wmsi-est-tabla').textContent = estTxt;

    // Respuesta global
    const globalResp = document.getElementById('wmsi-global-resp');
    if (wmsiRep !== null && wmsiEst !== null) {
        const dif = parseFloat(wmsiEst) - parseFloat(wmsiRep);
        if (parseFloat(wmsiEst) > 1.0 && dif > 0.1) {
            globalResp.innerHTML = '<span class="response-ischemia">▲ WMSI Estrés elevado</span>';
        } else if (parseFloat(wmsiEst) <= 1.0) {
            globalResp.innerHTML = '<span class="response-normal">✓ Sin nueva anomalía</span>';
        } else {
            globalResp.innerHTML = '<span class="response-scar">Sin cambio significativo</span>';
        }
    } else {
        globalResp.textContent = '';
    }

    updateMotilidadResumen(wmsiRep, wmsiEst);
}

// ── RESUMEN DE MOTILIDAD (calidad, extensión, territorios) ──
function interpWMSI(w) {
    if (w === null) return '—';
    const v = parseFloat(w);
    if (v <= 1.0)  return `${w} — Normal`;
    if (v <= 1.6)  return `${w} — Alteración leve-moderada`;
    return `${w} — Alteración extensa (peor pronóstico)`;
}

function contarMotilidad() {
    let evalRep = 0, evalEst = 0, isquemicos = 0, viables = 0, cicatriz = 0, sinPar = 0;
    const terrIsq = new Set();
    SEGMENTS.forEach(s => {
        const r = WM.reposo[s.id], e = WM.estres[s.id];
        if (r > 0) evalRep++;
        if (e > 0) evalEst++;
        const c = classifyResponse(r, e);
        if (c.key === 'isquemia' || c.key === 'isquemia_necrosis') { isquemicos++; terrIsq.add(s.territory); }
        if (c.key === 'viable') viables++;
        if (c.key === 'cicatriz') cicatriz++;
        if (c.key === 'parcial') sinPar++;
    });
    return { evalRep, evalEst, isquemicos, viables, cicatriz, sinPar, territorios: [...terrIsq] };
}

function updateMotilidadResumen(wmsiRep, wmsiEst) {
    const c = contarMotilidad();
    const elSeg = document.getElementById('seg-evaluados');
    if (!elSeg) return;

    const noEvalEst = 17 - c.evalEst;
    let txt = `Reposo ${c.evalRep}/17 · Estrés ${c.evalEst}/17`;
    let color = 'var(--color-success)';
    if (c.evalRep === 0 && c.evalEst === 0) { txt = '— (sin cargar)'; color = 'var(--color-text-secondary)'; }
    else if (noEvalEst > 2 || (17 - c.evalRep) > 2) {
        txt += ' — ⚠ >2 segmentos no visualizados: estudio subóptimo, considerar contraste';
        color = 'var(--color-warning)';
    } else if (c.sinPar > 0) {
        txt += ` — ⚠ ${c.sinPar} segmento(s) sin par reposo/estrés`;
        color = 'var(--color-warning)';
    } else {
        txt += ' — ✓ Estudio completo';
    }
    elSeg.textContent = txt;
    elSeg.style.color = color;

    document.getElementById('wmsi-rep-interp').textContent = interpWMSI(wmsiRep);
    document.getElementById('wmsi-est-interp').textContent = interpWMSI(wmsiEst);

    const elIsq = document.getElementById('seg-isquemicos');
    if (c.isquemicos === 0) {
        elIsq.textContent = c.evalEst > 0 ? '0 — sin isquemia inducible' : '—';
        elIsq.style.color = '';
    } else {
        const ext = c.isquemicos <= 2 ? 'leve' : c.isquemicos <= 4 ? 'moderada' : 'extensa';
        elIsq.textContent = `${c.isquemicos} segmento(s) — extensión ${ext}` +
            (c.viables ? ` · ${c.viables} con mejoría/viabilidad` : '') +
            (c.cicatriz ? ` · ${c.cicatriz} sin cambio (cicatriz)` : '');
        elIsq.style.color = 'var(--color-error)';
    }

    document.getElementById('territorios-sugeridos').textContent =
        c.territorios.length ? c.territorios.join(' + ') : '—';

    avisarWMSIConduccion();
    autocompletarPatron();
}

// Aviso de pantalla: con trastorno de conducción los segmentos septales inflan el WMSI
// sin que haya isquemia ni necrosis. No se escribe en el informe, es para el operador.
function avisarWMSIConduccion() {
    const aviso = document.getElementById('aviso-conduccion');
    if (!aviso) return;
    const sel = document.getElementById('ecg_conduccion');
    const conduccion = sel ? sel.value : 'ninguno';
    if (!conduccion || conduccion === 'ninguno') { aviso.style.display = 'none'; return; }

    const alterados = SEGMENTOS_SEPTALES.filter(id => WM.reposo[id] > 1 || WM.estres[id] > 1);
    if (!alterados.length) { aviso.style.display = 'none'; return; }

    const nombre = (CONDUCCION_PROSA[conduccion] || {}).trastorno || 'el trastorno de conducción';
    const crudoRep = calcWMSI('reposo'), crudoEst = calcWMSI('estres');
    const valRep = calcWMSI('reposo', SEGMENTOS_SEPTALES), valEst = calcWMSI('estres', SEGMENTOS_SEPTALES);
    const par = (a, b) => (a || '—') + ' → ' + (b || '—');
    aviso.style.display = 'block';
    aviso.innerHTML = `<strong>⚠ WMSI sobreestimado en la tabla.</strong> ${alterados.length} segmento(s) septal(es) ` +
        `(${alterados.join(', ')}) están alterados por ${nombre}, no por isquemia ni necrosis.<br>` +
        `Tabla, con septum: <strong>${par(crudoRep, crudoEst)}</strong> &nbsp;·&nbsp; ` +
        `Informe, sólo segmentos valorables: <strong>${par(valRep, valEst)}</strong><br>` +
        `En el informe los septales quedan excluidos del índice, no se describen como secuela y no se atribuyen a un territorio coronario.`;
}

// ── TABLA SEGMENTOS ───────────────────────────
// Clasificación de la respuesta de UN segmento entre reposo y pico.
// Devuelve { key, label } — 'key' se usa para contar isquemia/viabilidad.
// Score 0 = NO EVALUADO: nunca debe interpretarse como normal ni como cambio.
function classifyResponse(scoreRep, scoreEst) {
    if (scoreRep === 0 && scoreEst === 0) return { key: 'na',        label: '—' };
    if (scoreRep === 0 || scoreEst === 0)  return { key: 'parcial',  label: 'Sin par reposo/estrés' };
    if (scoreRep === 1 && scoreEst === 1)  return { key: 'normal',   label: 'Normal' };
    if (scoreRep === 1 && scoreEst > 1)    return { key: 'isquemia', label: 'Isquemia inducible' };
    if (scoreRep > 1 && scoreEst === 1)    return { key: 'viable',   label: 'Normalización (viabilidad)' };
    if (scoreRep > 1 && scoreEst < scoreRep) return { key: 'viable', label: 'Mejoría (viabilidad probable)' };
    if (scoreRep > 1 && scoreEst > scoreRep) return { key: 'isquemia_necrosis', label: 'Isquemia sobre necrosis' };
    return { key: 'cicatriz', label: 'Sin cambio (necrosis / cicatriz)' };
}

const RESP_CLASS = {
    na: '', parcial: 'response-partial', normal: 'response-normal',
    isquemia: 'response-ischemia', isquemia_necrosis: 'response-ischemia',
    viable: 'response-viability', cicatriz: 'response-scar'
};

function getResponse(scoreRep, scoreEst) {
    const r = classifyResponse(scoreRep, scoreEst);
    const short = { na: '—', parcial: '⚠ Sin par', normal: 'Normal', isquemia: 'Isquemia',
        isquemia_necrosis: 'Isq. s/ necrosis', viable: 'Viabilidad', cicatriz: 'Cicatriz' }[r.key];
    if (r.key === 'na') return '<span style="color:var(--color-text-secondary)">—</span>';
    return `<span class="${RESP_CLASS[r.key]}" title="${r.label}">${short}</span>`;
}

function makeBtns(segId, stateKey) {
    return SCORE_COLORS.map((color, i) =>
        `<button class="seg-score-btn ${WM[stateKey][segId] === i ? 'active' : ''}"
            style="background:${color}; color:${i >= 4 ? '#fff' : '#111'}"
            onclick="setScore(${segId},'${stateKey}',${i})" title="${SCORE_LABELS[i]}">${i}</button>`
    ).join('');
}

function buildSegmentsTable() {
    const tbody = document.getElementById('segments-tbody');
    tbody.innerHTML = '';
    // Siempre mostrar en orden 1-17 independientemente del orden visual del bull's eye
    const sorted = [...SEGMENTS].sort((a, b) => a.id - b.id);
    sorted.forEach(seg => {
        const badgeClass = seg.territory === 'DA' ? 'badge-da' : seg.territory === 'CD' ? 'badge-cd' : 'badge-cx';
        const tr = document.createElement('tr');
        tr.id = `seg-row-${seg.id}`;
        tr.innerHTML = `
            <td>${seg.id}</td>
            <td>${seg.name}</td>
            <td><span class="${badgeClass}">${seg.territory}</span></td>
            <td id="btns-rep-${seg.id}">${makeBtns(seg.id, 'reposo')}</td>
            <td id="btns-est-${seg.id}">${makeBtns(seg.id, 'estres')}</td>
            <td id="resp-${seg.id}">${getResponse(WM.reposo[seg.id], WM.estres[seg.id])}</td>
        `;
        tbody.appendChild(tr);
    });
}

function setScore(segId, stateKey, score) {
    WM[stateKey][segId] = score;
    updateSegTableRow(segId);
    updateWMSI();
    // Actualizar color en SVG correspondiente
    const svgId = stateKey === 'reposo' ? 'svg-reposo' : 'svg-estres';
    const path = document.querySelector(`#${svgId} path[data-id="${segId}"]`);
    if (path) path.setAttribute('fill', SCORE_COLORS[score]);
    scheduleSave();
}

function updateSegTableRow(segId) {
    const repCell = document.getElementById(`btns-rep-${segId}`);
    const estCell = document.getElementById(`btns-est-${segId}`);
    const respCell = document.getElementById(`resp-${segId}`);
    if (repCell) repCell.innerHTML = makeBtns(segId, 'reposo');
    if (estCell) estCell.innerHTML = makeBtns(segId, 'estres');
    if (respCell) respCell.innerHTML = getResponse(WM.reposo[segId], WM.estres[segId]);
}

// ── ESTRÉS DIASTÓLICO ─────────────────────────
function calcDiastolico() {
    // E/e' promedio si hay septal y lateral; si sólo hay uno, se usa ese.
    const eeDe = (fase) => {
        const E = num('e_onda_' + fase);
        const sep = num('e_prima_' + fase), lat = num('e_prima_lat_' + fase);
        const eprima = (sep > 0 && lat > 0) ? (sep + lat) / 2 : (sep > 0 ? sep : lat);
        if (!(E > 0) || !(eprima > 0)) return null;
        return { valor: E / eprima, promedio: sep > 0 && lat > 0, eprima };
    };
    const rep = eeDe('rep'), est = eeDe('est');

    const interp = (x) => x > 14 ? '↑ Elevado' : x > 8 ? 'Normal-alto' : '✓ Normal';
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

    document.getElementById('ee_reposo').value = rep ? rep.valor.toFixed(1) : '';
    document.getElementById('ee_estres').value = est ? est.valor.toFixed(1) : '';
    set('diast_rep_interp', rep ? `E/e' ${rep.valor.toFixed(1)}${rep.promedio ? ' (promedio)' : ' (septal)'} — ${interp(rep.valor)}` : '—');
    set('diast_est_interp', est ? `E/e' ${est.valor.toFixed(1)}${est.promedio ? ' (promedio)' : ' (septal)'} — ${interp(est.valor)}` : '—');

    // Respuesta de e' al esfuerzo: lo esperable es que suba
    if (rep && est) {
        const d = est.eprima - rep.eprima;
        set('diast_eprima_resp', `e' ${rep.eprima.toFixed(1)} → ${est.eprima.toFixed(1)} cm/s ` +
            (d > 0 ? `(+${d.toFixed(1)}) — ✓ incremento presente` : `(${d.toFixed(1)}) — ⚠ sin el incremento esperado`));
    } else set('diast_eprima_resp', '—');

    // Criterio ASE: E/e' promedio >14 con esfuerzo Y VRT >2,8 m/s
    const vrtEst = num('vrt_est');
    if (est) {
        const eeAlto = est.valor > 14;
        const vrtAlto = vrtEst > 2.8;
        let txt;
        if (eeAlto && vrtAlto) txt = '⚠ POSITIVO — E/e\' >14 y VRT >2,8 m/s con el esfuerzo';
        else if (eeAlto && !vrtEst) txt = 'E/e\' >14 con el esfuerzo; falta la VRT para completar el criterio';
        else if (eeAlto) txt = 'Indeterminado — E/e\' >14 pero VRT ≤2,8 m/s';
        else if (vrtAlto) txt = 'Indeterminado — VRT >2,8 m/s pero E/e\' ≤14';
        else txt = '✓ Negativo — sin aumento de las presiones de llenado con el esfuerzo';
        set('diast_respuesta', txt);
        autocompletarDiastolico(eeAlto && vrtAlto ? 'positivo' : (eeAlto || vrtAlto) ? 'no_evaluado' : 'negativo');
    } else {
        set('diast_respuesta', '—');
        autocompletarDiastolico('no_evaluado');
    }
}

// ── RESULTADO BANNER ──────────────────────────
function updateResultBanner() {
    const val = document.getElementById('resultado_estudio').value;
    const banner = document.getElementById('resultado-banner');
    if (!val) { banner.style.display = 'none'; return; }
    banner.style.display = 'block';
    banner.className = 'resultado-banner';
    const map = {
        'negativo':            { cls: 'resultado-negativo',      txt: '✓ NEGATIVO PARA ISQUEMIA INDUCIBLE' },
        'positivo':            { cls: 'resultado-positivo',      txt: '⚠ POSITIVO PARA ISQUEMIA INDUCIBLE' },
        'no_concluyente':      { cls: 'resultado-no-concluyente', txt: '— ESTUDIO NO CONCLUYENTE —' },
        'hta_respuesta':       { cls: 'resultado-no-concluyente', txt: 'RESPUESTA HIPERTENSIVA — Sin isquemia evidente' },
        'viabilidad_positiva': { cls: 'resultado-viabilidad',    txt: '✓ VIABILIDAD MIOCÁRDICA POSITIVA' },
        'viabilidad_negativa': { cls: 'resultado-no-concluyente', txt: 'VIABILIDAD NEGATIVA — Cicatriz transmural' },
        'diastolico_positivo': { cls: 'resultado-positivo',      txt: '⚠ DISFUNCIÓN DIASTÓLICA INDUCIBLE' }
    };
    const item = map[val] || { cls: '', txt: val };
    banner.classList.add(item.cls);
    banner.textContent = item.txt;
}

// ── MÓDULOS ESPECIALES ────────────────────────
function setSpecialTab(tab) {
    currentSpecialTab = tab;
    document.querySelectorAll('.special-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab.split('_')[0]) ||
            btn.onclick.toString().includes(tab));
    });
    document.querySelectorAll('.special-panel').forEach(p => p.style.display = 'none');
    document.getElementById('panel-' + tab).style.display = 'block';
    scheduleSave();
}

// CFR
function calcCFR() {
    const vBas = parseFloat(document.getElementById('cfr_vel_basal').value);
    const vEst = parseFloat(document.getElementById('cfr_vel_estres').value);
    if (vBas > 0 && vEst > 0) {
        const cfr = (vEst / vBas).toFixed(2);
        document.getElementById('cfr_resultado').value = cfr;
        let interp;
        if (parseFloat(cfr) >= 2.0) interp = '✓ Normal (≥2.0)';
        else if (parseFloat(cfr) >= 1.5) interp = '⚠ Limítrofe (1.5–1.99)';
        else interp = '✗ Reducida (<1.5) — Isquemia / Disfunción microvascular';
        document.getElementById('cfr_interp').value = interp;
    } else {
        document.getElementById('cfr_resultado').value = '';
        document.getElementById('cfr_interp').value = '';
    }
}

// Strain
function calcStrain() {
    const glsRep = parseFloat(document.getElementById('strain_gls_rep').value);
    const glsEst = parseFloat(document.getElementById('strain_gls_est').value);
    if (!isNaN(glsRep) && !isNaN(glsEst)) {
        const delta = Math.abs(glsEst) - Math.abs(glsRep);
        document.getElementById('strain_reserva').value = (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
        let interp;
        if (delta >= 2) interp = '✓ Reserva contráctil normal (ΔGLS ≥2%)';
        else if (delta >= 0) interp = '⚠ Reserva contráctil reducida (ΔGLS <2%)';
        else interp = '✗ Deterioro GLS con estrés (isquemia / disfunción subclínica)';
        document.getElementById('strain_interp').value = interp;
    }
}

// EAo
function calcEAo() {
    const gradRep = parseFloat(document.getElementById('eao_grad_reposo').value);
    const avaRep = parseFloat(document.getElementById('eao_ava_reposo').value);
    const gradDob = parseFloat(document.getElementById('eao_grad_dob').value);
    const avaDob = parseFloat(document.getElementById('eao_ava_dob').value);

    if (gradRep > 0 && gradDob > 0) {
        const dGrad = gradDob - gradRep;
        document.getElementById('eao_delta_grad').textContent = (dGrad >= 0 ? '+' : '') + dGrad.toFixed(0) + ' mmHg';
    }
    if (avaRep > 0 && avaDob > 0) {
        const dAva = avaDob - avaRep;
        document.getElementById('eao_delta_ava').textContent = (dAva >= 0 ? '+' : '') + dAva.toFixed(2) + ' cm²';

        // Interpretación
        let interp = '—';
        if (gradDob >= 40 && dAva < 0.3) {
            interp = 'EAo VERDADERA severa (↑ gradiente, AVA sin cambio)';
        } else if (gradDob < 40 && dAva >= 0.3) {
            interp = 'PSEUDOESTENOSIS (↑ AVA, gradiente no aumenta a ≥40 mmHg)';
        } else if (gradDob >= 40 && dAva >= 0.3) {
            interp = 'Indeterminado (ambos aumentan)';
        } else {
            interp = 'Sin reserva de flujo — pronóstico adverso';
        }
        document.getElementById('eao_interp').textContent = interp;
    }
}

// MCH
function calcMCH() {
    const gradRep = parseFloat(document.getElementById('mch_grad_reposo').value) || 0;
    const gradEst = parseFloat(document.getElementById('mch_grad_estres').value) || 0;
    if (gradRep > 0 && gradEst > 0) {
        const delta = gradEst - gradRep;
        document.getElementById('mch_delta_grad').value = (delta >= 0 ? '+' : '') + delta.toFixed(0) + ' mmHg';
        document.getElementById('mch_obs_latente').value =
            gradEst > 30 && gradRep <= 30 ? '✓ Obstrucción latente inducible' :
            gradEst > 30 && gradRep > 30 ? 'Obstrucción en reposo y estrés' :
            '— Sin obstrucción significativa';
    }
}

// ── CARGA RÁPIDA POR TERRITORIO ───────────────
function setTerritoryScore(stateKey, territory, score) {
    SEGMENTS.forEach(seg => {
        if (seg.territory === territory) WM[stateKey][seg.id] = score;
    });
    renderBullsEye('svg-' + stateKey, stateKey);
    buildSegmentsTable();
    updateWMSI();
    scheduleSave();
}

function setAllNormal(stateKey) {
    SEGMENTS.forEach(seg => { WM[stateKey][seg.id] = 1; });
    renderBullsEye('svg-' + stateKey, stateKey);
    buildSegmentsTable();
    updateWMSI();
    scheduleSave();
}

function resetAllScores() {
    SEGMENTS.forEach(seg => { WM.reposo[seg.id] = 0; WM.estres[seg.id] = 0; });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();
    scheduleSave();
}

// ── GENERADOR DE REPORTE ──────────────────────
function generarReporte() {
    // Fecha del estudio (editable); si está vacía se usa la de hoy
    const fEst = v('fecha_estudio');
    const hoy = fEst
        ? new Date(fEst + 'T12:00:00').toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' })
        : new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const id = v('paciente_id');
    const nombre = v('paciente_nombre');
    const edad = v('edad');
    const sexo = document.getElementById('sexo').value === 'M' ? 'Masculino' : 'Femenino';
    const peso = v('peso');
    const altura = v('altura');
    const sc = document.getElementById('sc_display').value;
    const ventana = textoSelect('ventana');
    const contraste = document.getElementById('contraste_usado').value !== 'no' ? 'Sí' : 'No';

    // Basal: cada protocolo tiene el suyo (el de ejercicio vive en el registro hemodinámico)
    const fcRep = currentProtocol === 'ejercicio' ? (num('esf_basal_fc') || '')
                : currentProtocol === 'dobutamina' ? v('dob_fc_reposo')
                : currentProtocol === 'dipiridamol' ? v('dip_fc_reposo') : '';
    const taRep = currentProtocol === 'ejercicio' ? taFila('basal')
                : currentProtocol === 'dobutamina' ? v('dob_ta_reposo')
                : currentProtocol === 'dipiridamol' ? v('dip_ta_reposo') : '';

    // Indicación
    const indEl = document.getElementById('indicacion');
    const indicacion = indEl.value ? textoSelect('indicacion') : '—';
    const indLibre = v('indicacion_libre');

    // Antecedentes
    const ants = [];
    ['hta','dm','tabaquismo','dislipemia','isquemia','iam','crm','fa','betabloq','epoc','mcd','valv'].forEach(k => {
        if (document.getElementById('ant_' + k).checked)
            ants.push(document.getElementById('ant_' + k).nextElementSibling.textContent);
    });

    // Protocolo
    let protoTxt = '';
    if (currentProtocol === 'ejercicio') {
        const tx = id => document.getElementById(id).textContent;
        const fila = (rot, f) => `${rot.padEnd(24)} TA ${(taFila(f) || '—').padEnd(10)} FC ${String(num('esf_' + f + '_fc') || '—').padEnd(6)} ` +
            `DP ${document.getElementById('esf_' + f + '_dp').textContent.padEnd(9)} ${v('esf_' + f + '_sint')}`.trimEnd();

        protoTxt = `PROTOCOLO: EJERCICIO EN CICLOERGÓMETRO — POST-ESFUERZO
Carga alcanzada: ${v('ej_carga') || '—'}  |  Duración: ${v('ej_duracion') || '—'}
Causa de detención: ${textoSelect('ej_causa_detencion')}

REGISTRO HEMODINÁMICO
${fila('Basal', 'basal')}
${fila('Máximo esfuerzo', 'max')}
${fila('Recuperación (1er min)', 'rec')}

FC Máxima Predicha: ${tx('fc_max_predicha')}  |  Objetivo 85%: ${tx('fc_85')}  |  Alcanzado: ${tx('pct_fc')}
Respuesta cronotrópica: ${tx('resp_cronotrop')}
Respuesta tensional: ${tx('resp_tensional')}
Doble producto máximo: ${tx('doble_producto')}
Recuperación de FC al 1er min: ${tx('hrr1')}
Capacidad funcional: ${tx('cap_funcional')}

ADQUISICIÓN POST-ESFUERZO
Primera imagen a los ${v('ej_seg_img') || '—'} segundos, con FC de ${v('ej_fc_img') || '—'} lpm (${tx('pct_fc_adq')})`;

    } else if (currentProtocol === 'dobutamina') {
        const dosisMax = v('dob_dosis_max');
        const fcPico = v('dob_fc_pico');
        const pct = document.getElementById('dob_pct_fc').textContent;
        const adec = document.getElementById('dob_adecuacion').textContent;
        const atrop = document.getElementById('dob_atropina').value;
        const taPico = v('dob_ta_pico');
        const motivoEl = document.getElementById('dob_motivo_fin');
        const motivo = textoSelect('dob_motivo_fin');
        protoTxt = `PROTOCOLO: DOBUTAMINA
Dosis Máxima: ${dosisMax} mcg/kg/min  |  Atropina: ${atrop === 'no' ? 'No' : atrop + ' mg'}
FC Reposo: ${fcRep || '—'} lpm  |  TA Reposo: ${taRep || '—'} mmHg
FC Pico: ${fcPico ? fcPico + ' lpm' : '—'}  |  % FC Máxima: ${pct}
Adecuación: ${adec}
TA Pico: ${taPico || '—'} mmHg
Motivo de terminación: ${motivo}`;

    } else if (currentProtocol === 'dipiridamol') {
        const protoDip = textoSelect('dip_protocolo');
        const dosisTxt = document.getElementById('dip_dosis_total').textContent;
        const aminoEl = document.getElementById('dip_aminofilina');
        const amino = aminoEl.value !== 'no' ? textoSelect('dip_aminofilina') : 'No utilizada';
        const motivoEl = document.getElementById('dip_motivo_fin');
        const motivo = textoSelect('dip_motivo_fin');
        protoTxt = `PROTOCOLO: DIPIRIDAMOL
Protocolo: ${protoDip}
Dosis Total Administrada: ${dosisTxt}
FC Reposo: ${fcRep || '—'} lpm  |  TA Reposo: ${taRep || '—'} mmHg
FC Pico: ${v('dip_fc_pico') || '—'} lpm  |  TA Pico: ${v('dip_ta_pico') || '—'} mmHg
Aminofilina: ${amino}
Motivo de terminación: ${motivo}`;

    } else {
        const ncEl = document.getElementById('nc_tipo');
        const tipo = textoSelect('nc_tipo');
        protoTxt = `PROTOCOLO: NO CONVENCIONAL
Tipo de apremio: ${tipo}
${v('nc_descripcion') ? 'Descripción: ' + v('nc_descripcion') : ''}`;
    }

    // FEy
    const feviRep = v('fevi_reposo');
    const feviPico = v('fevi_pico');
    const feviRecup = v('fevi_recup');
    const deltaFevi = document.getElementById('delta_fevi').value;

    // Wall motion — sólo segmentos alterados o con respuesta relevante
    let wmLines = '';
    const ordenados = [...SEGMENTS].sort((a, b) => a.id - b.id);
    ordenados.forEach(seg => {
        const scRep = WM.reposo[seg.id];
        const scEst = WM.estres[seg.id];
        if (scRep === 0 && scEst === 0) return;
        if (scRep === 1 && scEst === 1) return;   // normal en ambas: no se lista
        const resp = getResponseText(scRep, scEst);
        wmLines += `  ${String(seg.id).padStart(2)}. ${seg.name.padEnd(22)} [${seg.territory}]  ` +
            `Reposo: ${SCORE_LABELS[scRep].padEnd(10)} Pico: ${SCORE_LABELS[scEst].padEnd(10)} → ${resp}\n`;
    });
    const wmsiRep = calcWMSI('reposo') || '—';
    const wmsiEst = calcWMSI('estres') || '—';
    const conduccionPlanilla = document.getElementById('ecg_conduccion').value;
    const wmsiValorableTxt = (conduccionPlanilla && conduccionPlanilla !== 'ninguno')
        ? `\n  WMSI sobre segmentos valorables (sin septales): ${calcWMSI('reposo', SEGMENTOS_SEPTALES) || '—'} → ${calcWMSI('estres', SEGMENTOS_SEPTALES) || '—'}`
        : '';
    const cnt = contarMotilidad();
    const calidadTxt = (cnt.evalRep || cnt.evalEst)
        ? `Segmentos evaluados: reposo ${cnt.evalRep}/17, pico ${cnt.evalEst}/17` +
          ((17 - cnt.evalEst) > 2 || (17 - cnt.evalRep) > 2 ? ' — más de 2 segmentos no visualizados: valorar con cautela.' : '.')
        : 'Motilidad segmentaria no cargada.';
    const extensionTxt = cnt.isquemicos > 0
        ? `Isquemia inducible en ${cnt.isquemicos} ${cnt.isquemicos === 1 ? 'segmento' : 'segmentos'} — territorio ${cnt.territorios.join(' + ')}.`
        : (cnt.evalEst > 0 ? 'Sin isquemia inducible en los segmentos evaluados.' : '');

    // Motilidad en recuperación
    const recEl = document.getElementById('mot_recup');
    const recTxt = recEl.value
        ? `Recuperación: ${textoSelect('mot_recup')}` +
          (v('mot_recup_tiempo') ? ` (${v('mot_recup_tiempo')})` : '')
        : '';

    // ECG
    const ecgLineas = [
        `ECG reposo: ${textoSelect('ecg_ritmo')}` +
            (document.getElementById('ecg_conduccion').value !== 'ninguno' ? ` con ${textoSelect('ecg_conduccion')}` : '') +
            (document.getElementById('ecg_st_basal').value !== 'normal' ? `. ${textoSelect('ecg_st_basal')}` : '') +
            (v('ecg_otros_basal') ? `. ${v('ecg_otros_basal')}` : '')
    ];
    const ecgTipoEl = document.getElementById('ecg_st_tipo');
    if (ecgTipoEl.value) {
        ecgLineas.push(`Cambios del ST: ${textoSelect('ecg_st_tipo')}` +
            (v('ecg_st_mm') ? ` de ${v('ecg_st_mm')} mm` : '') +
            (v('ecg_st_deriv') ? ` en ${v('ecg_st_deriv')}` : ''));
    } else {
        ecgLineas.push('Sin cambios significativos del ST durante el estudio.');
    }
    if (v('ecg_st_aparicion')) ecgLineas.push(`Aparición: ${v('ecg_st_aparicion')}`);
    if (v('ecg_st_resolucion')) ecgLineas.push(`Resolución en recuperación: ${v('ecg_st_resolucion')}`);
    const arrMarcadas = ARRITMIAS.filter(a => document.getElementById(a.id).checked);
    if (v('ecg_arritmias')) ecgLineas.push(`Arritmias: ${v('ecg_arritmias')}`);
    else if (arrMarcadas.length) ecgLineas.push(`Arritmias: ${arrMarcadas.map(a => a.txt).join(', ')}`);

    // Diastólico
    const eeRep = document.getElementById('ee_reposo').value;
    const eeEst = document.getElementById('ee_estres').value;
    const diastResp = document.getElementById('diast_respuesta').textContent;

    // Resultado
    const resultEl = document.getElementById('resultado_estudio');
    const resultado = resultEl.value ? textoSelect('resultado_estudio') : '—';
    const territorioEl = document.getElementById('territorio_afectado');
    const territorio = textoSelect('territorio_afectado');
    const extensionEl = document.getElementById('extension_isquemia');
    const extension = extensionEl.value ? textoSelect('extension_isquemia') : '—';

    // Hallazgos
    const hals = [];
    const halMap = {
        'hal_angina':'Angina durante el estudio',
        'hal_disnea':'Disnea de esfuerzo',
        'hal_st_dep':'Descenso del ST en ECG',
        'hal_st_ele':'Elevación del ST en ECG',
        'hal_arritmia':'Arritmia significativa',
        'hal_hipotension':'Respuesta hipotensora',
        'hal_hipertensiva':'Respuesta hipertensiva',
        'hal_extrasistoles':'Extrasístoles ventriculares frecuentes'
    };
    Object.entries(halMap).forEach(([id, lbl]) => {
        if (document.getElementById(id).checked) hals.push(lbl);
    });

    const conclusion = v('conclusion_libre');

    // Armar reporte
    const sep = '─'.repeat(64);
    let rep = `ECOCARDIOGRAMA DE ESTRÉS
${sep}

DATOS DEL PACIENTE
${nombre ? 'Paciente: ' + nombre + '\n' : ''}ID / HC: ${id || '—'}  |  Sexo: ${sexo}  |  Edad: ${edad || '—'} años
Peso: ${peso || '—'} kg  |  Altura: ${altura || '—'} cm  |  SC: ${sc || '—'}

INDICACIÓN
${indicacion}${indLibre ? '\n' + indLibre : ''}

ANTECEDENTES CLÍNICOS
${ants.length > 0 ? ants.join(', ') : 'Sin antecedentes registrados'}
${medicacionEnTexto() ? 'Medicación habitual: ' + medicacionEnTexto() : ''}
${v('resumen_hc') ? '\nRESUMEN DE HISTORIA CLÍNICA\n' + v('resumen_hc') : ''}

CALIDAD TÉCNICA
Ventana Acústica: ${ventana}  |  Contraste: ${contraste}

${protoTxt}

FUNCIÓN VENTRICULAR IZQUIERDA
FEy en Reposo: ${feviRep ? feviRep + '%' : '—'}  |  FEy Pico: ${feviPico ? feviPico + '%' : '—'}  |  FEy Recuperación: ${feviRecup ? feviRecup + '%' : '—'}
${deltaFevi ? 'Variación FEy: ' + deltaFevi : ''}

ECG DURANTE EL ESTRÉS
${ecgLineas.join('\n')}

MOTILIDAD PARIETAL SEGMENTARIA — MODELO AHA 17 SEGMENTOS
${sep}
${wmLines || '  Motilidad normal en todos los segmentos evaluados, en reposo y en el pico.\n'}
${sep}
  WMSI Reposo: ${wmsiRep}   |   WMSI Pico Estrés: ${wmsiEst}${wmsiValorableTxt}
  ${calidadTxt}
${extensionTxt ? '  ' + extensionTxt + '\n' : ''}${recTxt ? '  ' + recTxt + '\n' : ''}
${eeRep || eeEst ? `ESTRÉS DIASTÓLICO
E/e' Reposo: ${eeRep || '—'}   |   E/e' Estrés: ${eeEst || '—'}
Respuesta: ${diastResp}\n` : ''}
RESULTADO DEL ESTUDIO
${sep}
${resultado.toUpperCase()}
Territorio: ${territorio}${extension && extension !== '—' ? '\nExtensión de isquemia: ' + extension : ''}
${hals.length > 0 ? '\nHallazgos asociados:\n' + hals.map(h => '  • ' + h).join('\n') : ''}

${conclusion ? 'CONCLUSIÓN\n' + conclusion : ''}

${sep}
Fecha de realización: ${hoy}
Eco Estrés Cardíaco v1.1 — Calculadora Clínica
`;

    // Limpieza tipográfica: sin espacios colgando ni bloques de líneas vacías
    rep = rep.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');

    validarEstudio();

    const out = document.getElementById('reporte-output');
    out.style.display = 'block';
    out.textContent = rep;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══════════════════════════════════════════════
//  MOTOR NARRATIVO
//  Tres capas: recolectar hechos → elegir rama → rellenar plantillas.
//  El texto vive en report-templates.js; acá no se redacta nada.
// ══════════════════════════════════════════════

// Arritmias: cuáles tienen peso pronóstico propio y llegan a la conclusión.
// El criterio es morfología y patrón, no síntoma: unas EV polimorfas con bigeminia
// pesan aunque el paciente no haya sentido nada.
const ARRITMIAS = [
    { id: 'arr_esv',       txt: 'extrasístoles supraventriculares aisladas', relevante: false },
    { id: 'arr_ev_mono',   txt: 'extrasístoles ventriculares monomorfas aisladas', relevante: false },
    { id: 'arr_ev_poli',   txt: 'extrasístoles ventriculares polimorfas', relevante: true },
    { id: 'arr_bigeminia', txt: 'bigeminia ventricular', relevante: true },
    { id: 'arr_dupletas',  txt: 'dupletas ventriculares', relevante: true },
    { id: 'arr_tvns',      txt: 'taquicardia ventricular no sostenida', relevante: true },
    { id: 'arr_fa_tsv',    txt: 'fibrilación auricular o taquicardia supraventricular inducida', relevante: true },
    { id: 'arr_aumenta',   txt: 'aumento de la ectopia ventricular con la carga', relevante: true }
];

// Sólo estos trastornos comprometen la valoración septal; el resto sólo se describe.
const CONDUCCION_LIMITA_SEPTUM = ['bcri', 'marcapasos', 'preexcitacion'];

// Segmentos septales afectados por la activación eléctrica anómala.
// El apical septal (14) queda FUERA a propósito: la asincronía del BCRI es
// sobre todo basal y media, y excluirlo perdería isquemia apical de la DA.
const SEGMENTOS_SEPTALES = [2, 3, 8, 9];

// ── Capa 1: recolector de hechos ──────────────
// Devuelve un objeto plano, sin una sola palabra de informe.
function recolectarHallazgos() {
    const H = {};
    const edad = parseInt(v('edad')) || 0;

    H.edad = edad;
    H.sexo = document.getElementById('sexo').value;
    H.carga = v('ej_carga');
    H.duracion = v('ej_duracion');
    H.causaDetencion = document.getElementById('ej_causa_detencion').value;
    H.causaDetencionTxt = CAUSA_PROSA[H.causaDetencion] || textoSelect('ej_causa_detencion').toLowerCase();
    H.ventana = document.getElementById('ventana').value;
    H.ventanaTxt = textoSelect('ventana').toLowerCase();
    H.betabloqueante = document.getElementById('ant_betabloq').checked;

    // Hemodinamia
    H.fcBasal = num('esf_basal_fc');
    H.fcPico  = num('esf_max_fc');
    H.fcRec   = num('esf_rec_fc');
    H.tasBasal = num('esf_basal_tas');
    H.tadBasal = num('esf_basal_tad');
    H.tasPico  = num('esf_max_tas');
    // 140/90 ya es hipertensión: el dato es del paciente, no sólo de la prueba
    H.basalElevada = H.tasBasal >= 140 || H.tadBasal >= 90;
    H.taBasal = taFila('basal');
    H.taPico  = taFila('max');
    H.dobleProducto = (H.fcPico > 0 && H.tasPico > 0) ? H.fcPico * H.tasPico : 0;
    H.fcMaxPredicha = edad > 0 ? 220 - edad : 0;
    H.pctFCmax = (H.fcMaxPredicha > 0 && H.fcPico > 0) ? Math.round(H.fcPico / H.fcMaxPredicha * 100) : 0;
    H.fcSuboptima = H.pctFCmax > 0 && H.pctFCmax < 85;
    H.hrr1 = (H.fcPico > 0 && H.fcRec > 0) ? H.fcPico - H.fcRec : null;

    const deltaTAS = (H.tasBasal > 0 && H.tasPico > 0) ? H.tasPico - H.tasBasal : null;
    H.hipotension  = deltaTAS !== null && deltaTAS <= -10;
    H.hipertension = H.tasPico >= 210 && !H.hipotension;

    // Adquisición post-esfuerzo
    H.segImagen = num('ej_seg_img');
    H.fcImagen  = num('ej_fc_img');
    H.pctFCadq  = (H.fcPico > 0 && H.fcImagen > 0) ? Math.round(H.fcImagen / H.fcPico * 100) : 0;
    H.adquisicionTardia = H.pctFCadq > 0 && H.pctFCadq < 85;

    // Capacidad funcional
    H.mets = num('ej_mets');
    H.capacidadFuncional = categoriaMETs(H.mets);
    const metsPred = metsPredichos(edad, H.sexo);
    H.pctMets = (H.mets > 0 && metsPred) ? Math.round((H.mets / metsPred) * 100) : null;

    // Función ventricular
    H.feyReposo = num('fevi_reposo');
    H.feyEstres = num('fevi_pico');
    H.caidaFey = H.feyReposo > 0 && H.feyEstres > 0 && H.feyEstres < H.feyReposo;

    // Diastólico
    H.eeReposo = v('ee_reposo');
    H.eeEstres = v('ee_estres');
    H.vrtReposo = v('vrt_rep');
    H.vrtEstres = v('vrt_est');
    const eeEstNum = parseFloat(H.eeEstres) || 0;
    H.diastolicoPositivo = eeEstNum > 14 && num('vrt_est') > 2.8;

    // ECG
    H.stTipo = document.getElementById('ecg_st_tipo').value;
    H.stMm = v('ecg_st_mm');
    H.stDeriv = v('ecg_st_deriv');
    H.stAparicion = v('ecg_st_aparicion');
    H.stResolucion = v('ecg_st_resolucion');
    H.stMorfologia = document.getElementById('ecg_st_morfologia').value;
    H.stMorfologiaTxt = H.stMorfologia ? textoSelect('ecg_st_morfologia').toLowerCase() : '';

    // El infradesnivel ascendente rápido es respuesta fisiológica al esfuerzo:
    // describirlo como isquémico inventaría una discordancia que no existe.
    const mm = parseFloat(H.stMm) || 0;
    H.stIsquemico = H.stTipo === 'supra' ||
        (H.stTipo === 'infra' && H.stMorfologia !== 'ascendente_rapido' && mm >= 1);

    // Trastorno de conducción
    H.conduccion = document.getElementById('ecg_conduccion').value;
    // BCRD y hemibloqueos se informan, pero no generan movimiento septal paradójico:
    // no disparan el modificador ni excluyen segmentos del WMSI.
    H.hayConduccion = CONDUCCION_LIMITA_SEPTUM.includes(H.conduccion);
    H.conduccionProsa = H.hayConduccion ? CONDUCCION_PROSA[H.conduccion] : null;

    // ECG en reposo
    H.ritmo = document.getElementById('ecg_ritmo').value;
    H.ritmoTxt = textoSelect('ecg_ritmo');
    H.conduccionTxt = H.conduccion === 'ninguno' ? '' : (CONDUCCION_SIGLA[H.conduccion] || textoSelect('ecg_conduccion'));
    H.stBasal = document.getElementById('ecg_st_basal').value;
    H.stBasalTxt = textoSelect('ecg_st_basal');
    H.otrosBasal = v('ecg_otros_basal');

    // Arritmias
    H.arritmias = ARRITMIAS.filter(a => document.getElementById(a.id).checked);
    H.arritmiasRelevantes = H.arritmias.filter(a => a.relevante);
    H.arrMomento = document.getElementById('arr_momento').value;
    H.arrMomentoTxt = textoSelect('arr_momento').toLowerCase();
    H.arrSintomatica = document.getElementById('arr_sintomas').value === 'sintomatica';
    H.arrLibre = normalizarTexto(v('ecg_arritmias'));
    // Una arritmia sintomática pesa aunque su morfología sea benigna
    H.hayArritmiaRelevante = H.arritmiasRelevantes.length > 0 || (H.arritmias.length > 0 && H.arrSintomatica);

    // Esfuerzo: protocolo, carga y etapa
    H.protocolo = document.getElementById('ej_protocolo').value;
    H.protocoloTxt = textoSelect('ej_protocolo');
    H.cargaKgm = num('ej_carga');
    H.etapa = num('ej_etapa');

    // Estudio diastólico (lo que va al informe)
    H.diastResultado = document.getElementById('diast_resultado').value;

    // Patrón de la alteración y ventrículo derecho
    H.patronGlobal = document.getElementById('patron_motilidad').value === 'global';
    H.vd = document.getElementById('vd_funcion').value;
    H.vdProsa = VD_PROSA[H.vd] || '';

    // Texto libre del bloque de reposo: reemplaza la REDACCIÓN, no los datos
    H.reposoLibre = normalizarTexto(v('reposo_libre'));

    // Reserva contráctil GLOBAL: ΔFEy ≥5 puntos. Es independiente de la regional.
    H.deltaFey = (H.feyReposo > 0 && H.feyEstres > 0) ? H.feyEstres - H.feyReposo : null;
    H.reservaGlobal = H.deltaFey !== null && H.deltaFey >= 5;

    // Estímulo insuficiente: el DP es la carga real sobre el miocardio.
    H.estimuloInsuficiente = H.dobleProducto > 0 && H.dobleProducto < 20000;
    H.dpEnElBorde = H.dobleProducto >= 18000 && H.dobleProducto < 20000;


    // Síntomas del máximo esfuerzo
    H.sintomasEsfuerzo = v('esf_max_sint');

    // ── Motilidad ──
    // Con trastorno de conducción los segmentos septales se apartan ANTES de clasificar:
    // su alteración es eléctrica, no isquémica ni necrótica. Al quedar fuera de `secuelas`
    // e `isquemicos`, la rama de secuela se vuelve inalcanzable por construcción y no se
    // les atribuye ningún territorio coronario.
    const isquemicos = [], secuelas = [], septales = [];
    SEGMENTS.forEach(s => {
        const r = WM.reposo[s.id], e = WM.estres[s.id];
        const c = classifyResponse(r, e);
        if (H.hayConduccion && SEGMENTOS_SEPTALES.includes(s.id)) {
            if (r > 1 || e > 1) septales.push({ ...s, scoreReposo: r, scoreEstres: e });
            return;
        }
        if (c.key === 'isquemia' || c.key === 'isquemia_necrosis') isquemicos.push({ ...s, scoreEstres: e });
        if (c.key === 'cicatriz') secuelas.push({ ...s, scoreReposo: r });
    });
    isquemicos.sort((a, b) => a.id - b.id);
    secuelas.sort((a, b) => a.id - b.id);
    septales.sort((a, b) => a.id - b.id);
    H.septalesConduccion = septales;

    H.isquemicos = isquemicos;
    H.secuelas = secuelas;
    H.territoriosIsquemia = territoriosDe(isquemicos);
    H.territoriosSecuela = territoriosDe(secuelas);

    const cnt = contarMotilidad();
    H.segEvaluados = Math.min(cnt.evalRep, cnt.evalEst);
    // Con trastorno de conducción el septum no es valorable, esté normal o alterado:
    // queda fuera del índice y así se aclara en el informe.
    const excluirDelWMSI = H.hayConduccion ? SEGMENTOS_SEPTALES : null;
    H.wmsiReposo = calcWMSI('reposo', excluirDelWMSI);
    H.wmsiEstres = calcWMSI('estres', excluirDelWMSI);
    H.wmsiExcluyeSeptales = H.hayConduccion;
    // Se calcula acá y no antes: depende de los dos WMSI recién asignados
    H.deltaWMSI = (H.wmsiReposo !== null && H.wmsiEstres !== null)
        ? (parseFloat(H.wmsiEstres) - parseFloat(H.wmsiReposo)) : null;
    H.wmsiSubio = H.wmsiReposo !== null && H.wmsiEstres !== null &&
                  parseFloat(H.wmsiEstres) > parseFloat(H.wmsiReposo);

    H.categorizacion = document.getElementById('categorizacion').value
        ? textoSelect('categorizacion').toLowerCase() : '';

    return H;
}

function gradoFeyEnProsa(fey) {
    if (!(fey > 0)) return 'no evaluada';
    return (FEY_PROSA.find(g => fey <= g.max) || { txt: 'conservada' }).txt;
}

// El ápex (17) tiene irrigación variable: sólo se le asigna vaso si viene
// acompañado de otros segmentos del mismo territorio.
function territoriosDe(segs) {
    const t = new Set();
    segs.forEach(s => { if (s.id !== 17) t.add(s.territory); });
    if (!t.size && segs.some(s => s.id === 17)) return [];   // ápex aislado: sin vaso
    return [...t];
}

// ── Capa 2: selector de rama ──────────────────
function elegirRama(H) {
    if (H.ventana === 'limitada') return 'noConcluyente';
    // Estímulo insuficiente: por debajo de ese DP no se puede descartar isquemia.
    // No aplica si el estudio YA dio resultado, por imagen o por ECG.
    if (H.estimuloInsuficiente && !H.isquemicos.length && !H.stIsquemico) return 'noConcluyente';
    if (H.isquemicos.length && H.hipotension) return 'hipotensiva';
    if (H.isquemicos.length) return H.territoriosIsquemia.length > 1 ? 'positivaMulti' : 'positivaUnico';
    // Hipoquinesia global: no es secuela segmentaria y no tiene territorio coronario
    if (H.patronGlobal) return 'dilatada';
    if (H.secuelas.length) return 'secuela';
    // ECG positivo con eco negativo. Requiere que el ST sea valorable: con BCRI,
    // marcapasos o preexcitación ya declaramos ilegible el ST y no hay discordancia.
    if (H.stIsquemico && !H.hayConduccion) return 'discordancia';
    if (H.diastolicoPositivo) return 'diastolico';
    return 'negativa';
}

// Cómo se nombra el hallazgo eléctrico dentro de la conclusión
function descripcionSTEnProsa(H) {
    if (!H.stIsquemico) return '';
    const tipo = H.stTipo === 'supra' ? 'supradesnivel del ST' : 'infradesnivel del ST';
    return tipo + (H.stMm ? ` de ${H.stMm} mm` : '') +
        (H.stMorfologiaTxt ? `, ${H.stMorfologiaTxt}` : '') +
        (H.stDeriv ? ` en ${H.stDeriv}` : '');
}

// ── Utilidades de prosa ───────────────────────
function listarEnProsa(items) {
    if (!items.length) return '';
    if (items.length === 1) return items[0];
    return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}

function segmentosEnProsa(segs) {
    return listarEnProsa(segs.map(s => SEG_PROSA[s.id] || s.name.toLowerCase()));
}

function territoriosEnProsa(terrs) {
    return listarEnProsa(terrs.map(t => TERRITORIO_PROSA[t] || t));
}

// "de los segmentos X, Y" / "del segmento X", según cuántos sean
function deSegmentos(segs) {
    if (!segs.length) return '';
    return (segs.length === 1 ? 'del segmento ' : 'de los segmentos ') + segmentosEnProsa(segs);
}

// "el territorio de la arteria X" cuando hay vaso; "la región apical" cuando no
function territorioFrase(terrs) {
    return terrs.length ? 'territorio de ' + territoriosEnProsa(terrs) : 'la región apical';
}

// Grado predominante (el peor) de un conjunto de segmentos
function gradoEnProsa(segs, campo) {
    if (!segs.length) return 'alteración de la motilidad';
    const peor = Math.max(...segs.map(s => s[campo] || 0));
    return GRADO_PROSA[peor] || 'alteración de la motilidad';
}

// Frase de acompañamiento: cambios del ST y/o síntomas.
// Si no hubo nada, se dice explícitamente: en un positivo por imagen, que el ECG
// haya sido mudo es información clínica y no debe quedar omitida.
function acompanamientoEnProsa(H) {
    const T = NARRATIVA;
    // El ST y las arritmias ya tienen sus propias líneas de ECG: acá van sólo los síntomas.
    if (!H.sintomasEsfuerzo) return T.acompanamientoSinHallazgos;
    return rellenar(T.acompanamiento, { lista: H.sintomasEsfuerzo.toLowerCase() });
}

// Frase de arritmias: si hay descripción libre, manda esa; si no, se arma de los campos.
function arritmiasEnProsa(H) {
    if (H.arrLibre) return H.arrLibre;
    if (!H.arritmias.length) return '';
    const lista = listarEnProsa(H.arritmias.map(a => a.txt));
    const momento = H.arrMomentoTxt && H.arrMomentoTxt !== '—' ? ' ' + H.arrMomentoTxt : '';
    const sintomas = H.arrSintomatica ? ', con síntomas asociados' : ', sin síntomas asociados';
    return lista.charAt(0).toUpperCase() + lista.slice(1) + momento + sintomas + '.';
}

// Línea "ECG reposo:" — ritmo, conducción, ST basal y otros hallazgos
function ecgReposoEnProsa(H) {
    const partes = [];
    let ritmo = H.ritmoTxt;
    if (H.conduccionTxt) ritmo += ' con ' + H.conduccionTxt;
    partes.push(ritmo + '.');
    if (H.stBasal && H.stBasal !== 'normal') partes.push(H.stBasalTxt + '.');
    if (H.otrosBasal) partes.push(H.otrosBasal.replace(/\.*$/, '') + '.');
    return partes.join(' ');
}

// Línea "ECG post-esfuerzo:" — cambios del ST y arritmias
function ecgEsfuerzoEnProsa(H) {
    const partes = [];
    if (H.stTipo) {
        const tipo = H.stTipo === 'supra' ? 'Supradesnivel del ST' : 'Infradesnivel del ST';
        partes.push(tipo + (H.stMm ? ` de ${H.stMm} mm` : '') + (H.stDeriv ? ` en ${H.stDeriv}` : '') +
            (H.stAparicion ? `, desde ${H.stAparicion}` : '') +
            (H.stResolucion ? `, con resolución en ${H.stResolucion}` : '') + '.');
    } else if (H.hayConduccion) {
        partes.push('Análisis del ST no valorable por el trastorno de conducción.');
    } else {
        partes.push('Sin cambios del ST-T.');
    }
    const arr = arritmiasEnProsa(H);
    partes.push(arr || 'Sin arritmias.');
    return partes.join(' ');
}

// Los textos libres vienen de otra app o de un teclado con la tilde invertida.
// Se normalizan al generar, sin tocar lo que quedó escrito en pantalla.
const TILDES_INVERTIDAS = { 'à':'á', 'è':'é', 'ì':'í', 'ò':'ó', 'ù':'ú',
                            'À':'Á', 'È':'É', 'Ì':'Í', 'Ò':'Ó', 'Ù':'Ú' };

function normalizarTexto(t) {
    if (!t) return t;
    return t
        .replace(/[àèìòùÀÈÌÒÙ]/g, c => TILDES_INVERTIDAS[c] || c)
        .replace(/bigemine[ao]/gi, m => m[0] === 'B' ? 'Bigeminia' : 'bigeminia')
        .replace(/trigemine[ao]/gi, m => m[0] === 'T' ? 'Trigeminia' : 'trigeminia')
        // Letras faltantes frecuentes al tipear rápido
        .replace(/asintm(á|a)tic/gi, m => (m[0] === 'A' ? 'A' : 'a') + 'sintomátic')
        .replace(/sintom(á|a)tica?mente/gi, m => (m[0] === 'S' ? 'S' : 's') + 'intomáticamente');
}

// Rellena {{marcadores}} y borra los que quedaron vacíos
function rellenar(plantilla, datos) {
    return plantilla.replace(/\{\{(\w+)\}\}/g, (_, k) => (datos[k] !== undefined && datos[k] !== null) ? String(datos[k]) : '');
}

// ── Capa 3: armado del informe ────────────────
function construirNarrativa(H) {
    const T = NARRATIVA;
    const rama = elegirRama(H);
    const nada = '—';
    const parrafos = [];

    // ── MÉTODO ──
    const datosMetodo = {
        protocolo: H.protocolo && H.protocolo !== 'otro' ? ' con protocolo de ' + H.protocoloTxt : '',
        carga: H.cargaKgm || nada,
        etapaMetodo: H.etapa ? `, en etapa ${H.etapa}` : '',
        fcPico: H.fcPico || nada,
        pctFCmax: H.pctFCmax || nada,
        dobleProducto: H.dobleProducto ? H.dobleProducto.toLocaleString('es-AR') : nada,
        metsMetodo: H.mets ? `, con ${H.mets} METs${H.pctMets ? ` (${H.pctMets} % del predicho para edad y sexo)` : ''}` : '',
        causaDetencion: H.causaDetencionTxt
    };
    const metodo = [rellenar(H.cargaKgm ? T.metodo : T.metodoSinCarga, datosMetodo)];

    if (H.hipotension) {
        metodo.push(rellenar(T.respuestaHipotensiva, { taBasal: H.taBasal || nada, taPico: H.taPico || nada }));
    } else if (H.hipertension) {
        metodo.push(rellenar(H.basalElevada ? T.respuestaHipertensivaBasalAlta : T.respuestaHipertensiva,
            { taPico: H.taPico || nada, taBasal: H.taBasal || nada }));
    } else if (H.fcSuboptima) {
        metodo.push(rellenar(T.respuestaFCSubóptima, {
            fcPico: H.fcPico || nada, pctFCmax: H.pctFCmax || nada,
            betabloqueante: H.betabloqueante ? ' (bajo tratamiento betabloqueante)' : ''
        }));
    } else if (H.pctFCmax >= 85) {
        metodo.push(T.respuestaNormal);
    }
    parrafos.push(metodo.join(' '));

    // ── CALIDAD ──
    const datosCalidad = {
        ventana: H.ventanaTxt,
        segImagen: H.segImagen || nada,
        fcImagen: H.fcImagen || nada,
        pctFCadq: H.pctFCadq || nada,
        segEvaluados: H.segEvaluados,
        coletillaAdq: H.pctFCadq ? (H.adquisicionTardia ? T.coletillaAdqTardia : T.coletillaAdqUtil) : ''
    };
    const hayAdquisicion = H.segImagen > 0 || H.fcImagen > 0;
    let plantillaCalidad;
    if (H.ventana === 'limitada') {
        if (H.fcImagen > 0) plantillaCalidad = T.calidadLimitada;
        else plantillaCalidad = H.segEvaluados >= 17 ? T.calidadLimitadaSinConteo : T.calidadLimitadaSola;
    } else if (H.fcImagen > 0) {
        plantillaCalidad = T.calidad;
    } else {
        plantillaCalidad = hayAdquisicion ? T.calidadSoloSegundos : T.calidadSola;
    }
    parrafos.push(rellenar(plantillaCalidad, datosCalidad));

    // ── Datos del trastorno de conducción, comunes a los tres bloques ──
    const cond = H.conduccionProsa || {};
    const datosConduccion = {
        trastorno: cond.trastorno || '',
        alTrastorno: cond.alTrastorno || '',
        hallazgoSeptal: cond.hallazgoSeptal || '',
        segmentosSeptales: segmentosEnProsa(H.septalesConduccion || [])
    };
    const hayAsincronia = H.hayConduccion && (H.septalesConduccion || []).length > 0;

    // ── REPOSO ──
    const datosReposo = {
        fey: H.feyReposo || nada,
        ee: H.eeReposo || nada,
        vrt: H.vrtReposo || nada,
        gradoSecuela: gradoEnProsa(H.secuelas, 'scoreReposo'),
        segmentosSecuela: segmentosEnProsa(H.secuelas),
        deSegmentosSecuela: deSegmentos(H.secuelas),
        segmentosSecuelaArt: H.secuelas.length === 1 ? 'El segmento' : 'Los segmentos',
        territorioSecuela: territoriosEnProsa(H.territoriosSecuela),
        territorioSecuelaFrase: territorioFrase(H.territoriosSecuela),
        gradoFey: gradoFeyEnProsa(H.feyReposo),
        vd: H.vdProsa ? ', ' + H.vdProsa : ''
    };
    let plantillaReposo;
    if (rama === 'dilatada') plantillaReposo = T.reposoDilatada;
    else if (H.secuelas.length) plantillaReposo = T.reposoSecuela;
    else if (hayAsincronia) plantillaReposo = T.reposoConduccion;
    else if (rama === 'diastolico') plantillaReposo = T.reposoDiastolico;
    else if (rama === 'negativa') plantillaReposo = T.reposoNormalLargo;
    else plantillaReposo = T.reposoNormalCorto;

    let parrafoReposo;
    if (H.reposoLibre) {
        // El texto libre gobierna la redacción del bloque de reposo. Los datos cargados
        // siguen alimentando la lógica: rama, WMSI, territorios y modificadores no cambian.
        parrafoReposo = H.reposoLibre;
    } else {
        parrafoReposo = rellenar(plantillaReposo, { ...datosReposo, ...datosConduccion });
        // Secuela real en un territorio + asincronía septal por conducción: van las dos cosas
        if (H.secuelas.length && hayAsincronia) {
            parrafoReposo += ' ' + rellenar(T.asincroniaSeptalSuelta, datosConduccion);
        }
    }
    parrafos.push(parrafoReposo);

    // ── ESFUERZO ──
    const acompanamiento = acompanamientoEnProsa(H);
    const datosEsfuerzo = {
        grado: gradoEnProsa(H.isquemicos, 'scoreEstres'),
        segmentos: segmentosEnProsa(H.isquemicos),
        deSegmentos: deSegmentos(H.isquemicos),
        territorio: territoriosEnProsa(H.territoriosIsquemia),
        territorioFrase: territorioFrase(H.territoriosIsquemia),
        territorios: territoriosEnProsa(H.territoriosIsquemia),
        wmsiReposo: H.wmsiReposo || nada,
        wmsiEstres: H.wmsiEstres || nada,
        aclaracionWMSI: H.wmsiExcluyeSeptales ? NARRATIVA.aclaracionWMSI : '',
        acompanamiento: acompanamiento,
        caidaFey: H.caidaFey ? `, con caída de la FEy de ${H.feyReposo} % a ${H.feyEstres} % post-esfuerzo` : '',
        hallazgos: H.isquemicos.length
            ? `nuevas alteraciones de la motilidad en los segmentos ${segmentosEnProsa(H.isquemicos)}`
            : 'los hallazgos descritos',
        feyReposo: H.feyReposo || nada,
        feyEstres: H.feyEstres || nada,
        eeEstres: H.eeEstres || nada,
        vrtEstres: H.vrtEstres || nada,
        reservaGlobal: H.deltaFey === null ? '' : rellenar(
            H.reservaGlobal ? T.reservaGlobalConservada : T.reservaGlobalAusente,
            { feyReposo: H.feyReposo, feyEstres: H.feyEstres,
              deltaFey: H.reservaGlobal ? H.deltaFey : (H.deltaFey >= 0 ? '+' + H.deltaFey : H.deltaFey) })
    };
    const plantillaEsfuerzo = {
        discordancia:  T.esfuerzoDiscordancia,
        dilatada:      T.esfuerzoDilatada,
        noConcluyente: T.esfuerzoNoConcluyente,
        hipotensiva:   T.esfuerzoHipotensiva,
        positivaMulti: T.esfuerzoPositivoMulti,
        positivaUnico: T.esfuerzoPositivoUnico,
        secuela:       T.esfuerzoSecuela,
        diastolico:    T.esfuerzoDiastolico,
        negativa:      hayAsincronia ? T.esfuerzoConduccion
                     : H.hipertension ? T.esfuerzoHipertensiva
                     : H.fcSuboptima ? T.esfuerzoFCSuboptima
                     : T.esfuerzoNegativo
    }[rama];
    let parrafoEsfuerzo = rellenar(plantillaEsfuerzo, datosEsfuerzo);

    // En las ramas que no son la negativa, la limitación septal se suma al párrafo
    if (hayAsincronia && rama !== 'negativa') {
        parrafoEsfuerzo += ' ' + T.limitacionSeptalEsfuerzo;
    }

    // Secuela previa + isquemia nueva en otro territorio: se suma el párrafo de secuela
    if (H.secuelas.length && H.isquemicos.length) {
        parrafoEsfuerzo += ' ' + rellenar(T.parrafoSecuelaAgregado, datosReposo);
    }
    parrafos.push(parrafoEsfuerzo);

    // ── LÍNEA CUANTITATIVA DE MOTILIDAD ──
    // Aparece siempre que haya segmentos comprometidos: en secuela y dilatada el
    // Δ cero ES el hallazgo (ausencia de respuesta), no una ausencia de dato.
    const comprometidos = H.isquemicos.length + H.secuelas.length;
    if (comprometidos > 0 && H.wmsiReposo !== null && H.wmsiEstres !== null) {
        const d = H.deltaWMSI;
        const dTxt = d > 0 ? '+' + d.toFixed(2) : d.toFixed(2);
        const detalle = [];
        if (H.isquemicos.length) detalle.push(`${H.isquemicos.length} con isquemia inducible`);
        if (H.secuelas.length) detalle.push(`${H.secuelas.length} sin respuesta al esfuerzo`);
        if (detalle.length === 1 && comprometidos === parseInt(detalle[0])) detalle[0] = detalle[0].replace(/^\d+ /, '');
        parrafos.push(rellenar(T.lineaWMSI, {
            wmsiReposo: H.wmsiReposo,
            wmsiEstres: H.wmsiEstres,
            deltaWMSI: dTxt,
            aclaracionWMSI: H.wmsiExcluyeSeptales ? NARRATIVA.aclaracionWMSI : '',
            segmentos: comprometidos === 1
                ? `1 segmento comprometido (${detalle.join(', ')})`
                : `${comprometidos} segmentos comprometidos (${detalle.join(', ')})`
        }));
    }

    // ── ECG: líneas propias, fuera del párrafo de motilidad ──
    parrafos.push(rellenar(T.ecgReposo, { contenido: ecgReposoEnProsa(H) }));
    parrafos.push(rellenar(T.ecgPostEsfuerzo, { contenido: ecgEsfuerzoEnProsa(H) }));

    // ── ESTUDIO DIASTÓLICO: línea fija ──
    parrafos.push({
        negativo: T.diastolicoNegativo,
        positivo: T.diastolicoPositivo
    }[H.diastResultado] || T.diastolicoNoEvaluado);

    // ── CONCLUSIÓN ──
    // Con FC subóptima la conclusión negativa arranca corta: la limitación es el foco
    let claveConclusion = rama;
    if (rama === 'negativa' && H.hayConduccion) claveConclusion = 'negativaConduccion';
    else if (rama === 'negativa' && H.fcSuboptima) claveConclusion = 'negativaCorta';
    let conclusion = rellenar(T.conclusiones[claveConclusion], {
        ...datosConduccion,
        capacidadFuncional: H.capacidadFuncional || 'adecuada tolerancia al esfuerzo',
        gradoFey: gradoFeyEnProsa(H.feyReposo),
        vdConcl: H.vdProsa ? ', ' + H.vdProsa : '',
        descripcionST: descripcionSTEnProsa(H),
        capacidadDilatada: H.capacidadFuncional ? ` La capacidad funcional fue ${H.capacidadFuncional.replace('capacidad funcional ', '')}.` : '',
        territorioFrase: territorioFrase(H.territoriosIsquemia),
        territorioSecuelaFrase: territorioFrase(H.territoriosSecuela),
        motivoNoConcluyente: motivoNoConcluyente(H),
        sugerenciaNoConcluyente: 'repetir el estudio con contraste o un método alternativo de perfusión'
    });

    // Modificadores: se insertan antes del punto final
    const extras = [];            // coletillas: se enganchan antes del punto final
    const oracionesFinales = [];  // oraciones completas: van después
    if (H.hipertension && rama !== 'noConcluyente') extras.push(T.modificadores.hipertensiva);
    if (H.fcSuboptima && rama === 'negativa') extras.push(T.modificadores.fcSuboptima);
    // En un positivo la isquemia ya quedó demostrada y la FC insuficiente no lo invalida;
    // en un estudio sin isquemia, sí: no es un negativo pleno.
    const sinIsquemiaDemostrada = ['secuela', 'diastolico', 'dilatada'].includes(rama);
    if (H.fcSuboptima && sinIsquemiaDemostrada) oracionesFinales.push(T.modificadores.fcSuboptimaOracion);
    if (H.adquisicionTardia && rama !== 'noConcluyente')
        extras.push(rellenar(T.modificadores.adquisicionTardia, { segImagen: H.segImagen, pctFCadq: H.pctFCadq }));
    if (H.caidaFey && rama !== 'positivaMulti' && rama !== 'hipotensiva') extras.push(T.modificadores.caidaFey);
    // La conclusión no puede negar lo que el bloque de ECG describe
    if (H.stIsquemico && !H.hayConduccion && ['secuela', 'dilatada'].includes(rama))
        extras.push(rellenar(T.modificadores.discordancia, { descripcionST: descripcionSTEnProsa(H) }));
    // En la rama de HFpEF ya está en el núcleo de la conclusión: no se repite
    if (H.diastResultado === 'positivo' && rama !== 'diastolico')
        extras.push(T.modificadores.diastolicoPositivo);
    if (H.hayArritmiaRelevante) {
        const lista = H.arritmiasRelevantes.length
            ? listarEnProsa(H.arritmiasRelevantes.map(a => a.txt))
            : listarEnProsa(H.arritmias.map(a => a.txt));
        extras.push(rellenar(T.modificadores.arritmiaRelevante, {
            arritmias: lista,
            momento: (H.arrMomentoTxt && H.arrMomentoTxt !== '—') ? ' ' + H.arrMomentoTxt : '',
            sintomas: H.arrSintomatica ? ', con síntomas asociados' : ''
        }));
    }
    if (H.hayConduccion && rama !== 'negativa') {
        // Si ya se demostró isquemia en la DA con segmentos valorables, hablar de
        // especificidad reducida en ese territorio contradiría el propio hallazgo.
        const clave = H.territoriosIsquemia.includes('DA') ? 'conduccionSeptalAcotado' : 'conduccionSeptal';
        extras.push(rellenar(T.modificadores[clave], datosConduccion));
    }

    if (extras.length) conclusion = conclusion.replace(/\.$/, '') + extras.join('') + '.';
    if (oracionesFinales.length) conclusion += oracionesFinales.join('');

    // Preámbulo: encabeza SIEMPRE, antes del veredicto.
    const metsFrase = H.mets ? rellenar(T.preambuloMETs, { mets: H.mets }) : '';
    const preambulo = rellenar(T.preambulo, {
        suficiencia: H.pctFCmax >= 85 ? 'suficiente' : 'insuficiente',
        pctFCmax: H.pctFCmax || nada,
        betabloqueo: H.betabloqueante ? T.preambuloBetabloqueo : '',
        etapa: H.etapa ? rellenar(T.preambuloEtapa, { etapa: H.etapa }) : T.preambuloSinEtapa,
        causaDetencion: H.causaDetencionTxt
    }) + rellenar(H.isquemicos.length ? T.preambuloConIsquemia : T.preambuloSinIsquemia, {
        dobleProducto: H.dobleProducto ? H.dobleProducto.toLocaleString('es-AR') : nada,
        mets: metsFrase
    });
    conclusion = preambulo + '\n' + conclusion;
    if (H.categorizacion) conclusion += ' ' + rellenar(T.categorizacion, { categorizacion: H.categorizacion });
    parrafos.push(conclusion);

    return { rama, texto: parrafos.join('\n\n') };
}

function motivoNoConcluyente(H) {
    const m = [];
    if (H.ventana === 'limitada') m.push('ventana acústica limitada');
    if (H.estimuloInsuficiente)
        m.push(`estímulo insuficiente (doble producto ${H.dobleProducto.toLocaleString('es-AR')})` +
               (H.betabloqueante ? ', bajo tratamiento betabloqueante' : ''));
    if (H.adquisicionTardia) m.push('adquisición post-esfuerzo tardía');
    if (H.fcSuboptima) m.push('no haberse alcanzado la FC objetivo');
    return listarEnProsa(m) || 'limitaciones técnicas del estudio';
}

// ── Botón "Generar informe" ───────────────────
function generarInforme() {
    // Si report-templates.js no cargó (caché vieja del index.html, archivo faltante),
    // el botón fallaría mudo. Mejor decirlo.
    if (typeof NARRATIVA === 'undefined') {
        alert('No se cargaron las plantillas del informe (report-templates.js).\n\n' +
              'Suele ser la caché del navegador: recargá con Cmd+Shift+R.\n' +
              'Si sigue igual, verificá que report-templates.js esté en la misma carpeta que index.html.');
        return;
    }
    if (currentProtocol !== 'ejercicio') {
        alert('El informe narrativo está redactado para el protocolo de ejercicio. Para dobutamina o dipiridamol, usá "Planilla de datos".');
        return;
    }
    const H = recolectarHallazgos();
    const { rama, texto } = construirNarrativa(H);

    const fEst = v('fecha_estudio');
    const fecha = fEst
        ? new Date(fEst + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const encabezado = [
        'ECOCARDIOGRAMA DE ESTRÉS CON EJERCICIO',
        `${v('paciente_nombre') || v('paciente_id') || 'Paciente s/ identificar'}` +
            `${v('paciente_id') && v('paciente_nombre') ? ' · HC ' + v('paciente_id') : ''}` +
            ` · ${v('edad') || '—'} años · ${document.getElementById('sexo').value === 'M' ? 'masculino' : 'femenino'}` +
            ` · ${fecha}`
    ].join('\n');

    const firma = firmaInforme();
    const informe = `${encabezado}\n\n${texto}\n${firma ? '\n' + firma + '\n' : ''}`;

    aprenderIndicacion();
    validarEstudio(rama);

    const out = document.getElementById('reporte-output');
    out.style.display = 'block';
    out.textContent = informe;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scheduleSave();
}

// ── VALIDACIÓN DEL ESTUDIO ────────────────────
// No bloquea la generación del informe: avisa qué falta o qué es incoherente.
function validarEstudio(rama) {
    const av = [];   // { nivel: 'error'|'warn'|'info', txt }
    const cnt = contarMotilidad();
    const edad = parseInt(v('edad')) || 0;
    const fcPico = num('esf_max_fc');
    const resultado = document.getElementById('resultado_estudio').value;

    if (!v('paciente_id') && !v('paciente_nombre')) av.push({ nivel: 'warn', txt: 'Falta identificar al paciente (HC/ID o nombre).' });
    if (!edad) av.push({ nivel: 'error', txt: 'Falta la edad: sin ella no se calcula la FC máxima predicha ni la adecuación del estudio.' });
    if (!document.getElementById('indicacion').value) av.push({ nivel: 'warn', txt: 'Falta la indicación del estudio.' });
    if (!v('fevi_reposo')) av.push({ nivel: 'warn', txt: 'Falta la FEy en reposo.' });

    if (cnt.evalRep === 0 || cnt.evalEst === 0) {
        av.push({ nivel: 'error', txt: 'Motilidad segmentaria incompleta: falta cargar reposo y/o pico. El informe se genera sin análisis segmentario.' });
    } else {
        if (cnt.sinPar > 0) av.push({ nivel: 'error', txt: `${cnt.sinPar} segmento(s) cargado(s) en una sola fase: no se puede definir su respuesta. Completar o dejar ambos en "no evaluado".` });
        if ((17 - cnt.evalEst) > 2 || (17 - cnt.evalRep) > 2) av.push({ nivel: 'warn', txt: 'Más de 2 segmentos no visualizados: estudio subóptimo (ASE). Considerar contraste ecocardiográfico y consignarlo como limitación.' });
    }

    if (currentProtocol === 'ejercicio') {
        if (!fcPico) av.push({ nivel: 'error', txt: 'Falta la FC pico: es el dato que define si el estudio es concluyente.' });
        else if (edad) {
            const pct = Math.round(fcPico / (220 - edad) * 100);
            if (pct < 85 && resultado === 'negativo') {
                av.push({ nivel: 'error', txt: `FC pico ${pct}% de la máxima predicha (<85%) con resultado NEGATIVO: por criterio debe informarse como NO CONCLUYENTE (o negativo submáximo).` });
            }
        }
        if (!num('esf_max_tas')) av.push({ nivel: 'warn', txt: 'Falta la TA sistólica del máximo esfuerzo: sin ella no hay doble producto ni respuesta tensional.' });
        if (!num('esf_rec_fc')) av.push({ nivel: 'info', txt: 'Sin FC al 1.er minuto de recuperación: se pierde el HRR₁, marcador pronóstico independiente.' });
        if (!num('ej_fc_img')) av.push({ nivel: 'error', txt: 'Falta la FC al adquirir la primera imagen post-esfuerzo: sin ese dato no se puede afirmar que la adquisición fue oportuna.' });
        else if (fcPico > 0 && (num('ej_fc_img') / fcPico) < 0.85)
            av.push({ nivel: 'warn', txt: 'Imagen post-esfuerzo adquirida con <85% de la FC pico: la sensibilidad está reducida y debe constar en el informe.' });
        if (!num('ej_carga')) av.push({ nivel: 'info', txt: 'Sin carga alcanzada (Kgm/min).' });
        if (!num('ej_etapa')) av.push({ nivel: 'info', txt: 'Sin etapa alcanzada: la conclusión no va a poder decir en qué etapa se detuvo.' });
    }

    if (!resultado) av.push({ nivel: 'error', txt: 'Falta seleccionar el RESULTADO del estudio.' });
    if (resultado === 'positivo' && cnt.isquemicos === 0)
        av.push({ nivel: 'warn', txt: 'Resultado POSITIVO pero ningún segmento muestra isquemia inducible en la tabla. Verificar la carga de motilidad.' });
    if (resultado === 'negativo' && cnt.isquemicos > 0)
        av.push({ nivel: 'warn', txt: `Resultado NEGATIVO pero hay ${cnt.isquemicos} segmento(s) con deterioro en el pico. Revisar.` });

    const terrSel = document.getElementById('territorio_afectado').value;
    if (cnt.territorios.length && terrSel === 'ninguno')
        av.push({ nivel: 'warn', txt: `La tabla sugiere compromiso de ${cnt.territorios.join(' + ')} y el territorio informado es "Ninguno".` });

    if (rama) {
        const esperado = { negativa: 'negativo', positivaUnico: 'positivo', positivaMulti: 'positivo',
                           hipotensiva: 'positivo', noConcluyente: 'no_concluyente',
                           diastolico: 'diastolico_positivo', secuela: 'negativo' }[rama];
        if (resultado && esperado && resultado !== esperado)
            av.push({ nivel: 'warn', txt: `El informe narrativo salió por la rama "${rama}" pero el resultado elegido a mano es otro. Verificá cuál corresponde.` });
    }

    if (document.getElementById('ventana').value === 'limitada' && cnt.evalRep >= 17 && cnt.evalEst >= 17)
        av.push({ nivel: 'warn', txt: 'Marcaste ventana limitada pero evaluaste los 17 segmentos. El informe sale por la rama NO CONCLUYENTE: verificá si la ventana fue realmente limitada.' });

    // El texto libre de reposo no lo lee el motor: si contradice lo cargado, el informe
    // se contradice a sí mismo (el párrafo dice una FEy y la conclusión razona con otra).
    const libre = v('reposo_libre');
    if (libre) {
        const feyCampo = num('fevi_reposo');
        const m = libre.match(/FEy?\s*:?\s*(\d{1,2})\s*%/i);
        if (m && feyCampo > 0 && Math.abs(parseInt(m[1]) - feyCampo) >= 1)
            av.push({ nivel: 'error', txt: `El texto libre dice FEy ${m[1]} % y el campo tiene ${feyCampo} %. El informe va a mostrar un valor y razonar con el otro.` });
        if (!m && feyCampo > 0)
            av.push({ nivel: 'info', txt: 'El texto libre de reposo no menciona la FEy; el resto del informe la usa igual desde el campo.' });
        const hablaDeAlteracion = /aquinesi|acinesi|hipoquinesi|hipocinesi|disquinesi|discinesi/i.test(libre);
        if (hablaDeAlteracion && cnt.evalRep > 0 && !SEGMENTS.some(sg => WM.reposo[sg.id] > 1))
            av.push({ nivel: 'error', txt: 'El texto libre describe alteraciones de la motilidad en reposo, pero en el bull\'s eye todos los segmentos están normales. La conclusión se arma con el bull\'s eye.' });
    }

    const patronEl = document.getElementById('patron_motilidad');
    if (patronEl.value === 'segmentaria' && detectarPatronGlobal())
        av.push({ nivel: 'warn', txt: 'El patrón cumple criterio de compromiso global (≥12 segmentos, tres territorios, FEy ≤40 %) pero está marcado como segmentario: la conclusión va a atribuir territorios coronarios.' });
    if (patronEl.value === 'global' && !detectarPatronGlobal())
        av.push({ nivel: 'info', txt: 'Marcaste patrón global sin que se cumpla el criterio automático. El informe respeta tu criterio.' });

    const conduccion = document.getElementById('ecg_conduccion').value;
    if (conduccion && conduccion !== 'ninguno') {
        if (document.getElementById('ecg_st_tipo').value)
            av.push({ nivel: 'warn', txt: 'Cargaste cambios del ST con un trastorno de conducción: el informe los describe pero deja constancia de que el análisis del ST no es valorable.' });
        const septalesAlterados = SEGMENTOS_SEPTALES.filter(id => WM.reposo[id] > 1 || WM.estres[id] > 1);
        if (septalesAlterados.length && resultado === 'positivo' && cnt.isquemicos === 0)
            av.push({ nivel: 'error', txt: 'Resultado POSITIVO sostenido sólo por segmentos septales con trastorno de conducción: esa alteración es eléctrica, no isquémica. Revisá el resultado.' });
        if (septalesAlterados.length)
            av.push({ nivel: 'info', txt: `${septalesAlterados.length} segmento(s) septal(es) quedan fuera del análisis isquémico por el trastorno de conducción. El WMSI de la tabla los sigue incluyendo.` });
    }

    const panel = document.getElementById('validacion-panel');
    if (!av.length) {
        panel.style.display = 'block';
        panel.className = 'validacion-panel val-ok';
        panel.innerHTML = '<strong>✓ Control de completitud:</strong> sin observaciones.';
        return true;
    }
    const orden = { error: 0, warn: 1, info: 2 };
    av.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
    const icono = { error: '⛔', warn: '⚠️', info: 'ℹ️' };
    panel.style.display = 'block';
    panel.className = 'validacion-panel' + (av.some(a => a.nivel === 'error') ? ' val-error' : ' val-warn');
    panel.innerHTML = '<strong>Control de completitud del informe</strong><ul>' +
        av.map(a => `<li class="val-${a.nivel}">${icono[a.nivel]} ${a.txt}</li>`).join('') + '</ul>';
    return !av.some(a => a.nivel === 'error');
}

// ── CHECKLIST PRE-ESTUDIO ─────────────────────
function updateChecklistBadge() {
    const todos = document.querySelectorAll('.chk-pre');
    const ok = Array.from(todos).filter(c => c.checked).length;
    const badge = document.getElementById('checklist-badge');
    if (!badge) return;
    badge.textContent = `${ok} / ${todos.length}`;
    badge.style.background = ok === todos.length ? 'var(--color-success-bg)' : '';
    badge.style.color = ok === todos.length ? 'var(--color-success)' : '';
}

// ══════════════════════════════════════════════
//  HISTORIAL LOCAL DE ESTUDIOS
// ══════════════════════════════════════════════
const HIST_KEY = 'eco-estres-historial';
const HIST_MAX = 50;
const HIST_VIDA_MS = 12 * 60 * 60 * 1000;   // el historial es respaldo de la jornada, no archivo

function leerHistorial() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; }
    catch (e) { return []; }
}

// Descarta lo que pasó las 12 h. Devuelve cuántos se fueron, para poder avisarlo:
// borrar datos de pacientes en silencio sería peor que no borrarlos.
function purgarHistorialVencido() {
    const lista = leerHistorial();
    if (!lista.length) return 0;
    const limite = Date.now() - HIST_VIDA_MS;
    const vigentes = lista.filter(h => (h.ts || 0) >= limite);
    if (vigentes.length === lista.length) return 0;
    try { localStorage.setItem(HIST_KEY, JSON.stringify(vigentes)); } catch (e) { return 0; }
    return lista.length - vigentes.length;
}

// Fin del día: se vacía todo de esta computadora.
function cerrarJornada() {
    const lista = leerHistorial();
    if (!lista.length) { showNotice('El historial ya está vacío.', 'ok'); return; }
    const nombres = lista.slice(0, 3).map(h => h.nombre || h.id).join(', ');
    if (!confirm(
        `Se van a borrar ${lista.length} estudio(s) del historial de esta computadora` +
        `\n(${nombres}${lista.length > 3 ? ', …' : ''}).\n\n` +
        `Los informes ya firmados en la historia clínica no se tocan.\n` +
        `Esta acción no se puede deshacer. ¿Cerrar la jornada?`)) return;
    try { localStorage.removeItem(HIST_KEY); } catch (e) { /* noop */ }
    renderHistorial();
    showNotice('Historial vaciado. No quedan datos de pacientes en esta computadora.', 'ok');
}

function guardarEnHistorial() {
    const reporte = document.getElementById('reporte-output').textContent;
    if (!reporte) { alert('Primero generá el informe.'); return; }

    // Sin HC el estudio no se puede identificar después: se avisa y se pide confirmación
    // explícita en vez de dejarlo pasar sin más.
    // Con el nombre alcanza para identificarlo: sólo se pregunta si no hay ni HC ni nombre.
    if (!v('paciente_id') && !v('paciente_nombre')) {
        const campo = document.getElementById('paciente_id');
        campo.focus();
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (!confirm('El estudio no tiene ni HC ni nombre.\n\n' +
                     'No vas a poder distinguirlo de los demás en el historial.\n\n' +
                     '¿Guardar igual, sin identificar?')) return;
    }

    const lista = leerHistorial();
    const resEl = document.getElementById('resultado_estudio');
    lista.unshift({
        ts: Date.now(),
        id: v('paciente_id') || 's/ID',
        nombre: v('paciente_nombre') || '',
        resultado: resEl.value ? textoSelect('resultado_estudio') : '—',
        protocolo: currentProtocol,
        reporte,
        estudio: {
            fields: captureFields(),
            wm: { reposo: { ...WM.reposo }, estres: { ...WM.estres } },
            protocol: currentProtocol,
            specialTab: currentSpecialTab,
            dobStages: captureDobStages(),
            medicacion: medicacionActual.map(m => ({ ...m })),
        }
    });
    try {
        localStorage.setItem(HIST_KEY, JSON.stringify(lista.slice(0, HIST_MAX)));
        renderHistorial();
        showNotice('Estudio guardado en el historial de esta computadora.', 'ok');
    } catch (e) {
        alert('No se pudo guardar en el historial (almacenamiento lleno).');
    }
}

function renderHistorial(avisarPurga) {
    const cont = document.getElementById('historial-lista');
    if (!cont) return;
    const purgados = purgarHistorialVencido();
    if (purgados && avisarPurga)
        showNotice(purgados === 1
            ? 'Se descartó del historial 1 estudio de más de 12 h.'
            : `Se descartaron del historial ${purgados} estudios de más de 12 h.`, 'warn');
    const lista = leerHistorial();
    document.getElementById('historial-badge').textContent = lista.length;
    if (!lista.length) {
        cont.innerHTML = '<p class="module-description">Todavía no hay estudios guardados.</p>';
        return;
    }
    cont.innerHTML = lista.map((h, i) => {
        const f = new Date(h.ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        return `<div class="hist-item">
            <div class="hist-info">
                <strong>${h.id}</strong>${h.nombre ? ' — ' + h.nombre : ''}
                <span class="hist-meta">${f} · ${h.resultado}</span>
            </div>
            <div class="hist-actions">
                <button class="btn btn-secondary btn-sm" onclick="verReporteHistorial(${i})">Ver informe</button>
                <button class="btn btn-secondary btn-sm" onclick="cargarDelHistorial(${i})">Cargar</button>
                <button class="btn btn-danger btn-sm" onclick="borrarDelHistorial(${i})">✕</button>
            </div>
        </div>`;
    }).join('');
}

function verReporteHistorial(i) {
    const h = leerHistorial()[i];
    if (!h) return;
    const out = document.getElementById('reporte-output');
    out.style.display = 'block';
    out.textContent = h.reporte;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cargarDelHistorial(i) {
    const h = leerHistorial()[i];
    if (!h) return;
    if (!confirm(`¿Cargar el estudio de ${h.id}? Se reemplazan los datos actuales del formulario.`)) return;
    resetFormulario();
    aplicarEstudio(h.estudio);
    showNotice('Estudio cargado desde el historial.', 'ok');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function borrarDelHistorial(i) {
    const lista = leerHistorial();
    if (!lista[i]) return;
    if (!confirm(`¿Borrar del historial el estudio de ${lista[i].id}?`)) return;
    lista.splice(i, 1);
    localStorage.setItem(HIST_KEY, JSON.stringify(lista));
    renderHistorial();
}

function getResponseText(scRep, scEst) {
    const r = classifyResponse(scRep, scEst);
    return r.key === 'isquemia' ? 'ISQUEMIA INDUCIBLE'
         : r.key === 'viable' && scEst === 1 ? 'VIABILIDAD (normalización)'
         : r.label;
}

function v(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// Texto visible de un <select>. Un select con un valor que ya no existe queda en
// selectedIndex −1: leer options[-1].text tira TypeError y mata al generador de informe.
function textoSelect(id) {
    const el = document.getElementById(id);
    if (!el || el.selectedIndex < 0) return '—';
    return el.options[el.selectedIndex].text;
}

// Imprime siempre sobre un informe generado (evita imprimir una hoja vacía)
function imprimirReporte() {
    const out = document.getElementById('reporte-output');
    if (!out.textContent.trim()) generarReporte();
    setTimeout(() => window.print(), 150);
}

function copiarReporte() {
    const txt = document.getElementById('reporte-output').textContent;
    if (!txt) { alert('Primero generá el informe.'); return; }

    // navigator.clipboard NO existe si la página se abrió con doble clic (file://):
    // no es un contexto seguro. Sin este respaldo el botón no hacía nada ni avisaba.
    const respaldo = () => {
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        if (ok) showNotice('Informe copiado al portapapeles.', 'ok');
        else {
            // Última salida: dejarlo seleccionado para que copie con Ctrl/Cmd+C
            seleccionarInforme();
            showNotice('No se pudo copiar solo. El informe quedó seleccionado: copiá con Cmd+C.', 'warn');
        }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt)
            .then(() => showNotice('Informe copiado al portapapeles.', 'ok'))
            .catch(respaldo);
    } else {
        respaldo();
    }
}

function seleccionarInforme() {
    const out = document.getElementById('reporte-output');
    const rango = document.createRange();
    rango.selectNodeContents(out);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rango);
}

function limpiarFormulario() {
    if (!confirm('¿Confirma iniciar un nuevo estudio? Se borrarán todos los datos.')) return;
    resetFormulario();
    clearDraft();   // descartar el borrador guardado del estudio anterior
}

function resetFormulario() {
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
        if (CAMPOS_NO_ESTUDIO.includes(el.id)) return;   // la firma sobrevive al cambio de paciente
        el.value = '';
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    document.querySelectorAll('select').forEach(el => el.selectedIndex = 0);

    SEGMENTS.forEach(s => { WM.reposo[s.id] = 0; WM.estres[s.id] = 0; });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();

    document.getElementById('reporte-output').style.display = 'none';
    document.getElementById('resultado-banner').style.display = 'none';
    document.getElementById('validacion-panel').style.display = 'none';
    setFechaHoy();
    medicacionActual = [];
    renderMedicacion();
    diastolicoTocadoAMano = false;
    patronTocadoAMano = false;
    setProtocol('ejercicio');
    setSpecialTab('viabilidad');
    updateChecklistBadge();
    calcEjercicio();
    document.getElementById('aviso-adquisicion').style.display = 'none';
}

// ── PRESETS ───────────────────────────────────
function setVal(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
        for (let i = 0; i < el.options.length; i++) {
            if (el.options[i].value === val) { el.selectedIndex = i; break; }
        }
    } else if (el.type === 'checkbox') {
        el.checked = !!val;
    } else {
        el.value = val;
    }
}

function setWM(scores) {
    // scores = { reposo: {segId: score, ...}, estres: {segId: score, ...} }
    if (scores.reposo) Object.entries(scores.reposo).forEach(([id, sc]) => { WM.reposo[parseInt(id)] = sc; });
    if (scores.estres) Object.entries(scores.estres).forEach(([id, sc]) => { WM.estres[parseInt(id)] = sc; });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();
}

function allSegments(score) {
    const o = {};
    for (let i = 1; i <= 17; i++) o[i] = score;
    return o;
}

function applyPreset(name) {
    resetFormulario();

    const P = PRESETS[name];
    if (!P) return;

    // Datos del paciente
    if (P.edad) setVal('edad', P.edad);
    if (P.sexo) setVal('sexo', P.sexo);
    if (P.peso) { setVal('peso', P.peso); setVal('dob_peso', P.peso); setVal('dip_peso', P.peso); }
    if (P.altura) setVal('altura', P.altura);
    calcBSA();

    ['esf_basal_tas','esf_basal_tad','esf_basal_fc','esf_max_tas','esf_max_tad','esf_max_fc',
     'esf_rec_tas','esf_rec_tad','esf_rec_fc','esf_max_sint'].forEach(k => { if (P[k]) setVal(k, P[k]); });
    if (P.ventana) setVal('ventana', P.ventana);
    if (P.indicacion) setVal('indicacion', P.indicacion);

    // Antecedentes
    if (P.antecedentes) P.antecedentes.forEach(a => setVal('ant_' + a, true));

    // Protocolo
    if (P.protocolo) {
        setProtocol(P.protocolo);
        if (P.protocolo === 'ejercicio') {
            ['ej_carga','ej_protocolo','ej_etapa','ej_duracion','ej_mets','ej_seg_img','ej_fc_img','ej_causa_detencion']
                .forEach(k => { if (P[k]) setVal(k, P[k]); });
            calcEjercicio();
        } else if (P.protocolo === 'dobutamina') {
            ['dob_fc_reposo','dob_ta_reposo'].forEach(k => { if (P[k]) setVal(k, P[k]); });
            if (P.dob_dosis_max) setVal('dob_dosis_max', P.dob_dosis_max);
            if (P.dob_fc_pico) setVal('dob_fc_pico', P.dob_fc_pico);
            if (P.dob_atropina) setVal('dob_atropina', P.dob_atropina);
            if (P.dob_ta_pico) setVal('dob_ta_pico', P.dob_ta_pico);
            if (P.dob_motivo_fin) setVal('dob_motivo_fin', P.dob_motivo_fin);
            calcDobutamina();
        }
    }

    // FEy
    if (P.fevi_reposo) setVal('fevi_reposo', P.fevi_reposo);
    if (P.fevi_pico) setVal('fevi_pico', P.fevi_pico);
    if (P.fevi_recup) setVal('fevi_recup', P.fevi_recup);
    calcFEVI();

    // Wall motion
    if (P.wm) setWM(P.wm);

    // Estrés diastólico
    if (P.e_prima_rep) setVal('e_prima_rep', P.e_prima_rep);
    if (P.e_onda_rep) setVal('e_onda_rep', P.e_onda_rep);
    if (P.e_prima_est) setVal('e_prima_est', P.e_prima_est);
    if (P.e_onda_est) setVal('e_onda_est', P.e_onda_est);
    calcDiastolico();

    // Resultado
    if (P.resultado) setVal('resultado_estudio', P.resultado);
    if (P.territorio) setVal('territorio_afectado', P.territorio);
    if (P.extension) setVal('extension_isquemia', P.extension);
    if (P.hallazgos) P.hallazgos.forEach(h => setVal('hal_' + h, true));
    updateResultBanner();

    // MCH fields
    if (P.mch_grad_reposo) setVal('mch_grad_reposo', P.mch_grad_reposo);
    if (P.mch_grad_estres) setVal('mch_grad_estres', P.mch_grad_estres);
    if (P.mch_sam) setVal('mch_sam', P.mch_sam);
    if (P.mch_patologia) setVal('mch_patologia', P.mch_patologia);
    if (P.mch_grad_reposo) calcMCH();

    // EAo fields
    if (P.eao_grad_reposo) setVal('eao_grad_reposo', P.eao_grad_reposo);
    if (P.eao_ava_reposo) setVal('eao_ava_reposo', P.eao_ava_reposo);
    if (P.eao_grad_dob) setVal('eao_grad_dob', P.eao_grad_dob);
    if (P.eao_ava_dob) setVal('eao_ava_dob', P.eao_ava_dob);
    if (P.eao_reserva_flujo) setVal('eao_reserva_flujo', P.eao_reserva_flujo);
    if (P.eao_grad_reposo) calcEAo();

    onEdadChange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scheduleSave();
}

// ══════════════════════════════════════════════
//  AUTOSAVE / RECUPERACIÓN DEL ESTUDIO EN CURSO
// ══════════════════════════════════════════════
const DRAFT_KEY = 'eco-estres-draft';
const DRAFT_PENDIENTE_KEY = 'eco-estres-draft-pendiente';
const DRAFT_VERSION = 3;
const DRAFT_DEBOUNCE_MS = 600;

// El autosave NUNCA se suspende. Mientras el aviso de recuperación está en pantalla
// escribe en una clave separada, así lo que se carga en ese rato queda a salvo sin
// pisar el borrador anterior. Al decidir, la clave elegida pasa a ser la definitiva.
let autosaveEnabled = true;
let draftKeyActual = DRAFT_KEY;    // dónde escribe el autosave ahora mismo
let draftOfrecidoKey = null;       // qué clave está ofreciendo el aviso
let saveTimer = null;

// ── Captura de estado ─────────────────────────
const CAMPOS_NO_ESTUDIO = ['firma_informe'];   // configuración del operador, no datos del paciente

function captureFields() {
    const data = {};
    document.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
        if (CAMPOS_NO_ESTUDIO.includes(el.id)) return;
        data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return data;
}

// Casillas FC/TA/síntomas de la tabla de dobutamina (se crean al vuelo, sin ID).
// Se guardan por posición: una fila por cada <tr>, valores en orden de columna.
function captureDobStages() {
    const tbody = document.getElementById('dob-etapas');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('input')).map(inp => inp.value)
    );
}

// ── Guardado ──────────────────────────────────
function saveDraft() {
    try {
        const draft = {
            version: DRAFT_VERSION,
            savedAt: new Date().toISOString(),
            fields: captureFields(),
            wm: { reposo: { ...WM.reposo }, estres: { ...WM.estres } },
            protocol: currentProtocol,
            specialTab: currentSpecialTab,
            dobStages: captureDobStages(),
            medicacion: medicacionActual.map(m => ({ ...m })),
            // El informe ya redactado también se guarda: si se cierra el navegador
            // después de generarlo, vuelve tal cual y no hay que rehacerlo.
            reporte: document.getElementById('reporte-output').textContent || ''
        };
        localStorage.setItem(draftKeyActual, JSON.stringify(draft));
    } catch (e) {
        console.warn('No se pudo guardar el borrador:', e);
    }
}

function scheduleSave() {
    if (!autosaveEnabled) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, DRAFT_DEBOUNCE_MS);
}

function readDraft(key) {
    try {
        const raw = localStorage.getItem(key || DRAFT_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (!d || d.version !== DRAFT_VERSION) return null; // versión incompatible: se ignora
        return d;
    } catch (e) {
        return null;
    }
}

function clearDraft() {
    [DRAFT_KEY, DRAFT_PENDIENTE_KEY].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) { /* noop */ }
    });
    draftKeyActual = DRAFT_KEY;
}

// ── Restauración ──────────────────────────────
function restoreFields(fields) {
    if (!fields) return;
    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') { el.checked = !!val; return; }
        // Un select con un valor que ya no existe queda en selectedIndex −1 (en blanco)
        // y hace explotar al generador de informe. Si el valor no está, se deja el actual.
        if (el.tagName === 'SELECT' && val !== '' &&
            !Array.from(el.options).some(o => o.value === val)) return;
        el.value = val;
    });
}

// ¿Hay algo cargado que valga la pena no pisar?
function formularioTieneDatos() {
    const conTexto = ['paciente_id', 'paciente_nombre', 'edad', 'peso', 'altura'].some(id => v(id));
    const conMotilidad = SEGMENTS.some(s => WM.reposo[s.id] > 0 || WM.estres[s.id] > 0);
    return conTexto || conMotilidad;
}

// Restauración DEFENSIVA de las etapas de dobutamina: solo rellena si la
// estructura guardada coincide con la actual (misma cantidad de filas y de
// casillas por fila). Si no coincide, omite y avisa en vez de meter datos corridos.
function restoreDobStages(saved) {
    if (!Array.isArray(saved) || saved.length === 0) return;
    const tbody = document.getElementById('dob-etapas');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));

    let structuraOk = rows.length === saved.length;
    if (structuraOk) {
        structuraOk = rows.every((tr, ri) =>
            tr.querySelectorAll('input').length === saved[ri].length
        );
    }
    if (!structuraOk) {
        showNotice('No se pudieron restaurar las etapas de dobutamina (la tabla cambió). El resto del estudio sí se recuperó.', 'warn');
        return;
    }
    rows.forEach((tr, ri) => {
        tr.querySelectorAll('input').forEach((inp, ci) => { inp.value = saved[ri][ci]; });
    });
}

// Aplica un estudio completo (borrador o entrada del historial) al formulario
function aplicarEstudio(d) {
    if (!d) return;

    restoreFields(d.fields);

    // Pestañas activas
    if (d.protocol) setProtocol(d.protocol);
    if (d.specialTab) setSpecialTab(d.specialTab);

    // Bull's eye: recargar puntajes en memoria y redibujar con las funciones de la app
    SEGMENTS.forEach(s => {
        WM.reposo[s.id] = d.wm && d.wm.reposo && d.wm.reposo[s.id] != null ? d.wm.reposo[s.id] : 0;
        WM.estres[s.id] = d.wm && d.wm.estres && d.wm.estres[s.id] != null ? d.wm.estres[s.id] : 0;
    });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();

    // Recalcular todo lo derivado (no se guarda: se regenera)
    calcBSA(); calcEjercicio(); calcDobutamina(); calcDipiridamol();
    calcFEVI(); calcDiastolico(); calcCFR(); calcStrain(); calcEAo(); calcMCH();
    updateResultBanner(); updateChecklistBadge();
    diastolicoTocadoAMano = !!(d.fields && d.fields.diast_resultado && d.fields.diast_resultado !== 'no_evaluado');
    patronTocadoAMano = !!(d.fields && d.fields.patron_motilidad === 'global');

    medicacionActual = Array.isArray(d.medicacion) ? d.medicacion.map(m => ({ ...m })) : [];
    renderMedicacion();

    // La planilla de dobutamina se restaura DESPUÉS de que calcDobutamina rearmó la tabla
    restoreDobStages(d.dobStages);

    // Informe ya redactado
    const out = document.getElementById('reporte-output');
    if (d.reporte) {
        out.textContent = d.reporte;
        out.style.display = 'block';
    } else {
        out.textContent = '';
        out.style.display = 'none';
    }
}


// ── Aviso de recuperación (sin auto-relleno) ──
function showRecoveryBanner(draft, cuantos) {
    let whenTxt = 'fecha desconocida';
    if (draft.savedAt) {
        const d = new Date(draft.savedAt);
        if (!isNaN(d)) whenTxt = d.toLocaleString('es-AR',
            { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    const quien = draft.fields && (draft.fields.paciente_id || draft.fields.paciente_nombre);
    const bar = document.createElement('div');
    bar.className = 'draft-banner';
    bar.id = 'draft-recovery-banner';
    bar.innerHTML = `
        <span class="draft-banner-text">📋 Hay un estudio sin terminar${quien ? ' (' + quien + ')' : ''},
            guardado el ${whenTxt}.${cuantos > 1 ? ' Se ofrece el más reciente de 2 borradores.' : ''}
            <em>Mientras tanto podés cargar normalmente: lo que escribas ya se está guardando aparte.</em></span>
        <span class="draft-banner-actions">
            <button class="btn btn-primary btn-sm" id="draft-recover">Recuperar</button>
            <button class="btn btn-secondary btn-sm" id="draft-discard">Descartar</button>
        </span>`;
    document.body.insertBefore(bar, document.body.firstChild);

    document.getElementById('draft-recover').addEventListener('click', () => {
        if (formularioTieneDatos() &&
            !confirm('Ya cargaste datos en este formulario. Recuperar el estudio anterior los reemplaza. ¿Continuar?')) return;
        const guardado = readDraft(draftOfrecidoKey);
        resolverBorrador();
        aplicarEstudio(guardado);
        bar.remove();
        saveDraft();
        showNotice('Estudio recuperado.', 'ok');
    });
    document.getElementById('draft-discard').addEventListener('click', () => {
        // Descartar borra el borrador VIEJO y conserva lo que haya en pantalla:
        // si estuviste cargando mientras el aviso estaba visible, no se pierde nada.
        resolverBorrador();
        bar.remove();
        saveDraft();
    });
}

// Cierra la etapa de decisión: a partir de acá hay un solo borrador, el de siempre.
function resolverBorrador() {
    [DRAFT_KEY, DRAFT_PENDIENTE_KEY].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) { /* noop */ }
    });
    draftKeyActual = DRAFT_KEY;
    draftOfrecidoKey = null;
}

// ── Notificación breve (toast) ────────────────
function showNotice(msg, type) {
    const n = document.createElement('div');
    n.className = 'draft-notice' + (type === 'warn' ? ' draft-notice-warn' : type === 'ok' ? ' draft-notice-ok' : '');
    n.textContent = msg;
    document.body.appendChild(n);
    requestAnimationFrame(() => n.classList.add('show'));
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 400); }, 4500);
}

// ── Init del autosave ─────────────────────────
function setupAutosave() {
    // Desactivar el autocompletado/restauración nativa del navegador: así la ÚNICA
    // forma de recuperar datos del estudio anterior es el botón "Recuperar", y nunca
    // aparecen campos del paciente previo sin pasar por el aviso.
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.setAttribute('autocomplete', 'off');
    });

    // Un solo "escucha" general cubre todos los campos, incluso los que se crean al vuelo
    document.addEventListener('input', scheduleSave, true);
    document.addEventListener('change', scheduleSave, true);

    // Borradores presentes. Puede haber dos si el navegador se cerró con el aviso abierto.
    const candidatos = [DRAFT_KEY, DRAFT_PENDIENTE_KEY]
        .map(k => ({ key: k, draft: readDraft(k) }))
        .filter(c => c.draft);

    autosaveEnabled = true;   // siempre activo, desde el primer momento

    if (!candidatos.length) {
        draftKeyActual = DRAFT_KEY;
        return;
    }

    candidatos.sort((a, b) => new Date(b.draft.savedAt) - new Date(a.draft.savedAt));
    draftOfrecidoKey = candidatos[0].key;
    // Se escribe en la clave que NO se está ofreciendo, para no pisar lo que hay que recuperar
    draftKeyActual = draftOfrecidoKey === DRAFT_KEY ? DRAFT_PENDIENTE_KEY : DRAFT_KEY;
    showRecoveryBanner(candidatos[0].draft, candidatos.length);
}

const PRESETS = {

    negativo_normal: {
        edad: 52, sexo: 'M', peso: 78, altura: 172,
        ventana: 'buena', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'dislipemia'],
        protocolo: 'ejercicio',
        esf_basal_tas: '130', esf_basal_tad: '80', esf_basal_fc: '72',
        esf_max_tas: '185', esf_max_tad: '85', esf_max_fc: '156',
        esf_rec_tas: '150', esf_rec_tad: '82', esf_rec_fc: '132',
        ej_carga: '600', ej_protocolo: 'astrand', ej_etapa: '4', ej_duracion: '12:00', ej_mets: '9.5',
        ej_causa_detencion: 'fc_objetivo', ej_seg_img: '45', ej_fc_img: '148',
        fevi_reposo: 62, fevi_pico: 68, fevi_recup: 64,
        e_prima_rep: '9', e_onda_rep: '72', e_prima_est: '12', e_onda_est: '95',
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        resultado: 'negativo', territorio: 'ninguno'
    },

    negativo_submax: {
        edad: 68, sexo: 'F', peso: 65, altura: 158,
        ventana: 'regular', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'dm', 'betabloq'],
        protocolo: 'ejercicio',
        esf_basal_tas: '145', esf_basal_tad: '88', esf_basal_fc: '64',
        esf_max_tas: '170', esf_max_tad: '92', esf_max_fc: '108',
        esf_rec_tas: '155', esf_rec_tad: '85', esf_rec_fc: '94',
        ej_carga: '300', ej_protocolo: 'astrand', ej_etapa: '2', ej_duracion: '5:40', ej_mets: '5.2',
        ej_causa_detencion: 'fatiga', ej_seg_img: '50', ej_fc_img: '100',
        fevi_reposo: 58, fevi_pico: 62,
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        resultado: 'no_concluyente', territorio: 'ninguno'
    },

    isquemia_da: {
        edad: 58, sexo: 'M', peso: 82, altura: 175,
        ventana: 'buena', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'tabaquismo', 'dislipemia'],
        protocolo: 'ejercicio',
        esf_basal_tas: '138', esf_basal_tad: '82', esf_basal_fc: '68',
        esf_max_tas: '178', esf_max_tad: '88', esf_max_fc: '148', esf_max_sint: 'Angina típica',
        esf_rec_tas: '160', esf_rec_tad: '85', esf_rec_fc: '141',
        ej_carga: '450', ej_protocolo: 'astrand', ej_etapa: '3', ej_duracion: '8:00', ej_mets: '7.2',
        ej_causa_detencion: 'angina', ej_seg_img: '40', ej_fc_img: '140',
        fevi_reposo: 58, fevi_pico: 52,
        wm: {
            reposo: allSegments(1),
            estres: { ...allSegments(1), 1:3, 2:3, 7:3, 8:2, 13:3, 14:2, 17:2 }
        },
        resultado: 'positivo', territorio: 'da', extension: 'extensa',
        hallazgos: ['angina', 'st_dep']
    },

    isquemia_cd: {
        edad: 63, sexo: 'M', peso: 88, altura: 170, dob_fc_reposo: '74', dob_ta_reposo: '142/86',
        ventana: 'buena', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'dm', 'isquemia'],
        protocolo: 'dobutamina',
        dob_dosis_max: '40', dob_fc_pico: '142', dob_atropina: '0.5',
        dob_ta_pico: '168/92', dob_motivo_fin: 'isquemia',
        fevi_reposo: 56, fevi_pico: 50,
        wm: {
            reposo: allSegments(1),
            estres: { ...allSegments(1), 3:2, 4:3, 9:2, 10:3, 15:2 }
        },
        resultado: 'positivo', territorio: 'cd', extension: 'moderada',
        hallazgos: ['st_dep']
    },

    isquemia_multi: {
        edad: 66, sexo: 'M', peso: 90, altura: 168, dob_fc_reposo: '76', dob_ta_reposo: '150/92',
        ventana: 'regular', indicacion: 'estratificacion_riesgo',
        antecedentes: ['hta', 'dm', 'tabaquismo', 'dislipemia', 'isquemia'],
        protocolo: 'dobutamina',
        dob_dosis_max: '30', dob_fc_pico: '136', dob_atropina: '1.0',
        dob_ta_pico: '148/88', dob_motivo_fin: 'isquemia',
        fevi_reposo: 50, fevi_pico: 42,
        wm: {
            reposo: { ...allSegments(1), 4:2, 10:2 },
            estres: { ...allSegments(1), 1:3, 2:2, 4:3, 7:2, 8:2, 10:3, 13:2, 15:2, 17:2 }
        },
        resultado: 'positivo', territorio: 'da_cd', extension: 'extensa',
        hallazgos: ['angina', 'st_dep', 'hipotension']
    },

    viabilidad_bifasica: {
        edad: 60, sexo: 'M', peso: 75, altura: 170, dob_fc_reposo: '80', dob_ta_reposo: '118/72',
        ventana: 'buena', indicacion: 'viabilidad',
        antecedentes: ['isquemia', 'iam', 'crm'],
        protocolo: 'dobutamina',
        dob_dosis_max: '40', dob_fc_pico: '130', dob_atropina: 'no',
        dob_ta_pico: '138/78', dob_motivo_fin: 'fc_target',
        fevi_reposo: 35, fevi_pico: 42, fevi_recup: 38,
        wm: {
            reposo: { ...allSegments(1), 1:4, 2:4, 7:3, 8:3, 13:3, 14:3, 17:3 },
            estres: { ...allSegments(1), 1:2, 2:2, 7:3, 8:3, 13:2, 14:2, 17:2 }
        },
        resultado: 'viabilidad_positiva', territorio: 'da', extension: 'extensa'
    },

    cicatriz: {
        edad: 65, sexo: 'M', peso: 80, altura: 172, dob_fc_reposo: '78', dob_ta_reposo: '122/76',
        ventana: 'buena', indicacion: 'viabilidad',
        antecedentes: ['isquemia', 'iam'],
        protocolo: 'dobutamina',
        dob_dosis_max: '40', dob_fc_pico: '135', dob_atropina: '0.5',
        dob_ta_pico: '142/80', dob_motivo_fin: 'fc_target',
        fevi_reposo: 32, fevi_pico: 34, fevi_recup: 32,
        wm: {
            reposo: { ...allSegments(1), 1:4, 2:4, 7:4, 8:4, 13:4, 14:4, 17:4 },
            estres: { ...allSegments(1), 1:4, 2:4, 7:4, 8:4, 13:4, 14:4, 17:4 }
        },
        resultado: 'viabilidad_negativa', territorio: 'da', extension: 'extensa'
    },

    diastolico_pos: {
        edad: 55, sexo: 'F', peso: 68, altura: 160,
        ventana: 'buena', indicacion: 'diastolico',
        antecedentes: ['hta'],
        protocolo: 'ejercicio',
        esf_basal_tas: '140', esf_basal_tad: '88', esf_basal_fc: '70',
        esf_max_tas: '195', esf_max_tad: '95', esf_max_fc: '145', esf_max_sint: 'Disnea',
        esf_rec_tas: '170', esf_rec_tad: '90', esf_rec_fc: '128',
        ej_carga: '300', ej_protocolo: 'astrand', ej_etapa: '2', ej_duracion: '7:00', ej_mets: '6.5',
        ej_causa_detencion: 'fatiga', ej_seg_img: '45', ej_fc_img: '138',
        e_prima_lat_rep: '9', e_prima_lat_est: '8', vrt_rep: '2.4', vrt_est: '3.1',
        fevi_reposo: 60, fevi_pico: 65,
        e_prima_rep: '7', e_onda_rep: '65', e_prima_est: '6', e_onda_est: '110',
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        resultado: 'diastolico_positivo', territorio: 'ninguno',
        hallazgos: ['disnea', 'hipertensiva']
    },

    mch_latente: {
        edad: 42, sexo: 'M', peso: 75, altura: 176,
        ventana: 'buena', indicacion: 'mch',
        protocolo: 'ejercicio',
        esf_basal_tas: '120', esf_basal_tad: '78', esf_basal_fc: '62',
        esf_max_tas: '165', esf_max_tad: '80', esf_max_fc: '162', esf_max_sint: 'Disnea',
        esf_rec_tas: '140', esf_rec_tad: '78', esf_rec_fc: '140',
        ej_carga: '750', ej_protocolo: 'astrand', ej_etapa: '5', ej_duracion: '8:45', ej_mets: '9.5',
        ej_causa_detencion: 'fatiga', ej_seg_img: '40', ej_fc_img: '150',
        fevi_reposo: 68, fevi_pico: 75,
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        mch_grad_reposo: '18', mch_grad_estres: '72', mch_sam: 'inducido', mch_patologia: 'mch',
        resultado: 'positivo', territorio: 'ninguno',
        hallazgos: ['disnea']
    },

    eao_bajo_flujo: {
        edad: 72, sexo: 'M', peso: 70, altura: 166, dob_fc_reposo: '82', dob_ta_reposo: '110/68',
        ventana: 'regular', indicacion: 'estenosis_ao',
        antecedentes: ['hta', 'isquemia', 'valv'],
        protocolo: 'dobutamina',
        dob_dosis_max: '20', dob_fc_pico: '100', dob_atropina: 'no',
        dob_ta_pico: '125/72', dob_motivo_fin: 'criterio_medico',
        fevi_reposo: 30, fevi_pico: 38,
        wm: {
            reposo: { ...allSegments(2), 5:1, 6:1, 11:1, 12:1, 16:1 },
            estres: { ...allSegments(1), 1:2, 7:2 }
        },
        eao_grad_reposo: '22', eao_ava_reposo: '0.75',
        eao_grad_dob: '45', eao_ava_dob: '0.82', eao_reserva_flujo: 'presente',
        resultado: 'positivo', territorio: 'ninguno'
    }
};

