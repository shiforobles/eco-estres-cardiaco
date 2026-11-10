// Tanda de motilidad (super prompt v2 de Lucas, 04/11/2026): los 19 casos probados
// en la app real, con lo que cada uno tiene que decir y lo que no puede decir.
const h = require('./harness');
const { CASOS, armar } = require('./casos-motilidad-def');
const w = h.cargarApp();
let fallas = 0, n = 0;
const exigir = (c, m) => { n++; if (!c) { console.log('✗ ' + m); fallas++; } };

// ── Clasificación de un segmento ──
const cls = (r, e) => w.classifyResponse(r, e).key;
exigir(cls(1, 2) === 'isquemia', 'normal → cualquier grado: isquemia');
exigir(cls(2, 3) === 'cicatriz', 'hipoquinesia leve → moderada: sin cambio significativo');
exigir(cls(3, 2) === 'cicatriz', 'moderada → leve: tampoco es mejoría');
exigir(cls(3, 4) === 'isquemia_necrosis' && cls(2, 4) === 'isquemia_necrosis', 'hipoquinesia → aquinesia: progresión');
exigir(cls(4, 5) === 'isquemia_necrosis', 'aquinesia → disquinesia: progresión');
exigir(cls(5, 4) === 'cicatriz', 'disquinesia → aquinesia: sin cambio, no mejoría');
exigir(cls(4, 3) === 'viable' && cls(5, 2) === 'viable' && cls(3, 1) === 'viable', 'bajar de categoría: mejoría');
[[2, 1], [4, 2], [3, 1]].forEach(([r, e]) =>
    exigir(!/viabilidad/i.test(w.classifyResponse(r, e).label), 'la etiqueta de mejoría no interpreta viabilidad'));

const R = {};
CASOS.forEach(c => { R[c.n] = armar(w, h, c); });
const rep = k => R[k].piezas.reposoEco, esf = k => R[k].piezas.esfuerzo, con = k => R[k].piezas.conclusion;
const todo = k => R[k].texto;

// ── Reglas comunes a los 19 ──
CASOS.forEach(c => {
    const r = R[c.n];
    exigir(!/territorios? (DA|CD|Cx)|arteria (descendente|coronaria derecha|circunfleja)/.test(rep(c.n) + esf(c.n)),
        `${c.n}: el vaso sólo va en la conclusión`);
    exigir(!/compatible con viabilidad|en dicho territorio|revascularización/.test(todo(c.n)), `${c.n}: frases retiradas`);
    exigir(!/(apical|ápex)[^.]*\b(apical|ápex)[^.]*\b(apical|ápex)/.test(rep(c.n)) || c.n === 18, `${c.n}: el ápex no se repite`);
    exigir(!w.incoherenciasInforme(r.texto, r.H).length, `${c.n}: guarda de coherencia`);
    exigir(!/1 puntos/.test(todo(c.n)), `${c.n}: "1 punto" en singular`);
    if (!r.H.infartoPrevio) exigir(!/evento previo|secuela de infarto/.test(todo(c.n)), `${c.n}: sin infarto cargado no se atribuye causa`);
    exigir((con(c.n).match(/territorios? (DA|CD|Cx)/g) || []).length <= 2, `${c.n}: el territorio no se repite en la conclusión`);
});

// ── Caso por caso ──
exigir(R[1].rama === 'positivaUnico' && /en territorio DA\./.test(con(1)), '1: positivo DA');
exigir(/Nueva hipoquinesia moderada/.test(esf(1)) && !/segmentos anterior medio, anteroseptal medio/.test(esf(1)), '1: por pared');
exigir(R[2].rama === 'positivaUnico' && /Nueva hipoquinesia leve anterolateral a nivel basal y medio/.test(esf(2)) && /territorio Cx/.test(con(2)), '2: anterolateral');
exigir(R[3].rama === 'secuela' && /alteración basal en territorio DA no se modificó/.test(con(3)), '3: fija DA sin causa');
exigir(/Aquinesia inferior a nivel basal y medio/.test(rep(4)) && /territorio CD/.test(con(4)), '4: aquinesia inferior');
exigir(/territorios CD y Cx/.test(con(5)) && /hipoquinesia moderada inferolateral/.test(rep(5)), '5: dos territorios fijos');
exigir(R[6].rama === 'negativa' && /asincronía de las paredes anteroseptal e inferoseptal/.test(rep(6)), '6: BCRI, septum fuera');
exigir(R[7].rama === 'secuela' && /territorio Cx/.test(con(7)) && /bloqueo completo de rama izquierda/.test(con(7)), '7: BCRI + fija');
exigir(R[8].rama === 'dilatada' && /Hipoquinesia global/.test(rep(8)), '8: dilatada con la FEy cargada después');
const antes8 = armar(w, h, CASOS.find(c => c.n === 8), { feyAntes: true });
exigir(antes8.texto === R[8].texto, '8: cargar la FEy antes o después da el mismo informe');
exigir(!/resto de los segmentos/.test(esf(8)) && !/ápex/.test(rep(8)), '8: sin "resto de los segmentos" ni ápex repetido');
exigir(R[9].rama === 'secuela' && R[9].H.aislados.length === 1 && !R[9].H.isquemicos.length, '9: un segmento nuevo no es isquemia');
exigir(/secuela de infarto previo/.test(con(9)) && /hallazgo aislado de significado incierto/.test(con(9)) && !/territorio Cx|positiva/.test(con(9)),
    '9: nombra la secuela DA y el hallazgo aislado, sin positivo ni Cx');
