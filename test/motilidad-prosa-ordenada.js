// Redacción de la motilidad en prosa ordenada (Lucas, 18/11/2026): de lo más grave a
// lo más leve; paredes con los mismos niveles juntas y el nivel una sola vez, entre
// paréntesis; pared septal y pared lateral cuando sus dos subdivisiones coinciden.
const { cargarApp } = require('./harness');
const w = cargarApp();
const MD = w.MotilidadDoppler;
let fallas = 0;
const texto = g => {
    const wm = {}; for (let i = 1; i <= 17; i++) wm[i] = 1;
    Object.entries(g).forEach(([s, ids]) => ids.forEach(i => { wm[i] = +s; }));
    return MD.describirFase(wm, null).texto;
};
const CASOS = [
    ['pared anterior entera', { 2: [1, 7, 13] }, 'Hipoquinesia leve de la pared anterior en toda su extensión.'],
    ['inferior basal y medio', { 2: [4, 10] }, 'Hipoquinesia leve de la pared inferior (basal y medio).'],
    ['septum entero (Jiménez)', { 2: [2, 3, 8, 9, 14] }, 'Hipoquinesia leve de la pared septal en toda su extensión.'],
    ['lateral entera', { 2: [5, 6, 11, 12, 16] }, 'Hipoquinesia leve de la pared lateral en toda su extensión.'],
    ['lateral basal y media', { 4: [5, 6, 11, 12] }, 'Aquinesia de la pared lateral (basal y medio).'],
    ['una sola subdivisión septal', { 2: [2, 8] }, 'Hipoquinesia leve de la pared anteroseptal (basal y medio).'],
    ['dos grados', { 4: [4, 10], 2: [5, 11] },
        'Aquinesia de la pared inferior (basal y medio), con hipoquinesia leve de la pared inferolateral (basal y medio).'],
    ['Pardo: anillo apical + 8 segmentos', { 2: [1, 2, 3, 4, 7, 8, 9, 10], 4: [13, 14, 15, 16] },
        'Aquinesia del anillo apical, con hipoquinesia leve de las paredes anterior, septal e inferior (basal y medio).'],
    ['extenso de 12 segmentos', { 4: [1, 2, 7, 8, 13, 14, 17, 3, 9, 4, 10, 15] },
        'Aquinesia de las paredes anterior, septal e inferior en toda su extensión y del ápex.'],
    // Antes el ápex aquinético se pegaba a la hipoquinesia leve.
    ['ápex con su grado', { 4: [7, 13, 17], 2: [1] },
        'Aquinesia de la pared anterior (medio y apical) y del ápex, con hipoquinesia leve de la pared anterior (basal).'],
    ['tres grados', { 5: [13, 17], 4: [7], 2: [1] },
        'Disquinesia de la pared anterior (apical) y del ápex, con aquinesia de la pared anterior (medio) e hipoquinesia leve de la pared anterior (basal).'],
];
CASOS.forEach(([n, g, esperado]) => {
    const t = texto(g);
    if (t !== esperado) { fallas++; console.log(`✗ ${n}\n    dio:      ${t}\n    esperado: ${esperado}`); }
});
console.log(fallas ? `\n${fallas} FALLAS` : `Sin fallas — prosa ordenada de la motilidad: ${CASOS.length} casos`);
if (fallas) process.exit(1);
