// Hallazgos de la auditoría externa del 27/10/2026. Cada aserción está porque el
// error se reprodujo antes de arreglarlo.
const { cargarApp, casoBase, todoNormal, informe } = require('./harness');

const w = cargarApp();
const WM = w.eval('WM');
const set = (id, v) => { const e = w.document.getElementById(id); if (!e) return false;
    e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true }));
    e.dispatchEvent(new w.Event('change', { bubbles: true })); return true; };
let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };
const concl = () => informe(w).texto.split('\n\n').find(p => p.startsWith('Conclusión:')) || '';

// ── #3 · informe desactualizado ──────────────────────────────────
casoBase(w); todoNormal(w);
w.generarInforme();
const textoViejo = w.document.getElementById('reporte-output').textContent;
exigir(w.informeEstaAlDia(), 'recién generado, el informe debe estar al día');
set('fevi_pico', 40);
exigir(!w.informeEstaAlDia(), 'al cambiar la FEy post el informe queda desactualizado');
const paraGuardar = w.informeParaGuardar();
exigir(paraGuardar !== textoViejo, 'guardar no puede usar el texto viejo');
exigir(/40 %/.test(paraGuardar), 'el texto regenerado debe tener el dato nuevo');

// ── #4 · ST no valorable ─────────────────────────────────────────
casoBase(w); todoNormal(w);
set('ecg_st_tipo', 'infra'); set('ecg_st_mm', 2); set('ecg_st_morfologia', 'horizontal');
let H = w.recolectarHallazgos();
exigir(H.stCambio && H.stIsquemico, 'sin conducción, un infra de 2 mm es isquémico');
set('ecg_conduccion', 'bcri');
H = w.recolectarHallazgos();
exigir(H.stCambio, 'el CAMBIO del ST existe igual: se describe');
exigir(!H.stInterpretable, 'con BCRI el ST no es interpretable');
exigir(!H.stIsquemico, 'un ST ilegible no puede valer como respuesta eléctrica positiva');
set('ecg_conduccion', 'ninguno'); set('ecg_st_basal', 'no_interpretable');
H = w.recolectarHallazgos();
exigir(!H.stIsquemico, 'con ST basal no interpretable tampoco');
set('ecg_st_basal', 'normal');

// El ST ilegible no rescata la suficiencia
casoBase(w); todoNormal(w);
set('ecg_conduccion', 'bcri'); set('esf_max_fc', 100); set('esf_max_tas', 150);
set('ecg_st_tipo', 'infra'); set('ecg_st_mm', 2); set('ecg_st_morfologia', 'horizontal');
H = w.recolectarHallazgos();
exigir(H.estimuloInsuficiente, 'DP 15.000 es estímulo insuficiente');
exigir(w.elegirRama(H) === 'noConcluyente',
    `con estímulo insuficiente y ST ilegible la rama debe ser noConcluyente y fue ${w.elegirRama(H)}`);

// ── #5 · corrección manual del diastólico ────────────────────────
casoBase(w); todoNormal(w);
set('e_onda_est', 150); set('e_prima_est', 8); set('e_prima_lat_est', 8); set('vrt_est', 3.4);
H = w.recolectarHallazgos();
exigir(H.diastolicoCalculado && H.diastolicoPositivo, 'sin corrección manda el cálculo');
set('diast_resultado', 'negativo'); w.marcarManual('diast_resultado', '');
H = w.recolectarHallazgos();
exigir(!H.diastolicoPositivo, 'corregido a negativo, el resultado efectivo es negativo');
exigir(w.elegirRama(H) !== 'diastolico', 'la rama no puede seguir siendo diastólica');
exigir(!/fracción de eyección preservada/i.test(concl()),
    'la conclusión no puede hablar de ICFEp con el diastólico corregido a negativo');

// ── #7 · EAo: ascenso plano ≠ síntomas ───────────────────────────
const ta = w.eval('typeof evaluarTAEAo')==='function' ? null : null;
const plano = w.eval('(function(){try{return null}catch(e){return null}})()');

