// Tanda de simplificación estructural. Lo que importa de cada punto es que nada se
// haya perdido: los campos que salieron de la pantalla siguen alimentando el informe
// de los estudios que los traen.
const { cargarApp, casoBase, informe } = require('./harness');

const w = cargarApp();
const WM = w.eval('WM');
const set = (id, v) => { const e = w.document.getElementById(id); if (!e) return false;
    e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true }));
    e.dispatchEvent(new w.Event('change', { bubbles: true })); return true; };
const tick = (id, v = true) => { const e = w.document.getElementById(id); if (!e) return false;
    e.checked = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); return true; };
let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };
const linea = rot => informe(w).texto.split('\n\n').find(p => p.startsWith(rot)) || '';

// ── 1 · Indicación ───────────────────────────────────────────────
exigir(!w.document.querySelector('#indicacion_libre:not([aria-hidden])') ||
       w.document.getElementById('indicacion_libre').closest('[aria-hidden]') !== null,
    'el texto libre de indicación salió de la pantalla');
exigir(typeof w.agregarIndicacion === 'function', 'se pueden agregar indicaciones nuevas');

// ── 2 · Antecedentes que cambian el estudio ──────────────────────
casoBase(w);
tick('ant_bcri');
let H = w.recolectarHallazgos();
exigir(H.conduccion === 'bcri', 'la casilla de BCRI manda sobre el selector de ECG');
exigir(H.hayConduccion && H.wmsiExcluyeSeptales, 'BCRI excluye los septales del WMSI');
exigir(!H.stInterpretable, 'BCRI deja el ST no interpretable');
exigir(w.document.getElementById('ecg_conduccion').value === 'bcri',
    'y el selector del bloque de ECG queda sincronizado');
tick('ant_bcri', false);

// Cirugía previa: misma exclusión septal, pero el ST SÍ es interpretable
['ant_crm', 'ant_rva', 'ant_rvm'].forEach(id => {
    tick(id);
    H = w.recolectarHallazgos();
    exigir(H.cirugiaPrevia && H.hayConduccion, `${id} excluye los septales`);
    exigir(H.causaSeptal === 'postquirurgico', `${id} por causa post-quirúrgica`);
    exigir(H.stInterpretable, `${id} NO invalida el ST: eso lo hace la activación eléctrica`);
    tick(id, false);
});

// Bicúspide: abre el módulo de EAo y sale en antecedentes
tick('ant_bicuspide');
H = w.recolectarHallazgos();
exigir(H.valvBicuspide === 'si', 'la casilla de bicúspide se lee');
exigir(H.eaoEjEnUso || /bicúspide/i.test(linea('Antecedentes:')),
    'la bicúspide sale en antecedentes');
tick('ant_bicuspide', false);

// ── 4 · Carga por etapa y METs del ACSM ──────────────────────────
// En ventana limpia: casoBase escribe los METs a mano y eso los marca como
// corregidos, que es justo lo que impide el recálculo.
const wc = cargarApp();
const setc = (id, v) => { const e = wc.document.getElementById(id); e.value = v;
    e.dispatchEvent(new wc.Event('change', { bubbles: true })); };
setc('peso', 80); setc('ej_protocolo', 'astrand');
setc('ej_etapa', 4); wc.calcCargaYMets();
exigir(wc.document.getElementById('ej_carga').value === '600',
    `etapa 4 en Astrand son 600 Kgm/min y dio ${wc.document.getElementById('ej_carga').value}`);
const mets = parseFloat(wc.document.getElementById('ej_mets').value);
exigir(Math.abs(mets - 5.8) < 0.2, `600 Kgm/min con 80 kg son ~5,8 METs y dio ${mets}`);
exigir(wc.document.getElementById('ej_causa_detencion').value === 'fatiga',
    'la causa de detención arranca en fatiga');
// Y si se escriben a mano, la app deja de recalcularlos.
const e = wc.document.getElementById('ej_mets');
e.value = 11; e.dispatchEvent(new wc.Event('input', { bubbles: true }));
setc('ej_etapa', 2); wc.calcCargaYMets();
exigir(wc.document.getElementById('ej_mets').value === '11',
    'unos METs puestos a mano no los pisa el recálculo');

// ── 5 · Diastólico de esfuerzo, criterio ASE 2016 ────────────────
const diast = (f) => { ['e_onda_rep','e_prima_rep','e_prima_lat_rep','e_onda_est',
    'e_prima_est','e_prima_lat_est','vrt_est'].forEach(id => set(id, '')); f();
    return w.evaluarDiastolicoEsfuerzo(); };
