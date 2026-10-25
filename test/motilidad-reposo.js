// Punto 3 (sesión anterior): la línea de Reposo tiene que leer el bull's eye de reposo.
const { cargarApp, casoBase, puntajes, todoNormal, informe, linea } = require('./harness');

const w = cargarApp();
casoBase(w);

const casos = [
    { nombre: 'seg 7: reposo 3 → esfuerzo 1 (mejora)', rep: { 7: 3 }, est: { 7: 1 } },
    { nombre: 'seg 8: reposo 2, esfuerzo sin cargar', rep: { 8: 2 }, est: {} },
    { nombre: 'seg 10: reposo 2 → esfuerzo 2 (secuela)', rep: { 10: 2 }, est: { 10: 2 } },
    { nombre: 'secuela 10 + isquemia 1', rep: { 10: 2 }, est: { 10: 2, 1: 2 } },
    { nombre: 'secuelas 10 y 11 + isquemia 1', rep: { 10: 2, 11: 2 }, est: { 10: 2, 11: 2, 1: 2 } },
    { nombre: 'reposo 3 que mejora + isquemia nueva', rep: { 7: 3 }, est: { 7: 1, 1: 2 } },
    { nombre: 'todo normal', rep: {}, est: {} },
    { nombre: 'isquemia pura seg 1 y 2', rep: {}, est: { 1: 2, 2: 2 } },
    { nombre: 'isquemia sobre necrosis seg 10 (2→3)', rep: { 10: 2 }, est: { 10: 3 } },
];

let fallas = 0;
casos.forEach(c => {
    todoNormal(w);
    puntajes(w, c.rep, c.est);
    Object.keys(c.rep).forEach(id => { if (!(id in c.est)) w.setScore(Number(id), 'estres', 0); });
    const { H, texto, incoherencias } = informe(w);

    const lRep = linea(texto, 'Reposo');
    const lEsf = linea(texto, 'Esfuerzo');
    const lMot = linea(texto, 'Motilidad');
    const dice = (t, re) => re.test(t);

    if (H.anormalesReposo.length && dice(lRep, /motilidad parietal normal/i)) {
        console.log(`✗ ${c.nombre}: reposo normal con segmentos anormales`); fallas++;
    }
    if (!H.anormalesReposo.length && !H.patronGlobal && !dice(lRep, /motilidad parietal normal/i)) {
        console.log(`✗ ${c.nombre}: reposo sin anormales y no dice normal`); fallas++;
    }
    if ((H.anormalesReposo.length || H.isquemicos.length) && dice(lMot, /sin segmentos comprometidos/)) {
        console.log(`✗ ${c.nombre}: "sin segmentos comprometidos" con alterados`); fallas++;
    }
    if (H.recuperaron.length && !dice(lEsf, /reserva contráctil regional conservada/)) {
        console.log(`✗ ${c.nombre}: segmento que mejoró no aparece en Esfuerzo`); fallas++;
    }
    if (H.sinParReposo.length && !dice(lEsf, /no puede establecerse su respuesta contráctil/)) {
        console.log(`✗ ${c.nombre}: segmento sin par no aparece en Esfuerzo`); fallas++;
    }
    if (/El segmento[^.]*(modificaron|normalizaron)|Los segmentos[^.]*(modificó|normalizó)/.test(texto)) {
        console.log(`✗ ${c.nombre}: concordancia de número`); fallas++;
    }
    if (incoherencias.length) { console.log(`✗ ${c.nombre}: INCOHERENCIA ${incoherencias.join(' | ')}`); fallas++; }
});

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
