// Acotar el párrafo pronóstico: niveles, fusión de extensión, tope y exentos.
const { cargarApp, set, casoBase, todoNormal } = require('./harness');
const w = cargarApp();

function correr(nombre, preparar, mostrar) {
    casoBase(w); todoNormal(w);
    const d0 = w.document.getElementById('diast_resultado');
    if (d0) { d0.value = ''; d0.dispatchEvent(new w.Event('change', { bubbles: true })); }
    preparar();
    const H = w.recolectarHallazgos(), rama = w.elegirRama(H);
    const parr = w.oracionPronostica(H, rama).replace(/\s+/g, ' ').trim();
    // Se cuentan las oraciones después de la bisagra: la bisagra positiva no lleva
    // número ("Merecen señalarse además los siguientes hallazgos").
    const cuerpo = parr.replace(/^Merece señalarse que /, '')
                       .replace(/^Merecen señalarse además [^.]*\. /, '')
                       .replace(/^Ese buen pronóstico[^.]*\. /, '');
    const n = !parr ? 0 : cuerpo.split(/\.\s+(?=[A-ZÁÉÍÓÚ])/).filter(x => x.trim()).length;
    console.log(`\n── ${nombre}  [${n} frase(s)]`);
    console.log(`   activos: ${w.hallazgosActivos(H).map(h => h.id).join(', ') || '—'}`);
    if (mostrar !== false) console.log('   ' + (parr || '(sin párrafo)'));
    return { n, parr, H };
}

let fallas = 0;
const exigir = (cond, msg) => { if (!cond) { console.log('   ✗ ' + msg); fallas++; } };

// EL CASO REAL: WMSI >1,7 · FEy 45 · 3,4 METs · HRR₁ 10 · hipertensiva · sin reserva
let r = correr('CASO REAL de la jornada', () => {
    set(w, 'fevi_reposo', 45); set(w, 'fevi_pico', 47);
    set(w, 'ej_mets', 3.4); set(w, 'esf_max_tas', 228);
    set(w, 'esf_max_fc', 150); set(w, 'esf_rec_fc', 140);
    [1, 2, 3, 7, 8, 9, 13, 14].forEach(id => w.setScore(id, 'estres', 3));
});
exigir(r.n === 3, `el caso real debía quedar en 3 frases, quedó en ${r.n}`);
exigir(/la carga isquémica es alta/i.test(r.parr), 'falta la frase fusionada de extensión');
exigir(!/se sugiere/i.test(r.parr), 'el párrafo pronóstico no puede sugerir conducta');
exigir(!/alto riesgo de eventos/.test(r.parr),
    'en rama positiva no debe repetirse el juicio que ya dio el veredicto');
exigir(!/respuesta tensional|tensión arterial alcanzó/.test(r.parr), 'la hipertensiva no debía entrar');
exigir(!/recuperación de la frecuencia cardíaca/.test(r.parr), 'el HRR₁ de 10 no debía entrar');
exigir(!/reserva contráctil global/.test(r.parr), 'la reserva contráctil no debía entrar');

r = correr('hipertensiva sola, estudio limpio', () => { set(w, 'esf_max_tas', 228); });
exigir(/tensión arterial alcanzó/.test(r.parr), 'sin críticos, la hipertensiva debe entrar');

r = correr('hipertensiva junto a un crítico', () => {
    set(w, 'esf_max_tas', 228); set(w, 'ej_mets', 3);
});
exigir(!/tensión arterial alcanzó/.test(r.parr), 'con un crítico, la hipertensiva debe callar');

r = correr('las tres de extensión juntas', () => {
    [1, 2, 3, 4, 10, 11].forEach(id => w.setScore(id, 'estres', 4));
});
exigir(r.n === 1, `las tres de extensión debían dar 1 frase, dieron ${r.n}`);

// Con escala ASE hacen falta aquinesias para cruzar 1,7: siete dan 1,82.
r = correr('extensa sin multiterritorial (7 segs DA aquinéticos)', () => {
    [1, 2, 7, 8, 13, 14, 17].forEach(id => w.setScore(id, 'estres', 4));
});
exigir(r.n === 1 && /carga isquémica es alta/i.test(r.parr), 'extensa + WMSI alto debían fusionarse');

// Testigo de la corrección de escala: seis segmentos con hipoquinesia moderada daban
// WMSI 1,71 con el puntaje crudo y la frase del "~5 % anual". En escala ASE dan 1,35.
r = correr('6 segs con hipoquinesia moderada: ya NO cruza 1,7', () => {
    [1, 2, 7, 8, 13, 14].forEach(id => w.setScore(id, 'estres', 3));
});
exigir(!/por encima de 1,7|5 % anual/.test(r.parr),
    'hipoquinesia moderada en 6 segmentos no puede disparar el estrato de >1,7');
exigir(parseFloat(r.H.wmsiEstres) < 1.7,
    `el WMSI debía quedar por debajo de 1,7 y dio ${r.H.wmsiEstres}`);

r = correr('secuela: la frase de viabilidad', () => {
    [10, 11].forEach(id => { w.setScore(id, 'reposo', 3); w.setScore(id, 'estres', 3); });
});
exigir(/no descarta viabilidad/.test(r.parr), 'falta la salvedad de viabilidad');
exigir(!/dobutamina|resonancia|realce tardío/.test(r.parr), 'la conducta de viabilidad ya no va al informe');
exigir(!/no cabe esperar recuperación funcional/.test(r.parr), 'SOBREAFIRMACIÓN: el esfuerzo no evalúa viabilidad');

r = correr('HRR₁ 10: sale del informe', () => { set(w, 'esf_rec_fc', 140); set(w, 'esf_max_fc', 150); });
exigir(r.n === 0, 'el HRR₁ de 10 no debe imprimir');

r = correr('HRR₁ 4: entra', () => { set(w, 'esf_rec_fc', 146); set(w, 'esf_max_fc', 150); });
exigir(r.n === 1, 'el HRR₁ de 4 debe imprimir');

// patronApical exento del tope: 1 crítico + 5 de segunda, el apical no puede caer
r = correr('tope activo + patrón apical exento', () => {
    set(w, 'ej_mets', 3);
    set(w, 'fevi_reposo', 42); set(w, 'fevi_pico', 45);
    set(w, 'esf_rec_fc', 146); set(w, 'esf_max_fc', 150);
    const d = w.document.getElementById('diast_resultado');
    if (d) { d.value = 'positivo'; d.dispatchEvent(new w.Event('change', { bubbles: true })); }
    [13, 14, 15, 16].forEach(id => w.setScore(id, 'estres', 3));
    [10, 11].forEach(id => { w.setScore(id, 'reposo', 3); w.setScore(id, 'estres', 3); });
});
exigir(/compromiso apical|región apical|tres territorios coronarios por anatomía/.test(r.parr),
    'el patrón apical quedó fuera pese a estar exento del tope');

r = correr('todo normal', () => {});
exigir(r.n === 0, 'un estudio normal no debe tener párrafo');

console.log(fallas ? `\n${fallas} FALLAS` : '\nSin fallas');
