// Regresión: la prosa conserva qué grado corresponde a cada grupo de segmentos, y el
// texto sale de UN solo motor (el de eco Doppler), agrupado por pared.
const assert = require('node:assert/strict');
const { cargarApp, casoBase, todoNormal, puntajes, set } = require('./harness');

const w = cargarApp();
casoBase(w);
let comprobaciones = 0;
const exigir = (cond, msg) => { assert.ok(cond, msg); comprobaciones++; };

const GRADOS = { 2: 'hipoquinesia leve', 3: 'hipoquinesia moderada', 4: 'aquinesia', 5: 'disquinesia' };
// Cada grado cargado tiene que estar dicho, y ninguno que no esté cargado.
function conservaGrados(texto, puntajesDe, nombre) {
    const t = texto.toLowerCase();
    const presentes = new Set(Object.values(puntajesDe));
    Object.entries(GRADOS).forEach(([g, palabra]) => {
        if (presentes.has(Number(g))) exigir(t.includes(palabra), `${nombre}: falta "${palabra}" en: ${texto}`);
        else exigir(!t.includes(palabra), `${nombre}: dice "${palabra}" sin estar cargada: ${texto}`);
    });
}

const casos = [
    { nombre: 'alteración basal fija de dos grados', rep: { 7: 4, 10: 2 }, est: { 7: 4, 10: 2 }, rama: 'secuela', mira: 'reposo' },
    { nombre: 'alteración basal que mejora', rep: { 7: 4, 10: 2 }, est: {}, rama: 'negativa', mira: 'reposo' },
    { nombre: 'isquemia de un territorio con grados distintos', rep: {}, est: { 1: 4, 7: 2 }, rama: 'positivaUnico', mira: 'esfuerzo' },
    // Un segmento por territorio: positivo, pero ningún territorio llega a dos.
    { nombre: 'dos segmentos nuevos de territorios distintos', rep: {}, est: { 1: 4, 4: 2 }, rama: 'positivaUnico', mira: 'esfuerzo', sinTerritorio: true },
    { nombre: 'mismo grado agrupado y otro separado', rep: { 1: 4, 7: 4, 10: 2 }, est: { 1: 4, 7: 4, 10: 2 }, rama: 'secuela', mira: 'reposo' },
    { nombre: 'los dos grados de hipoquinesia se distinguen', rep: { 1: 2, 7: 3 }, est: { 1: 2, 7: 3 }, rama: 'secuela', mira: 'reposo' },
    { nombre: 'disquinesia y aquinesia nuevas', rep: {}, est: { 1: 5, 7: 4 }, rama: 'positivaUnico', mira: 'esfuerzo' },
];

for (const c of casos) {
    todoNormal(w);
    puntajes(w, c.rep, c.est);
    w.autocompletarInterpretacion();
    const H = w.recolectarHallazgos();
    const N = w.construirNarrativa(H);
    exigir(N.rama === c.rama, `${c.nombre}: rama ${N.rama}`);
    if (c.mira === 'reposo') conservaGrados(N.piezas.reposoEco.split(' FEy ')[0], c.rep, c.nombre);
    else conservaGrados(N.piezas.esfuerzo.split(' El WMSI')[0], c.est, c.nombre);
    exigir(!/de los segmentos [^.]*,[^.]*,[^.]*,/.test(N.texto), `${c.nombre}: no se enumeran segmentos`);
    if (c.sinTerritorio) {
        exigir(H.territoriosIsquemia.length === 0, `${c.nombre}: ningún territorio con dos segmentos`);
        exigir(/segmentos aislados, sin distribución coronaria definida/.test(N.piezas.conclusion),
            `${c.nombre}: la conclusión no inventa un vaso`);
    }
    // El territorio, una sola vez y sólo en la conclusión.
    exigir(!/territorios? (DA|CD|Cx)|arteria (descendente|coronaria|circunfleja)/i.test(N.piezas.reposoEco + N.piezas.esfuerzo),
        `${c.nombre}: ningún vaso fuera de la conclusión`);
}

// Empeoramiento sobre alteración basal: progresión, no "nueva".
todoNormal(w);
puntajes(w, { 1: 2 }, { 1: 4, 7: 3 });
w.autocompletarInterpretacion();
let H = w.recolectarHallazgos(), N = w.construirNarrativa(H);
exigir(N.rama === 'positivaUnico', 'progresión + nuevo en el mismo territorio: positivo');
exigir(/Nueva hipoquinesia moderada del segmento anterior medio, y progresión de hipoquinesia a aquinesia del segmento anterior basal/.test(N.piezas.esfuerzo),
    'lo nuevo y la progresión se dicen por separado: ' + N.piezas.esfuerzo);
exigir(/en territorio DA, en parte sobre segmentos con alteración basal/.test(N.piezas.conclusion), N.piezas.conclusion);

// Hipotensiva: conserva la correspondencia y nombra el territorio en la conclusión.
todoNormal(w);
puntajes(w, {}, { 1: 4, 7: 2 });
set(w, 'esf_max_tas', 100);
w.autocompletarInterpretacion();
H = w.recolectarHallazgos(); N = w.construirNarrativa(H);
exigir(N.rama === 'hipotensiva', 'debe conservarse la rama hipotensiva');
conservaGrados(N.piezas.esfuerzo.split(', con caída de la FEy')[0], { 1: 4, 7: 2 }, 'hipotensiva');
exigir(/en territorio DA, con respuesta hipotensiva/.test(N.piezas.conclusion), N.piezas.conclusion);

// El selector de motor ya no existe: el campo queda oculto y fijo, por la planilla.
const mt = w.document.getElementById('motor_texto');
exigir(mt && mt.type === 'hidden' && mt.value === 'doppler', 'motor_texto oculto y en doppler');
exigir(!w.document.getElementById('comparacion-motilidad'), 'sin comparación de textos');

console.log(`Sin fallas — grados mixtos con un solo motor: ${comprobaciones} comprobaciones`);
w.close();
