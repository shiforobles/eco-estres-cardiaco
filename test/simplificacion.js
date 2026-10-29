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

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
