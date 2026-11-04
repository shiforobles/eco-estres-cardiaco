// Antecedentes v2.4 (03/11/2026): digoxina, cronotrópico negativo, preexcitación,
// FA en el estudio, y la valvulopatía que se abre sólo con EAo o bicúspide.
const { cargarApp, casoBase, todoNormal, informe } = require('./harness');
const w = cargarApp();
const d = w.document;
let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };
const tick = (id, v = true) => { const e = d.getElementById(id); e.checked = v;
    e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const fresco = () => { casoBase(w); todoNormal(w); w.autocompletarInterpretacion(); };

// ── Digoxina: el ST deja de servir ──
fresco();
d.getElementById('ecg_st_tipo').value = 'infra';
d.getElementById('ecg_st_morfologia').value = 'horizontal';
d.getElementById('ecg_st_mm').value = '2';
let H = w.recolectarHallazgos();
exigir(H.stInterpretable && H.stIsquemico, 'sin digoxina el infradesnivel cuenta');
tick('ant_digoxina');
H = w.recolectarHallazgos();
exigir(!H.stInterpretable && !H.stIsquemico, 'con digoxina el ST no es interpretable ni isquémico');
let t = informe(w).texto;
exigir(/tratamiento con digoxina/.test(t), 'el informe lo dice');
exigir(/No valorable para isquemia por el tratamiento con digoxina/.test(t), 'en la línea de ECG post');
tick('ant_digoxina', false);
d.getElementById('ecg_st_tipo').value = '';

// ── Cronotrópico negativo: como el betabloqueo, con su nombre ──
fresco();
d.getElementById('esf_max_fc').value = '110';   // submáximo
w.calcEjercicio();
tick('ant_betabloq');
const conBB = informe(w).texto;
exigir(/bajo tratamiento betabloqueante/.test(conBB), 'betabloqueo: frase de siempre');
tick('ant_betabloq', false);
tick('ant_crononeg');
H = w.recolectarHallazgos();
exigir(H.frenoFC && !H.betabloqueante, 'cronotrópico negativo frena la FC sin marcarse como betabloqueo');
const conCN = informe(w).texto;
exigir(/bajo tratamiento cronotrópico negativo/.test(conCN) && !/betabloqueante/.test(conCN),
    'el informe nombra el cronotrópico negativo y no el betabloqueo');
exigir(conCN.replace(/cronotrópico negativo/g, 'betabloqueante') === conBB,
    'fuera del nombre del fármaco, el texto es el mismo que con betabloqueo');
tick('ant_crononeg', false);

// ── Preexcitación: misma lógica que BCRI ──
fresco();
tick('ant_preexcitacion');
H = w.recolectarHallazgos();
exigir(d.getElementById('ecg_conduccion').value === 'preexcitacion', 'sincroniza el ECG');
exigir(H.conduccionLimita && !H.stInterpretable && H.wmsiExcluyeSeptales, 'septum fuera y ST no interpretable');
tick('ant_preexcitacion', false);
exigir(d.getElementById('ecg_conduccion').value === 'ninguno', 'destildar la saca');

// ── FA en el estudio: sin algoritmo diastólico estándar ──
fresco();
['e_onda_rep:90', 'a_onda_rep:60', 'e_prima_rep:5', 'e_prima_lat_rep:7', 'vrt_rep:3', 'volvi_reposo:80',
 'peso:80', 'altura:170', 'e_onda_est:120', 'e_prima_est:6', 'vrt_est:3.3'].forEach(x => {
    const [id, val] = x.split(':'); d.getElementById(id).value = val; });
w.calcDiastolico(); w.autocompletarInterpretacion();
const sinFA = informe(w).texto;
exigir(/Estudio diastólico de esfuerzo: Positivo/i.test(sinFA) || /diastólico de esfuerzo/i.test(sinFA),
    'en ritmo sinusal el diastólico se evalúa');
tick('ant_fa_ritmo');
w.autocompletarInterpretacion();
exigir(d.getElementById('ecg_ritmo').value === 'fa', 'la casilla pone el ritmo de base en FA');
const conFA = informe(w).texto;
exigir(/en fibrilación auricular el algoritmo diastólico estándar no se aplica/.test(conFA), 'reposo: no se gradúa');
exigir(/Estudio diastólico de esfuerzo: no aplicable en fibrilación auricular/.test(conFA), 'esfuerzo: no aplicable');
exigir(!/disfunción diastólica grado/i.test(conFA), 'no aparece ningún grado');
exigir(d.getElementById('diast_resultado').value === 'no_evaluado', 'el resultado queda no evaluado');
tick('ant_fa_ritmo', false);
exigir(d.getElementById('ecg_ritmo').value === 'sinusal', 'destildar vuelve a sinusal');
// FA previa (la casilla vieja, oculta) NO es ritmo actual
d.getElementById('ant_fa').checked = true;
exigir(!w.enFibrilacionAuricular(), 'el antecedente de FA previa no apaga el algoritmo');
d.getElementById('ant_fa').checked = false;

// ── Valvulopatía: oculta hasta tildar EAo o bicúspide ──
fresco();
const bloque = d.getElementById('bloque-valvulopatia');
w.pintarBloqueValvulopatia();
exigir(bloque.hidden, 'sin EAo ni bicúspide, oculta');
const eao = d.getElementById('ant_eao');
tick('ant_eao');
exigir(!bloque.hidden && d.getElementById('valv_tipo').value === 'eao', 'EAo la abre con el tipo cargado');
tick('ant_eao', false);
exigir(bloque.hidden && d.getElementById('valv_tipo').value === '', 'destildar la cierra');
tick('ant_bicuspide');
exigir(!bloque.hidden, 'bicúspide también la abre');
tick('ant_bicuspide', false);
d.getElementById('prev_vmax').value = '3.1';
w.pintarBloqueValvulopatia();
exigir(!bloque.hidden, 'con datos de estudio previo se ve igual: no se esconde lo que alimenta el informe');
w.resetFormulario();
exigir(d.getElementById('prev_vmax').value === '' && d.getElementById('prev_fecha').value === '' && bloque.hidden,
    'BORRAR TODO limpia también la fecha del estudio previo');

if (fallas) { console.log(`\n${fallas} falla(s)`); process.exit(1); }
console.log('Sin fallas — antecedentes v2.4: digoxina, cronotrópico negativo, WPW, FA y valvulopatía');
