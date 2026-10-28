// Antecedentes que llegan al informe y a la planilla, valvulopatía estructurada,
// progresión respecto del estudio previo y EAo moderada.
const { cargarApp, casoBase, todoNormal, informe } = require('./harness');

const w = cargarApp();
const set = (id, v) => { const e = w.document.getElementById(id); if (!e) return false;
    e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true }));
    e.dispatchEvent(new w.Event('change', { bubbles: true })); return true; };
let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };
const linea = rot => informe(w).texto.split('\n\n').find(p => p.startsWith(rot)) || '';

// ── 1 · El texto libre sale en el informe y en la planilla ───────
casoBase(w); todoNormal(w);
set('ant_otros', 'Válvula aórtica bicúspide conocida');
exigir(/bicúspide conocida/i.test(linea('Antecedentes:')),
    `el texto libre debe salir en el informe: "${linea('Antecedentes:')}"`);
const S = w.EstresSheets;
let fila = S.construirFila(informe(w).texto);
exigir(fila.length === S.HEADERS.length, 'la fila y el encabezado deben medir lo mismo');
exigir(fila[S.HEADERS.indexOf('Otros antecedentes')] === 'Válvula aórtica bicúspide conocida',
    'el texto libre debe tener su columna');

// ── Las notas privadas NO salen a ningún lado ────────────────────
set('notas_privadas', 'Paciente muy ansioso, llamar antes');
fila = S.construirFila(informe(w).texto);
exigir(!fila.some(c => String(c).includes('muy ansioso')),
    'las notas privadas no pueden llegar a la planilla');
exigir(!/muy ansioso/.test(informe(w).texto),
    'las notas privadas no pueden llegar al informe');

// ── 2 · Valvulopatía estructurada ────────────────────────────────
casoBase(w); todoNormal(w);
set('valv_tipo', 'eao'); set('valv_severidad', 'moderada'); set('valv_bicuspide', 'si');
const ant = linea('Antecedentes:');
exigir(/estenosis aórtica/i.test(ant), `la valvulopatía debe salir en el informe: "${ant}"`);
exigir(/moderada/i.test(ant), 'con su severidad');
exigir(/bicúspide/i.test(ant), 'y la bicúspide');
fila = S.construirFila(informe(w).texto);
exigir(fila[S.HEADERS.indexOf('Bicúspide')] === 'Sí', 'la bicúspide va en su columna, para poder contarla');
exigir(fila[S.HEADERS.indexOf('Severidad valvular')] === 'moderada', 'y la severidad en la suya');

// ── 3 · Progresión respecto del estudio previo ───────────────────
casoBase(w); todoNormal(w);
set('fecha_estudio', '2026-10-28');
set('prev_fecha', '2024-10-28');          // dos años antes
set('prev_vmax', 3.0); set('prev_grad', 25); set('prev_aorta', 38);
set('eaoej_vmax_reposo', 3.8); set('eaoej_grad_reposo', 35); set('eaoej_aorta', 44);
let H = w.recolectarHallazgos();
exigir(Math.abs(H.progresion.anios - 2) < 0.05, `el intervalo debe ser ~2 años y fue ${H.progresion.anios}`);
exigir(Math.abs(H.progresion.vmax - 0.4) < 0.02, `Vmax +0,4 m/s por año y dio ${H.progresion.vmax}`);
exigir(Math.abs(H.progresion.aorta - 3) < 0.05, `aorta +3 mm por año y dio ${H.progresion.aorta}`);
exigir(H.progresion.vmaxRapida, 'con 0,4 m/s por año la progresión es rápida');
exigir(H.progresion.aortaCrece, 'con 3 mm por año la aorta crece');
exigir(/Respecto del estudio previo/.test(linea('Antecedentes:')),
    `la progresión debe salir en el informe: "${linea('Antecedentes:')}"`);
const avisos = w.evaluarAvisosClinicos();
exigir(avisos.some(a => /Vmax progresa/.test(a.titulo)), 'la progresión rápida debe avisar en pantalla');
exigir(avisos.some(a => /aorta ascendente crece/.test(a.titulo)), 'y el crecimiento de la aorta');
// La conducta NO va al informe
exigir(!/se sugiere|acorta el intervalo|control/i.test(
        linea('Antecedentes:').replace(/Respecto del estudio previo[^.]*\./, '')),
    'el informe describe la progresión, no indica seguimiento');

// Intervalo demasiado corto: no se anualiza
set('prev_fecha', '2026-09-28');
H = w.recolectarHallazgos();
exigir(H.progresion.muyCorto, 'con un mes de diferencia no se anualiza');
exigir(!/Respecto del estudio previo/.test(linea('Antecedentes:')),
    'y el informe no afirma una pendiente que los datos no sostienen');

// ── 4 · EAo moderada ─────────────────────────────────────────────
casoBase(w); todoNormal(w);
set('indicacion', 'eao_moderada');
set('eaoej_ava', 1.2); set('eaoej_grad_reposo', 28); set('eaoej_grad_post', 42);
set('eaoej_vmax_reposo', 3.4); set('eaoej_vmax_post', 4.0); set('eaoej_vsi', 32);
H = w.recolectarHallazgos();
exigir(H.eaoEjEnUso, 'la indicación de EAo moderada enciende el módulo');
exigir(H.eaoModerada, 'y lo marca como moderada');
const bloque = linea('Estenosis aórtica:');
exigir(/Control de estenosis aórtica moderada/.test(bloque),
    `el encabezado debe decir moderada: "${bloque.slice(0, 80)}"`);
exigir(/velocidad máxima aórtica/i.test(bloque), 'la Vmax debe salir');
exigir(/por debajo de 35/.test(bloque), 'el VSI bajo debe advertir que el gradiente subestima');
exigir(!/se sugiere (cirug|evaluación|control)/i.test(bloque), 'sin conducta en el informe');
const av2 = w.evaluarAvisosClinicos();
exigir(av2.some(a => /cortes de la app son de EAo severa/.test(a.titulo)),
    'el panel debe aclarar que los cortes son de EAo severa');
exigir(av2.some(a => /Volumen sistólico indexado/.test(a.titulo)), 'y avisar del VSI bajo');

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
