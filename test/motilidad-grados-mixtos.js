// Regresión: la prosa debe conservar qué grado corresponde a cada segmento.
// El selector textual no puede modificar los datos ni el diagnóstico.
const assert = require('node:assert/strict');
const { cargarApp, casoBase, todoNormal, puntajes, set, linea } = require('./harness');

const w = cargarApp();
casoBase(w);
let comprobaciones = 0;
const exigir = (cond, msg) => { assert.ok(cond, msg); comprobaciones++; };

function diagnostico(H, N) {
    return {
        wm: JSON.parse(w.eval('JSON.stringify(WM)')),
        indices: [H.wmsiReposo, H.wmsiEstres, H.deltaWMSI],
        isquemicos: H.isquemicos.map(s => s.id),
        secuelas: H.secuelas.map(s => s.id),
        mejoraron: H.recuperaron.map(s => s.id),
        sinPar: H.sinParReposo.map(s => s.id),
        territorios: [H.territoriosReposo, H.territoriosIsquemia, H.territoriosSecuela],
        rama: N.rama,
        categoria: w.evaluarCategorizacion(),
        conclusion: N.piezas.conclusion
    };
}

const casos = [
    {
        nombre: 'secuela basal de dos grados',
        rep: { 7: 4, 10: 2 }, est: { 7: 4, 10: 2 },
        reposo: 'aquinesia del segmento anterior medio e hipoquinesia leve del segmento inferior medio',
        rama: 'secuela'
    },
    {
        nombre: 'alteración basal que mejora, sin perder sus grados basales',
        rep: { 7: 4, 10: 2 }, est: {},
        reposo: 'aquinesia del segmento anterior medio e hipoquinesia leve del segmento inferior medio',
        rama: 'negativa'
    },
    {
        nombre: 'isquemia de un territorio con grados distintos',
        rep: {}, est: { 1: 4, 7: 2 },
        esfuerzo: 'aquinesia del segmento anterior basal e hipoquinesia leve del segmento anterior medio',
        rama: 'positivaUnico'
    },
    {
        nombre: 'isquemia multiterritorial con grados distintos',
        rep: {}, est: { 1: 4, 4: 2 },
        esfuerzo: 'aquinesia del segmento anterior basal e hipoquinesia leve del segmento inferior basal',
        rama: 'positivaMulti'
    },
    {
        nombre: 'empeoramiento sobre alteración basal',
        rep: { 1: 2 }, est: { 1: 4, 7: 3 },
        esfuerzo: 'aquinesia del segmento anterior basal e hipoquinesia moderada del segmento anterior medio',
        rama: 'positivaUnico'
    },
    {
        nombre: 'mismo grado agrupado y otro grado separado',
        rep: { 1: 4, 7: 4, 10: 2 }, est: { 1: 4, 7: 4, 10: 2 },
        reposo: 'aquinesia de los segmentos anterior basal y anterior medio e hipoquinesia leve del segmento inferior medio',
        rama: 'secuela'
    },
    {
        nombre: 'los dos grados de hipoquinesia se distinguen sin cambiar el WMSI',
        rep: { 1: 2, 7: 3 }, est: { 1: 2, 7: 3 },
        reposo: 'hipoquinesia moderada del segmento anterior medio e hipoquinesia leve del segmento anterior basal',
        rama: 'secuela'
    },
    {
        nombre: 'disquinesia y aquinesia conservadas en el esfuerzo',
        rep: {}, est: { 1: 5, 7: 4 },
        esfuerzo: 'disquinesia del segmento anterior basal y aquinesia del segmento anterior medio',
        rama: 'positivaUnico'
    }
];

for (const c of casos) {
    todoNormal(w);
    puntajes(w, c.rep, c.est);
    set(w, 'motor_texto', 'actual');
    w.autocompletarInterpretacion();
    const H = w.recolectarHallazgos();
    const N = w.construirNarrativa(H);
    exigir(N.rama === c.rama, `${c.nombre}: rama ${N.rama}`);
    if (c.reposo) {
        exigir(N.piezas.reposoEco.toLowerCase().includes(c.reposo),
            `${c.nombre}: el reposo atribuye mal los grados: ${N.piezas.reposoEco}`);
        exigir(w.document.getElementById('comparacion-motilidad').textContent.toLowerCase().includes(c.reposo),
            `${c.nombre}: la vista previa debe usar la misma descripción`);
    }
    if (c.esfuerzo) exigir(linea(N.texto, 'Esfuerzo').toLowerCase().includes(c.esfuerzo),
        `${c.nombre}: el esfuerzo atribuye mal los grados: ${N.piezas.esfuerzo}`);

    const antes = diagnostico(H, N);
    set(w, 'motor_texto', 'doppler');
    w.autocompletarInterpretacion();
    const HD = w.recolectarHallazgos(), ND = w.construirNarrativa(HD);
    assert.deepEqual(diagnostico(HD, ND), antes, `${c.nombre}: el motor textual alteró el diagnóstico`);
    exigir(ND.piezas.esfuerzo === N.piezas.esfuerzo,
        `${c.nombre}: el selector de reposo no debe cambiar el esfuerzo`);
}

// Caso hipotensivo: también debe conservar los grados en la descripción de esfuerzo.
todoNormal(w);
puntajes(w, {}, { 1: 4, 4: 2 });
set(w, 'esf_max_tas', 100);
set(w, 'motor_texto', 'actual');
w.autocompletarInterpretacion();
const H = w.recolectarHallazgos(), N = w.construirNarrativa(H);
exigir(N.rama === 'hipotensiva', 'debe conservarse la rama hipotensiva');
exigir(N.piezas.esfuerzo.includes('aquinesia del segmento anterior basal e hipoquinesia leve del segmento inferior basal'),
    'la rama hipotensiva no debe omitir la correspondencia entre grado y segmento');

console.log(`Sin fallas — 9 casos de grados mixtos, ${comprobaciones} comprobaciones y comparación diagnóstica entre motores`);
w.close();