exigir(diast(() => { set('e_onda_est',120); set('e_prima_est',7); set('e_prima_lat_est',9);
    set('vrt_est',3.0); set('e_prima_rep',6); }).clave === 'positivo',
    'las tres condiciones dan positivo');
exigir(diast(() => { set('e_onda_est',120); set('e_prima_est',7); set('e_prima_lat_est',9);
    set('vrt_est',3.0); set('e_prima_rep',9); }).clave === 'indeterminado',
    "sin e' septal bajo no es positivo");
exigir(diast(() => { set('e_onda_est',90); set('e_prima_est',12); set('e_prima_lat_est',14);
    set('e_prima_rep',9); }).clave === 'insuficiente',
    'sin VRT son datos insuficientes, NUNCA negativo');
exigir(diast(() => { set('vrt_est',2.2); }).clave === 'insuficiente',
    "sin E/e' post, ídem");
exigir(diast(() => { set('e_onda_est',120); set('e_prima_est',7); set('vrt_est',3.0);
    set('e_prima_rep',6); }).clave === 'positivo',
    'sólo septal usa el corte de 15');

// ── 6 · Los segmentos arrancan en verde, sin perder la protección ─
const w2 = cargarApp();
const WM2 = w2.eval('WM');
exigir([...Array(17)].every((_, i) => WM2.reposo[i + 1] === 1 && WM2.estres[i + 1] === 1),
    'los 17 segmentos arrancan en normal en las dos fases');
casoBase(w2);
let H2 = w2.recolectarHallazgos();
exigir(H2.motilidadSinConfirmar, 'sin tocar el bull\'s eye, la motilidad no está confirmada');
exigir(w2.elegirRama(H2) === 'noConcluyente',
    'y el informe no puede salir negativo sin que nadie haya mirado la motilidad');
w2.setScore(1, 'reposo', 1);
H2 = w2.recolectarHallazgos();
exigir(!H2.motilidadSinConfirmar && w2.elegirRama(H2) === 'negativa',
    'con un solo gesto sobre el bull\'s eye el estudio ya es valorable');

// ── 7 · Lo que salió de la pantalla sigue cargado y sigue saliendo ─
// Un campo oculto tiene que seguir existiendo en el documento, seguir guardándose y
// seguir apareciendo en la salida del estudio que lo trae.
const oculto = id => {
    const e = w.document.getElementById(id);
    return !!e && e.closest('[aria-hidden="true"]') !== null;
};
['ant_dm','ant_tabaquismo','ant_dislipemia','ant_isquemia','ant_fa','ant_epoc',
 'ant_mcd','ant_valv'].forEach(id =>
    exigir(oculto(id), `${id} salió de la pantalla sin borrarse`));
exigir(!oculto('ant_hta'),
    'la HTA se queda a la vista: cambia cómo se lee una respuesta hipertensiva');
['fevi_recup','mot_recup','mot_recup_tiempo','ecg_st_aparicion','ecg_st_resolucion']
    .forEach(id => exigir(oculto(id), `${id} salió de la pantalla sin borrarse`));
exigir(!oculto('delta_fevi'),
    'el ΔFEy reposo→pico se queda: avisa de la caída de FEy, que sí cambia el informe');

// Las pestañas de los módulos que no alimentan nada quedan ocultas, con sus campos
// intactos: un estudio guardado con esa pestaña activa la vuelve a abrir.
['cfr','strain','mch'].forEach(t => {
    const btn = Array.from(w.document.querySelectorAll('.special-tab'))
        .find(b => (b.getAttribute('onclick') || '').includes(`'${t}'`));
    exigir(btn && btn.style.display === 'none', `la pestaña de ${t} está oculta`);
    exigir(w.document.getElementById('panel-' + t), `pero el panel de ${t} sigue en el documento`);
});
['cfr_vel_basal','strain_gls_rep','mch_grad_reposo'].forEach(id =>
    exigir(w.document.getElementById(id), `${id} no se borró`));

// Un estudio viejo con factores de riesgo los sigue mostrando y los sigue sacando.
const w3 = cargarApp();
casoBase(w3);
w3.document.getElementById('ant_dm').checked = true;
w3.document.getElementById('ant_tabaquismo').checked = true;
w3.renderAntecedentesHeredados();
const heredados = w3.document.getElementById('antecedentes-heredados');
exigir(heredados.style.display === 'block' && /Diabetes/i.test(heredados.innerHTML),
    'un estudio que trae factores de riesgo los muestra en el bloque de heredados');
