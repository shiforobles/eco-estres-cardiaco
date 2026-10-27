// Carga cada segmento solo, del 1 al 17, y verifica que el texto nombre EXACTAMENTE
// ese segmento: ni otro, ni de más.
//
// Existe porque una reconstrucción mía de un caso real nombraba "inferolateral" donde
// los comprometidos eran los inferoseptales. La numeración resultó correcta —el error
// estaba en la lista que yo había inventado— pero eso no se puede volver a dar por
// sentado: este test lo prueba segmento por segmento.
const path = require('path');
const { cargarApp } = require('./harness');

const w = cargarApp();
const WM = w.eval('WM');
const SEGMENTS = w.eval('SEGMENTS');

// Nombre anatómico esperado de cada segmento, escrito a mano desde el modelo AHA.
// A propósito NO se deriva de SEGMENTS: si se derivara, un error en SEGMENTS pasaría
// desapercibido porque el test y el código estarían de acuerdo en lo mismo.
const ESPERADO = {
    1:  { pared: /anterior/,       nivel: /basal/,  prohibido: /septal|lateral|inferior/ },
    2:  { pared: /anteroseptal/,   nivel: /basal/,  prohibido: /lateral|inferolateral/ },
    3:  { pared: /inferoseptal/,   nivel: /basal/,  prohibido: /lateral|anterior\b/ },
    4:  { pared: /inferior/,       nivel: /basal/,  prohibido: /septal|lateral|anterior/ },
    5:  { pared: /inferolateral/,  nivel: /basal/,  prohibido: /septal|anterior\b/ },
    6:  { pared: /anterolateral/,  nivel: /basal/,  prohibido: /septal|inferior/ },
    7:  { pared: /anterior/,       nivel: /medi/,   prohibido: /septal|lateral|inferior/ },
    8:  { pared: /anteroseptal/,   nivel: /medi/,   prohibido: /lateral|inferolateral/ },
    9:  { pared: /inferoseptal/,   nivel: /medi/,   prohibido: /lateral|anterior\b/ },
    10: { pared: /inferior/,       nivel: /medi/,   prohibido: /septal|lateral|anterior/ },
    11: { pared: /inferolateral/,  nivel: /medi/,   prohibido: /septal|anterior\b/ },
    12: { pared: /anterolateral/,  nivel: /medi/,   prohibido: /septal|inferior/ },
    13: { pared: /anterior/,       nivel: /apical/, prohibido: /septal|lateral|inferior/ },
    14: { pared: /septal/,         nivel: /apical/, prohibido: /lateral|inferior|anterior\b/ },
    15: { pared: /inferior/,       nivel: /apical/, prohibido: /septal|lateral|anterior/ },
    16: { pared: /lateral/,        nivel: /apical/, prohibido: /septal|inferior|anterior\b/ },
    17: { apex: true },
};

let fallas = 0;
const fail = m => { console.log('✗ ' + m); fallas++; };

// ── 1 · La numeración de SEGMENTS coincide con la del modelo de Doppler ──
const DOPPLER = path.join(require('os').homedir(), 'Documents',
    'App Calculadora Ecodoppler Cardiaco', 'js', 'motility-model.js');
let MotilityModel = null;
try { MotilityModel = require(DOPPLER); } catch (e) { /* no está en esta computadora */ }

if (MotilityModel) {
    SEGMENTS.forEach(s => {
        const d = MotilityModel.SEGMENTS[s.id];
        if (!d) { fail(`el segmento ${s.id} no existe en el modelo de Doppler`); return; }
        // Los nombres se escriben distinto (Basal Anterior / Basal Anterior), pero el
        // VASO tiene que ser el mismo o los dos modelos no son el mismo ventrículo.
        if (d.artery !== s.territory)
            fail(`segmento ${s.id} (${s.name}): acá es ${s.territory} y en Doppler ${d.artery}`);
    });
} else {
    console.log('(la app de Doppler no está acá: no se verifica la numeración cruzada)');
}

// ── 2 · Cada segmento, solo, nombrado exactamente ────────────────────────
const { linea } = require('./harness');

[2, 3, 4, 5].forEach(score => {
    for (let id = 1; id <= 17; id++) {
        for (let i = 1; i <= 17; i++) { WM.reposo[i] = 1; WM.estres[i] = 1; }
        WM.reposo[id] = score;
        const H = w.recolectarHallazgos();
        const { texto } = w.construirNarrativa(H);
        const lRep = linea(texto, 'Reposo');
        // La frase de motilidad es el segundo párrafo del bloque (el primero es el método)
        // Se saca el paréntesis del territorio: ahí 'anterior' es el nombre del VASO
        // (arteria descendente anterior), no una pared, y daba falsos positivos.
        const motil = (lRep.split('\n\n')[1] || '').split('.')[0]
            .replace(/\([^)]*\)/g, '').toLowerCase();
        const e = ESPERADO[id];

        if (e.apex) {
            // El ápex se puntúa acá aunque Motor A lo ignore: el informe no puede
            // afirmar motilidad normal con el 17 cargado como anormal.
            if (/motilidad parietal normal|global y segmentaria conservada/i.test(motil))
                fail(`grado ${score}, segmento 17 (ápex): el informe lo da por normal — "${motil}"`);
            continue;
        }
        if (!e.pared.test(motil))
            fail(`grado ${score}, segmento ${id}: falta la pared ${e.pared} — "${motil}"`);
        if (!e.nivel.test(motil))
            fail(`grado ${score}, segmento ${id}: falta el nivel ${e.nivel} — "${motil}"`);
        if (e.prohibido.test(motil))
            fail(`grado ${score}, segmento ${id}: nombra ${e.prohibido}, que no corresponde — "${motil}"`);
    }
});

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
