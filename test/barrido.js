// Barrido aleatorio: ninguna combinación debe disparar la guarda de coherencia,
// dejar marcadores sin rellenar, romper la concordancia, sobreafirmar viabilidad
// ni dejar mudo un hallazgo informable.
const { cargarApp, set, casoBase, todoNormal, informe, linea } = require('./harness');

const w = cargarApp();
// WM es un `const` de script: no está en window, pero el eval global lo alcanza.
const WMx = w.eval('WM');
const PESO = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4 };
const N = Number(process.argv[2] || 800);
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

let fallas = 0;
const vistos = {};
const reportar = (clave, detalle) => {
    fallas++;
    if (!vistos[clave]) { vistos[clave] = 0; console.log('\n✗ ' + clave + '\n    ' + detalle); }
    vistos[clave]++;
};

for (let i = 0; i < N; i++) {
    casoBase(w);
    todoNormal(w);

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
    const cd = w.document.getElementById('ej_causa_detencion').options;
    set(w, 'ej_causa_detencion', cd[ri(1, cd.length - 1)].value);
    set(w, 'ventana', rnd(['buena', 'regular', 'limitada']));
    set(w, 'patron_motilidad', rnd(['segmentaria', 'segmentaria', 'segmentaria', 'global']));
    set(w, 'ant_betabloq', Math.random() < 0.3);
    const dr = w.document.getElementById('diast_resultado');
    if (dr) set(w, 'diast_resultado', rnd(['', 'negativo', 'positivo', 'no_evaluado']));

    for (let k = 0, n = ri(0, 6); k < n; k++) {
        const id = ri(1, 17);
        w.setScore(id, 'reposo', rnd([0, 1, 2, 3, 4]));
        w.setScore(id, 'estres', rnd([0, 1, 2, 3, 4]));
    }

    let r;
    try { r = informe(w); }
    catch (e) { reportar('excepción: ' + e.message, (e.stack || '').split('\n')[1] || ''); continue; }

    const { H, texto, incoherencias } = r;

    if (incoherencias.length) reportar('guarda de coherencia', incoherencias.join(' | '));

    const marcador = texto.match(/\{\{[a-zA-Z]+\}\}/);
    if (marcador) reportar('marcador sin rellenar: ' + marcador[0], linea(texto, 'Esfuerzo').slice(0, 180));

    const conc = texto.match(/El segmento[^.]{0,120}?(modificaron|normalizaron|mejoraron|resultaron)|Los segmentos[^.]{0,120}?(modificó|normalizó|resultó valorable)/);
    if (conc) reportar('concordancia de número', conc[0]);

    const asc = texto.match(/ascendió de ([\d,]+) en reposo a ([\d,]+)/);
    if (asc && parseFloat(asc[2].replace(',', '.')) < parseFloat(asc[1].replace(',', '.')))
        reportar('dice "ascendió" pero el número bajó', asc[0]);

    // El eco de ESFUERZO no evalúa viabilidad: esa frase no puede volver nunca.
    if (/no cabe esperar recuperación funcional/.test(texto))
        reportar('SOBREAFIRMACIÓN de viabilidad', 'el eco de esfuerzo no es un test de viabilidad');

    // El informe describe el hallazgo y su significado, NUNCA la conducta: una
    // indicación escrita y firmada deja al médico tratante obligado a justificar por
    // qué no la siguió. La única fórmula permitida es "Se sugiere correlación clínica".
    const sinConducta = texto.replace(/Se sugiere correlación clínica/g, '');
    const CONDUCTA = [
        /se sugiere/i, /se recomienda/i, /considerar /i, /conviene (definir|evaluar|realizar|repetir)/i,
        /cinecoronariograf/i, /rehabilitación/i, /monitoreo ambulatorio/i, /apremio/i,
        /dobutamina a (dosis|baja)/i, /realce tardío/i, /\bMAPA\b/,
        /tratamiento antihipertensivo/i, /optimización del tratamiento/i,
        /actividad física programada/i, /obliga a evaluar/i, /repetir el estudio/i
    ];
    CONDUCTA.forEach(re => {
        const m = sinConducta.match(re);
        if (m) reportar('CONDUCTA en el informe: ' + re.source,
            (sinConducta.match(new RegExp('.{0,80}' + re.source + '.{0,80}', re.flags)) || [m[0]])[0]);
    });

    // El bloque de reposo abre siempre con el método, en prosa.
    const lRep = linea(texto, 'Reposo');
    if (!/^Reposo: Se realizó ecocardiograma con ejercicio en cicloergómetro/.test(lRep))
        reportar('el bloque de reposo no abre con el método', lRep.slice(0, 140));

    // Y tiene sus tres párrafos separados.
    if (!/\n\nFunción diastólica:/.test(lRep))
        reportar('falta el párrafo de función diastólica', lRep.slice(-140));

    // Un hallazgo informable activo no puede quedarse sin párrafo. Los de nivel
    // 'pantalla' sí: salen del informe a propósito y siguen categorizando.
    const rama = w.elegirRama(H);
    const parr = w.oracionPronostica(H, rama);
    const activos = w.hallazgosActivos(H);
    const nivelDe = h => (typeof h.nivel === 'function' ? h.nivel(H) : h.nivel) || 'pantalla';
    const hayCritico = activos.some(h => nivelDe(h) === 'critico');
    const informable = activos.some(h => {
        if (nivelDe(h) === 'pantalla') return false;
        if (h.requiereSinCriticos && hayCritico) return false;
        if ((h.cubiertoPor || []).some(id => activos.some(x => x.id === id))) return false;
        try { return !!h.informe(H, rama); } catch (e) { return false; }
    });
    if (informable && !parr)
        reportar('hallazgo informable activo sin párrafo pronóstico',
            activos.map(h => h.id + '/' + nivelDe(h)).join(', '));

    // El WMSI tiene que estar en escala ASE 1-4: el corte >1,7 y su "~5 % de eventos
    // por año" salen de literatura hecha con esa escala. Con el puntaje crudo 1-5,
    // 139 de cada 150 informes que cruzaban el corte no lo cruzaban en realidad.
    // Cota superior: si TODOS los segmentos fueran disquinéticos, el índice da 4,00.
    [H.wmsiReposo, H.wmsiEstres].forEach(v => {
        if (v !== null && parseFloat(v) > 4)
            reportar('WMSI fuera de la escala ASE', `vale ${v} y el máximo posible es 4,00`);
    });
    // Y el máximo real del caso, por si el mapeo se rompiera sólo para algún puntaje.
    let peorPeso = 0;
    for (let id = 1; id <= 17; id++)
        [WMx.reposo[id], WMx.estres[id]].forEach(sc => { if (sc > 0) peorPeso = Math.max(peorPeso, PESO[sc] || 99); });
    if (peorPeso > 4) reportar('un puntaje pesa más de 4 en el índice', 'peso ' + peorPeso);

    if (/undefined|NaN|\[object/.test(texto))
        reportar('valor roto en el texto', (texto.match(/.{0,60}(undefined|NaN|\[object).{0,60}/) || [])[0]);
}

console.log(`\n${N} casos · ${fallas} fallas`);
if (fallas) console.log(vistos);
