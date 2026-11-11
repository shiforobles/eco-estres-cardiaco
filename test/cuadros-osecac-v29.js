// Cuadros de OSECAC, v2.9 (Lucas, 11/11/2026).
//
// Reposo: la frase del VI como la conclusión de eco Doppler —sin repetir medidas,
// salvo las que justifican una geometría anormal o una dilatación—, FEy con número,
// "Relación E/e' X, presiones de llenado …", y el ECG basal en párrafo aparte. Fuera
// "Presión pulmonar no estimada" y "Sin valvulopatías significativas" sin dato.
// Esfuerzo: sin la línea cuantitativa del WMSI; la mejoría de la alteración basal dice
// cuál; el estudio diastólico con sus valores, informado aun sin VRT, y sin línea
// cuando no se hizo.
const { cargarApp, casoBase, set, puntajes, todoNormal } = require('./harness');

let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };
const ver = process.argv.includes('--ver');

const ANTERIOR = [1, 7, 13];   // anterior basal, medio, apical

function caso(armar) {
    const w = cargarApp();
    casoBase(w);
    todoNormal(w);
    armar(w);
    const H = w.recolectarHallazgos();
    return { w, H, O: w.informeOsecac(H) };
}

function mostrar(titulo, O) {
    if (!ver) return;
    console.log(`\n── ${titulo} ──\nREPOSO\n${O.reposo}\n\nESFUERZO\n${O.esfuerzo}\n\nCONCLUSIÓN\n${O.conclusion}`);
}

// ── 1 · El caso real del 11/11 ───────────────────────────────────
{
    const { O, H } = caso(w => {
        set(w, 'ddvi', 46.5); set(w, 'siv_d', 8); set(w, 'pp_d', 8);
        set(w, 'peso', 75); set(w, 'altura', 172);
        const r = {}, e = {};
        ANTERIOR.forEach(id => { r[id] = 2; e[id] = 1; });
        puntajes(w, r, e);
        set(w, 'e_onda_rep', 80); set(w, 'e_prima_rep', 10); set(w, 'e_prima_lat_rep', 10);
        set(w, 'e_onda_est', 90); set(w, 'e_prima_est', 11); set(w, 'e_prima_lat_est', 12);
    });
    mostrar('1 · caso real 11/11: hipoquinesia anterior que se normaliza, diastólico sin VRT', O);
    exigir(/^Ventrículo izquierdo de diámetros y espesores conservados, con geometría ventricular normal e hipoquinesia/.test(O.reposo),
        '1: el reposo arranca por la frase del VI y engancha la motilidad con "e"');
    exigir(/Función sistólica conservada \(FEy 60 %\)\./.test(O.reposo), '1: FEy con grado y número');
    exigir(/Relación E\/e' 8, presiones de llenado normales\./.test(O.reposo), '1: E/e\' de referencia + presiones');
    exigir(!/Diámetro diastólico|septum interventricular|pared posterior/i.test(O.reposo), '1: sin medidas crudas');
    exigir(!/Presión pulmonar no estimada|Sin valvulopatías/.test(O.reposo), '1: sin líneas de lo no medido');
    exigir(/\nECG basal: /.test(O.reposo), '1: el ECG basal va en párrafo aparte');
    exigir(!/WMSI/.test(O.esfuerzo), '1: el cuadro de Esfuerzo no trae WMSI');
    exigir(!/La alteración basal se normalizó/.test(O.esfuerzo) &&
           /La hipoquinesia leve de la pared anterior en toda su extensión se normalizó con el esfuerzo\./.test(O.esfuerzo),
        '1: la mejoría dice qué alteración se normalizó');
    exigir(/Estudio diastólico de esfuerzo negativo: E\/e' 8,0 → 7,8, sin aumento de las presiones de llenado con el esfuerzo \(VRT no medible\)\./.test(O.esfuerzo)
        || /Estudio diastólico de esfuerzo negativo: E\/e' 8 → 7,8/.test(O.esfuerzo),
        '1: diastólico negativo sin VRT, con valores');
    exigir(!/No evaluado/.test(O.esfuerzo), '1: nunca "No evaluado" con E y e\' cargados');
    exigir(H.diastResultado === 'negativo', '1: resultado negativo, no no_evaluado (' + H.diastResultado + ')');
}