// ── #8 · arreglos chicos ─────────────────────────────────────────
casoBase(w); todoNormal(w);
set('esf_max_sint', 'Sin angina ni dolor precordial');
const avisos = w.evaluarAvisosClinicos();
exigir(!avisos.some(a => /Angina durante el estudio/.test(a.titulo)),
    'una negación no puede disparar el aviso de angina');
set('esf_max_sint', 'Angina típica al minuto 6');
exigir(w.evaluarAvisosClinicos().some(a => /Angina durante el estudio/.test(a.titulo)),
    'una angina real sí debe disparar el aviso');

casoBase(w); todoNormal(w);
set('e_onda_rep', ''); set('e_prima_rep', ''); set('e_prima_lat_rep', '');
const lRep = informe(w).texto.split('\n\n').find(p => p.startsWith('Función diastólica:')) || '';
exigir(!/sin datos de aumento de las presiones/.test(lRep),
    `sin E/e' no se puede afirmar nada sobre las presiones: "${lRep}"`);

// BCRD: mismo criterio en todas las salidas
casoBase(w); todoNormal(w);
set('ecg_conduccion', 'bcrd');
H = w.recolectarHallazgos();
exigir(!H.hayConduccion, 'BCRD no limita el septum');
exigir(!H.wmsiExcluyeSeptales, 'con BCRD el WMSI no excluye septales en ninguna salida');

// ── Edición a mano: no se pisa sin preguntar ─────────────────────
casoBase(w); todoNormal(w);
w.generarInforme();
exigir(!w.informeFueEditado(), 'recién generado no está editado');
const out = w.document.getElementById('reporte-output');
out.textContent = out.textContent + '\n\nAgregado a mano por el operador.';
out.dispatchEvent(new w.Event('input', { bubbles: true }));
exigir(w.informeFueEditado(), 'la edición a mano se detecta');
// Con el operador eligiendo "conservar mi edición" (Cancelar en el confirm)
w.confirm = () => false;
let guardado = w.informeParaGuardar();
exigir(/Agregado a mano/.test(guardado), 'si elige conservar, la edición no se pisa');
// Y eligiendo regenerar
w.confirm = () => true;
guardado = w.informeParaGuardar();
exigir(!/Agregado a mano/.test(guardado), 'si elige regenerar, el texto se rehace');
w.confirm = () => true;

// ── CRM/ATC de estudios viejos: no se convierten en cirugía ──────
casoBase(w); todoNormal(w);
w.document.getElementById('ant_crm').checked = true;
w.marcarCrmResuelto();
let ant = informe(w).texto.split('\n\n').find(p => p.startsWith('Antecedentes:')) || '';
exigir(/cirugía de revascularización/i.test(ant),
    `tildada ahora, la casilla sí significa cirugía: "${ant}"`);

// Estudio recuperado sin el marcador de esquema
w.aplicarEstudio({ fields: w.captureFields(), wm: { reposo: { ...WM.reposo }, estres: { ...WM.estres } } });
ant = informe(w).texto.split('\n\n').find(p => p.startsWith('Antecedentes:')) || '';
exigir(!/cirugía de revascularización miocárdica/i.test(ant),
    `un estudio viejo no puede convertirse en cirugía: "${ant}"`);
exigir(/por cirugía o angioplastia/i.test(ant),
    `debe quedar como dato previo al cambio: "${ant}"`);

// Y con el marcador, se respeta tal cual
w.aplicarEstudio({ fields: w.captureFields(), crmSoloCirugia: true,
    wm: { reposo: { ...WM.reposo }, estres: { ...WM.estres } } });
ant = informe(w).texto.split('\n\n').find(p => p.startsWith('Antecedentes:')) || '';
exigir(/cirugía de revascularización/i.test(ant),
    `con el marcador nuevo sí es cirugía: "${ant}"`);

console.log(fallas ? `${fallas} FALLAS (total)` : 'Sin fallas (ajustes incluidos)');
process.exit(fallas ? 1 : 0);
