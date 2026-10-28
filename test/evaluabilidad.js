// "No evaluado" no es "normal".
//
// Con los 17 segmentos en 0 el informe salía "ecocardiográficamente negativa para
// isquemia miocárdica inducible" con riesgo menor al 1 % anual: afirmaba un eco
// negativo sin que se hubiera puntuado un solo segmento.
//
// El corte es POR TERRITORIO: un total global deja pasar un estudio con la
// circunfleja entera sin par si los otros dos están completos, y ese informe saldría
// negativo sin haber mirado Cx.
const { cargarApp, casoBase, todoNormal, informe } = require('./harness');

const w = cargarApp();
const WM = w.eval('WM');
let fallas = 0;
const exigir = (cond, msg) => { if (!cond) { console.log('✗ ' + msg); fallas++; } };

const vaciar = () => { for (let i = 1; i <= 17; i++) { WM.reposo[i] = 0; WM.estres[i] = 0; } };
const sinPar = ids => ids.forEach(id => { WM.estres[id] = 0; });
const concl = () => informe(w).texto.split('\n\n').find(p => p.startsWith('Conclusión:')) || '';

casoBase(w);

// ── Nada cargado ────────────────────────────────────────────────
vaciar();
let H = w.recolectarHallazgos(), r = informe(w);
exigir(H.motilidadNoValorable, 'sin ningún segmento, la motilidad debe ser no valorable');
exigir(r.rama === 'noConcluyente', `la rama debía ser noConcluyente y fue ${r.rama}`);
exigir(!/negativa para isquemia/.test(concl()), 'no puede afirmar un eco negativo sin segmentos');
exigir(!/menor al 1 %/.test(concl()), 'no puede dar la cifra pronóstica sin motilidad');
exigir(w.evaluarCategorizacion().noConcluyente, 'no puede categorizar el riesgo');

// ── segEvaluados cuenta pares reales, no el mínimo de dos conteos ──
vaciar();
[1, 2, 3, 4, 5, 6].forEach(id => { WM.reposo[id] = 1; });
[7, 8, 9, 10, 11, 12].forEach(id => { WM.estres[id] = 1; });
H = w.recolectarHallazgos();
exigir(H.segEvaluados === 0,
    `con 6 puntuados en reposo y 6 distintos en esfuerzo los pares son 0, y dio ${H.segEvaluados}`);

// ── Un territorio entero sin par: el estudio sale, con la limitación ──
todoNormal(w);
sinPar([5, 6, 11, 12, 16]);          // toda la circunfleja
H = w.recolectarHallazgos(); r = informe(w);
exigir(!H.motilidadNoValorable, 'con DA y CD completos el estudio sigue siendo valorable');
exigir(H.territoriosNoEvaluables.join() === 'Cx', `no evaluables debía ser Cx y fue ${H.territoriosNoEvaluables}`);
exigir(r.rama === 'negativa', `la rama debía seguir siendo negativa y fue ${r.rama}`);
exigir(/La valoración se limita a/.test(concl()), 'falta declarar a qué territorios se limita');
exigir(/circunfleja no pudo valorarse/.test(concl()), 'falta nombrar el territorio no valorado');
exigir(!/menor al 1 %/.test(concl()), 'la cifra de <1 % exige los tres territorios evaluables');

// ── Un solo segmento sin par NO invalida el territorio ──
todoNormal(w);
sinPar([5]);
H = w.recolectarHallazgos();
exigir(!H.territoriosNoEvaluables.length,
    `un solo segmento sin par no invalida el territorio, y marcó ${H.territoriosNoEvaluables}`);
exigir(/menor al 1 %/.test(concl()), 'con los tres territorios evaluables la cifra sí corresponde');

// ── Dos segmentos sin par sí lo invalidan (el corte) ──
todoNormal(w);
sinPar([5, 6]);
H = w.recolectarHallazgos();
exigir(H.territoriosNoEvaluables.join() === 'Cx',
    `con ${w.eval('SIN_PAR_MAX_POR_TERRITORIO')} segmentos sin par el territorio no es evaluable`);

// ── El ápex no cuenta para ningún territorio ──
todoNormal(w);
sinPar([17]);
H = w.recolectarHallazgos();
exigir(!H.territoriosNoEvaluables.length,
    'el ápex no tiene vaso asignado: no puede invalidar un territorio');

// ── Los tres territorios caídos ──
todoNormal(w);
sinPar([1, 2, 7, 8, 3, 4, 9, 10, 5, 6, 11, 12]);
H = w.recolectarHallazgos(); r = informe(w);
exigir(H.motilidadNoValorable, 'sin ningún territorio evaluable la motilidad no es valorable');
exigir(r.rama === 'noConcluyente', `la rama debía ser noConcluyente y fue ${r.rama}`);

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