// ── 2 · Remodelado concéntrico: la frase lleva los valores que lo justifican ─
{
    const { O } = caso(w => {
        set(w, 'ddvi', 52); set(w, 'siv_d', 11); set(w, 'pp_d', 11);
        set(w, 'peso', 90); set(w, 'altura', 175);
    });
    mostrar('2 · remodelado concéntrico, sin diastólico de esfuerzo', O);
    exigir(/^Ventrículo izquierdo con (remodelado concéntrico|hipertrofia concéntrica) \(masa indexada \d+ g\/m², espesor relativo 0,\d+\)\. Motilidad parietal normal\./.test(O.reposo),
        '2: geometría anormal con masa y espesor relativo, motilidad en oración aparte');
    exigir(!/diastólico de esfuerzo/i.test(O.esfuerzo), '2: sin E/e\' post no sale ninguna línea diastólica');
}

// ── 3 · Dilatado: entra el diámetro diastólico ───────────────────
{
    const { O } = caso(w => {
        set(w, 'ddvi', 64); set(w, 'siv_d', 8); set(w, 'pp_d', 8);
        set(w, 'peso', 80); set(w, 'altura', 175);
    });
    mostrar('3 · VI dilatado', O);
    exigir(/^Ventrículo izquierdo (dilatado con remodelado excéntrico|con hipertrofia excéntrica y dilatación ventricular) \(diámetro diastólico 64 mm/.test(O.reposo),
        '3: dilatado con el diámetro que lo justifica');
}

// ── 4 · Diastólico positivo con VRT ──────────────────────────────
{
    const { O, H } = caso(w => {
        set(w, 'e_onda_rep', 80); set(w, 'e_prima_rep', 6); set(w, 'e_prima_lat_rep', 8);
        set(w, 'e_onda_est', 120); set(w, 'e_prima_est', 7); set(w, 'e_prima_lat_est', 9);
        set(w, 'vrt_est', 3.1);
    });
    mostrar('4 · diastólico positivo con VRT', O);
    exigir(H.diastResultado === 'positivo', '4: positivo');
    exigir(/Estudio diastólico de esfuerzo positivo: E\/e' [\d,]+ → 15 y VRT 3,1 m\/s/.test(O.esfuerzo),
        '4: positivo con E/e\' y VRT');
}

// ── 5 · E/e' post elevado sin VRT y e' septal normal: indeterminado, informado ─
{
    const { O, H } = caso(w => {
        set(w, 'e_onda_rep', 80); set(w, 'e_prima_rep', 9); set(w, 'e_prima_lat_rep', 11);
        set(w, 'e_onda_est', 150); set(w, 'e_prima_est', 9); set(w, 'e_prima_lat_est', 11);
    });
    mostrar('5 · E/e\' post 15 sin VRT, e\' septal 9: indeterminado', O);
    exigir(H.diastResultado === 'indeterminado', '5: indeterminado (' + H.diastResultado + ')');
    exigir(/Estudio diastólico de esfuerzo indeterminado: E\/e' 8 → 15 \(VRT no medible\)\./.test(O.esfuerzo),
        '5: indeterminado con valores y sin VRT');
}

// ── 6 · E/e' post elevado sin VRT con e' septal bajo: positivo sin VRT ─
{
    const { O, H } = caso(w => {
        set(w, 'e_onda_rep', 80); set(w, 'e_prima_rep', 6); set(w, 'e_prima_lat_rep', 8);
        set(w, 'e_onda_est', 130); set(w, 'e_prima_est', 7); set(w, 'e_prima_lat_est', 9);
    });
    mostrar('6 · E/e\' post elevado sin VRT con e\' septal 6: positivo', O);
    exigir(H.diastResultado === 'positivo', '6: positivo sin VRT');
    exigir(/\(VRT no medible\)\./.test(O.esfuerzo), '6: aclara que no hubo VRT');
}

console.log(fallas ? `\n${fallas} falla(s) — cuadros OSECAC v2.9` : 'Sin fallas — cuadros OSECAC v2.9 (6 casos)');
process.exit(fallas ? 1 : 0);
