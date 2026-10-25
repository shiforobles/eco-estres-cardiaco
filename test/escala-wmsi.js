// ¿Cuántos casos cambian de categoría con el WMSI en escala ASE (1-4)?
// No toca el código: parchea calcWMSI en caliente y compara sobre el MISMO caso.
const { cargarApp, set, casoBase, todoNormal } = require('./harness');
const w = cargarApp();
const rnd = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// ASE: 1 normal · 2 hipoquinesia (leve y moderada) · 3 aquinesia · 4 disquinesia
const ASE = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4 };
// WM y SEGMENTS son `const` de script: no están en window, pero el eval global sí
// los alcanza.
const WM = w.eval('WM');
const original = w.calcWMSI;
function calcWMSIase(stateKey, excluir) {
    // SEGMENTS es un `const` de script y no está en window: se usan los ids 1-17,
    // que es exactamente el modelo de 17 segmentos de la app.
    let sum = 0, n = 0;
    for (let id = 1; id <= 17; id++) {
        if (excluir && excluir.includes(id)) continue;
        const sc = WM[stateKey][id];
        if (sc > 0) { sum += (ASE[sc] || sc); n++; }
    }
    return n === 0 ? null : (sum / n).toFixed(2);
}

function medir() {
    const H = w.recolectarHallazgos();
    const c = w.evaluarCategorizacion();
    return { nivel: c.noConcluyente ? 'no concluyente' : c.nivel,
             wmsiEst: H.wmsiEstres, wmsiRep: H.wmsiReposo };
}

const N = Number(process.argv[2] || 800);
let cambian = 0, conMotilidad = 0, bajan = 0;
// Lo que más importa: el corte de 1,7 dispara "~5 % de eventos cardíacos por año".
let altoAntes = 0, altoDespues = 0, dejanDeSerAltos = 0;
let estratoCambia = 0;
const estrato = v => v === null ? 'sin datos' : parseFloat(v) > 1.7 ? '>1,7' : parseFloat(v) > 1.0 ? '1,0-1,7' : 'normal';
const matriz = {}, ejemplos = [];
let sumaDelta = 0, nDelta = 0, maxDelta = 0;

for (let i = 0; i < N; i++) {
    casoBase(w); todoNormal(w);
    set(w, 'edad', ri(35, 85));
    set(w, 'sexo', rnd(['M', 'F']));
    set(w, 'fevi_reposo', ri(25, 70));
    set(w, 'fevi_pico', ri(20, 80));
    set(w, 'esf_basal_fc', ri(50, 95));
    set(w, 'esf_max_fc', ri(90, 180));
    set(w, 'esf_basal_tas', ri(100, 160));
    set(w, 'esf_max_tas', ri(90, 240));
    set(w, 'esf_rec_fc', ri(70, 180));
    set(w, 'ej_mets', ri(2, 14));
    set(w, 'ej_seg_img', ri(20, 150));
    set(w, 'ej_fc_img', ri(80, 170));
    set(w, 'ventana', rnd(['buena', 'regular', 'limitada']));
    for (let k = 0, m = ri(0, 6); k < m; k++) {
        const id = ri(1, 17);
        w.setScore(id, 'reposo', rnd([0, 1, 2, 3, 4, 5]));
        w.setScore(id, 'estres', rnd([0, 1, 2, 3, 4, 5]));
    }

    w.calcWMSI = original;  const antes = medir();
    w.calcWMSI = calcWMSIase; const despues = medir();
    w.calcWMSI = original;

    // ¿Hay motilidad anormal? Si todo es 1, los dos índices valen 1,00.
    let hayAnormal = false;
    for (let id = 1; id <= 17; id++) if (WM.reposo[id] > 1 || WM.estres[id] > 1) hayAnormal = true;
    if (hayAnormal) conMotilidad++;

    if (antes.wmsiEst !== null && despues.wmsiEst !== null) {
        const d = parseFloat(antes.wmsiEst) - parseFloat(despues.wmsiEst);
        if (d > 0) { sumaDelta += d; nDelta++; maxDelta = Math.max(maxDelta, d); }
    }

    const eA = estrato(antes.wmsiEst), eD = estrato(despues.wmsiEst);
    if (eA === '>1,7') altoAntes++;
    if (eD === '>1,7') altoDespues++;
    if (eA === '>1,7' && eD !== '>1,7') dejanDeSerAltos++;
    if (eA !== eD) estratoCambia++;

    if (antes.nivel !== despues.nivel) {
        cambian++;
        const k = antes.nivel + ' → ' + despues.nivel;
        matriz[k] = (matriz[k] || 0) + 1;
        const orden = { bajo: 0, intermedio: 1, alto: 2 };
        if (orden[despues.nivel] < orden[antes.nivel]) bajan++;
        if (ejemplos.length < 4)
            ejemplos.push(`   WMSI pico ${antes.wmsiEst} → ${despues.wmsiEst} · riesgo ${k}`);
    }
}

console.log(`${N} casos · ${conMotilidad} con motilidad anormal\n`);
console.log(`CAMBIAN DE CATEGORÍA: ${cambian} (${(cambian*100/N).toFixed(1)} % del total, ` +
            `${conMotilidad ? (cambian*100/conMotilidad).toFixed(1) : 0} % de los que tienen motilidad anormal)`);
console.log(`   de los cuales bajan de riesgo: ${bajan}`);
Object.entries(matriz).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`   ${String(v).padStart(4)}  ${k}`));
console.log(`\nWMSI pico: baja en promedio ${nDelta ? (sumaDelta/nDelta).toFixed(3) : 0} puntos ` +
            `(máximo ${maxDelta.toFixed(2)}), sobre ${nDelta} casos en que cambia`);
console.log(`\nESTRATO DEL WMSI PICO (es lo que dispara la frase de eventos/año):`);
console.log(`   cambian de estrato: ${estratoCambia} (${(estratoCambia*100/N).toFixed(1)} %)`);
console.log(`   WMSI > 1,7:  ${altoAntes} con la escala actual  →  ${altoDespues} con la escala ASE`);
console.log(`   dejan de cruzar el corte de 1,7: ${dejanDeSerAltos}` +
            (altoAntes ? ` (${(dejanDeSerAltos*100/altoAntes).toFixed(0)} % de los que hoy lo cruzan)` : ''));
console.log('\nejemplos:');
ejemplos.forEach(e => console.log(e));