exigir(!/sin nuevas alteraciones/.test(esf(9)), '9: no dice "sin nuevas alteraciones"');
exigir(R[10].rama === 'positivaMulti' && /territorios DA y CD/.test(con(10)), '10: multivaso');
exigir(!/alto riesgo|multiterritorial/.test(esf(10)), '10: la interpretación va sólo en la conclusión');
exigir(R[11].rama === 'positivaUnico' && /Progresión de hipoquinesia a aquinesia inferior/.test(esf(11)) && !/Nueva aquinesia/.test(esf(11)),
    '11: progresión, no "nueva"');
exigir(/en territorio CD con alteración basal/.test(con(11)), '11: isquemia en territorio con alteración basal');
exigir(R[12].rama === 'secuela' && !R[12].H.isquemicos.length && /no mostró cambios significativos/.test(esf(12)), '12: leve → moderada sin isquemia');
exigir(R[13].rama === 'positivaUnico' && /de la totalidad del casquete apical/.test(esf(13)) && /en el casquete apical/.test(con(13)), '13: casquete apical');
exigir(!/apical anterior, apical septal/.test(todo(13)) && !/región apical en su totalidad/.test(todo(13)), '13: sin enumerar');
exigir(R[14].rama === 'negativa' && /se normalizó con el esfuerzo/.test(esf(14)) && /alteración basal en territorio CD se normalizó/.test(con(14)),
    '14: negativo que nombra la alteración basal');
exigir(R[15].rama === 'positivaUnico' && /territorio Cx/.test(con(15)), '15: BCRI + isquemia lateral');
exigir(R[16].rama === 'secuela' && !R[16].H.recuperaron.length && !/se normalizó|mejoró con/.test(esf(16) + con(16)), '16: disquinesia → aquinesia no es mejoría');
exigir(R[17].rama === 'positivaUnico' && /territorio CD\./.test(con(17)) && /Alteración basal en territorio DA sin cambios/.test(con(17)),
    '17: positivo CD que nombra la secuela DA');
exigir(/paredes anterior, anteroseptal, inferoseptal e inferior en toda su extensión/.test(rep(18)) && /Δ \+1 punto\)/.test(esf(18)), '18: extenso, por pared');
exigir(/Nueva aquinesia anterior medio-apical, con hipoquinesia leve/.test(esf(19)) && /territorio DA/.test(con(19)), '19: grados mixtos');
[3, 4, 5, 7, 9, 12, 16, 17, 18].forEach(k =>
    exigir((con(k).match(/La ausencia de mejoría con el esfuerzo no descarta miocardio viable\./g) || []).length === 1,
        `${k}: la frase de viabilidad, una vez y tal cual`));

// ── Pantalla ──
const d = w.document;
exigir(!d.getElementById('detalle-segmentos') && !d.getElementById('segments-tbody'), 'la tabla por segmentos se retiró');
exigir(/Criterio propio: un territorio/.test(d.querySelector('.criterio-propio').textContent), 'el criterio propio está declarado en pantalla');
exigir(d.querySelector('label[for="ant_iam"]'), 'Infarto previo se puede tildar');

if (process.argv.includes('--ver')) CASOS.forEach(c => {
    console.log(`\n══ ${c.n}. ${c.t}\nREPOSO: ${rep(c.n)}\nESFUERZO: ${esf(c.n)}\nCONCLUSIÓN: ${con(c.n).replace(/^Conclusión: /, '')}`);
});
if (fallas) { console.log(`\n${fallas} falla(s) de ${n}`); process.exit(1); }
console.log(`Sin fallas — tanda de motilidad: 19 casos, ${n} comprobaciones`);