exigir(/diabetes/i.test(w3.recolectarHallazgos().antecedentes.join(', ')),
    'y los sigue sacando en la línea de antecedentes del informe');

// Lo oculto se sigue guardando: captureFields recorre el documento, no la pantalla.
const guardados = w3.captureFields();
exigir(guardados.ant_dm === true && 'mot_recup' in guardados && 'fevi_recup' in guardados,
    'los campos ocultos se siguen guardando con el estudio');

// Ningún id repetido: dos campos con el mismo id hacen que captureFields() guarde el
// último, y el último era la copia vacía del bloque oculto. Lo escrito se perdía.
const ids = {};
w.document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
const repetidos = Object.keys(ids).filter(k => ids[k] > 1);
exigir(repetidos.length === 0, `ids repetidos en el documento: ${repetidos.join(', ')}`);

// Lo escrito en notas privadas sobrevive a un guardado.
const w8 = cargarApp();
w8.document.getElementById('notas_privadas').value = 'paciente con mala ventana';
exigir(w8.captureFields().notas_privadas === 'paciente con mala ventana',
    'las notas privadas se guardan con lo que se escribió');

// ── 8 · METs de la ergometría ────────────────────────────────────
const w4 = cargarApp();
const set4 = (id, val) => { const e = w4.document.getElementById(id); e.value = val;
    e.dispatchEvent(new w4.Event('input', { bubbles: true }));
    e.dispatchEvent(new w4.Event('change', { bubbles: true })); };
set4('peso', 80); set4('ej_protocolo', 'astrand'); set4('ej_etapa', 4);
w4.calcCargaYMets();
exigir(Math.abs(parseFloat(w4.document.getElementById('ej_mets').value) - 5.8) < 0.2,
    'sin el dato de la ergometría manda la fórmula del ACSM');
set4('ej_mets_ergo', 9.2);
exigir(w4.document.getElementById('ej_mets').value === '9.2',
    'cargada la ergometría, el informe usa ese valor');
exigir(w4.recolectarHallazgos().mets === 9.2,
    'y el motor del informe lee los METs de la ergometría');
// Y manda incluso sobre unos METs escritos a mano antes.
const w5 = cargarApp();
const set5 = (id, val) => { const e = w5.document.getElementById(id); e.value = val;
    e.dispatchEvent(new w5.Event('input', { bubbles: true }));
    e.dispatchEvent(new w5.Event('change', { bubbles: true })); };
set5('peso', 80); set5('ej_protocolo', 'astrand'); set5('ej_etapa', 4);
set5('ej_mets', 11);
set5('ej_mets_ergo', 7.4);
exigir(w5.document.getElementById('ej_mets').value === '7.4',
    'el dato de la ergometría manda sobre unos METs escritos a mano');
// Borrarlo devuelve el cálculo a la fórmula.
set5('ej_mets_ergo', '');
exigir(Math.abs(parseFloat(w5.document.getElementById('ej_mets').value) - 5.8) < 0.2,
    'y al borrarlo vuelve la fórmula del ACSM');

// ── 9 · "Todo normal" también confirma la motilidad ──────────────
const w6 = cargarApp();
casoBase(w6);
exigir(w6.recolectarHallazgos().motilidadSinConfirmar,
    'recién cargado, el estudio todavía no tiene la motilidad confirmada');
// Y mientras no está confirmada, el bloque de Esfuerzo no puede afirmar que no hubo
// alteraciones nuevas: los 17 segmentos están en el valor inicial, no en uno visto.
const esfSin = informe(w6).texto.split('\n\n').find(p => p.startsWith('Esfuerzo:')) || '';
exigir(!/no se observaron nuevas alteraciones/i.test(esfSin),
    'sin motilidad registrada, el informe no afirma que no hubo alteraciones nuevas');
exigir(/no se consignó la motilidad/i.test(esfSin),
    'y dice que no se consignó');
w6.setAllNormal('reposo');
exigir(!w6.recolectarHallazgos().motilidadSinConfirmar,
    '"Todo normal" cuenta como gesto sobre el bull\'s eye');

// Un preset trae la motilidad ya cargada: cuenta como leída, como el historial.
const w7 = cargarApp();
w7.applyPreset('isquemia_da');
exigir(!w7.recolectarHallazgos().motilidadSinConfirmar,
    'un preset que carga la motilidad entera la deja confirmada');
exigir(w7.elegirRama(w7.recolectarHallazgos()) === 'positivaUnico',
    'y el preset de isquemia de DA vuelve a salir positivo');

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
