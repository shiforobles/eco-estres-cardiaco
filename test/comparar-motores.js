// Los dos textos de motilidad de reposo, para cada caso de la batería.
//
// No es un test con aserciones: es la tabla que se mira antes de decidir si el texto
// de Doppler reemplaza al propio. Se corre con `npm run comparar`.
//
// AVISO: estos casos son RECONSTRUCCIONES armadas con los puntajes descritos, no los
// estudios reales guardados. Para ver los textos de los estudios de verdad está el
// botón del historial, que lee los `wm` que quedaron guardados en el navegador.
const { cargarApp, todoNormal, informe, linea } = require('./harness');

const w = cargarApp();
const WM = w.eval('WM');

const CASOS = [
    ['Todo normal', {}],
    ['Un segmento: anterior medio, hipo leve', { 2: [7] }],
    ['Pared anterior completa, hipo moderada', { 3: [1, 7, 13] }],
    ['Columna anteroseptal basal y media', { 2: [2, 8] }],
    ['Territorio DA, hipo leve', { 2: [1, 2, 7, 8] }],
    ['Territorio CD, aquinesia', { 4: [3, 4, 9, 10, 15] }],
    ['Secuela inferior: 10 y 11 aquinéticos', { 4: [10, 11] }],
    ['Anterior + apical aquinético (12 segmentos)', { 4: [1, 2, 7, 8, 13, 14, 17, 3, 9, 4, 10, 15] }],
    ['Patrón apical completo', { 4: [13, 14, 15, 16, 17] }],
    ['Sólo el ápex, aquinético', { 4: [17] }],
    ['Mezcla: aquinesia apical + hipo leve anterior', { 4: [13, 14, 15, 16], 2: [1, 7] }],
    ['Disquinesia apical sobre aquinesia anterior', { 5: [13, 14], 4: [1, 7] }],
    ['Hipoquinesia difusa (12 segmentos leves)', { 2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }],
    ['Inferolateral 5 y 11 (control de numeración)', { 3: [5, 11] }],
    ['Inferoseptal 3 y 9 (control de numeración)', { 3: [3, 9] }],
];

const cargar = grados => {
    todoNormal(w);
    Object.entries(grados).forEach(([g, ids]) => ids.forEach(id => w.setScore(id, 'reposo', +g)));
};

const frase = () => {
    const { texto } = informe(w);
    const lRep = linea(texto, 'Reposo');
    return (lRep.split('\n\n')[1] || '').split(/(?<=\.)\s+FEy/)[0].trim();
};

const set = (id, v) => {
    const el = w.document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new w.Event('change', { bubbles: true }));
};

let difieren = 0;
CASOS.forEach(([nombre, grados]) => {
    cargar(grados);
    set('motor_texto', 'actual');
    const actual = frase();
    set('motor_texto', 'doppler');
    const doppler = frase();
    console.log(`\n── ${nombre}`);
    console.log(`   actual : ${actual}`);
    console.log(`   Doppler: ${doppler}`);
    if (actual !== doppler) difieren++;
});

set('motor_texto', 'actual');
console.log(`\n${CASOS.length} casos · ${difieren} con texto distinto`);
