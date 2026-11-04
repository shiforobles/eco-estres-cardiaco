// Tanda de estética (v2.3): botonera de eco Doppler, paneles laterales, perlas
// fuera del flujo, motilidad antes del eco post y barra de secciones. Lo que se
// vigila es que nada se haya perdido al mover la pantalla.
const { cargarApp, casoBase, todoNormal, informe, PROJ } = require('./harness');
const fs = require('fs');
const path = require('path');

const w = cargarApp();
const d = w.document;
let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };

// ── Botonera: los seis botones de eco Doppler, con lo que hace cada uno ──
const dock = d.querySelector('section.action-buttons');
exigir(dock, 'hay botonera anclada');
const acciones = dock ? [...dock.querySelectorAll('button')].map(b => b.getAttribute('onclick')) : [];
['borrarTodo()', 'generarDesdeBotonera()', 'copiarReporte()', 'guardarEstudio()',
 "abrirPanel('historial')", "abrirPanel('sync')"].forEach(a =>
    exigir(acciones.includes(a), `la botonera tiene ${a}`));
exigir(acciones.length === 6, 'y sólo esos seis botones');

// Los botones viejos del informe ya no están en pantalla...
['limpiarFormulario()', 'guardarEnHistorial()', 'guardarEnPlanilla()'].forEach(a =>
    exigir(![...d.querySelectorAll('button')].some(b => b.getAttribute('onclick') === a),
        `${a} ya no tiene botón propio`));
// ...pero sus funciones siguen (las usa GUARDAR ESTUDIO y la batería)
['limpiarFormulario', 'guardarEnHistorial', 'guardarEnPlanilla', 'imprimirReporte',
 'generarReporte', 'applyPreset', 'updateChecklistBadge'].forEach(f =>
    exigir(typeof w[f] === 'function', `${f} sigue existiendo`));

// ── Nada se borró: presets, checklist, planilla, historial y firma siguen en el documento ──
['pre_consent', 'checklist-badge', 'planilla-estado', 'historial-lista', 'casuistica-buscar',
 'firma_informe', 'historial-badge', 'casuistica-badge'].forEach(id =>
    exigir(d.getElementById(id), `${id} sigue en el documento`));
exigir(d.querySelector('#panel-historial #card-historial') && d.querySelector('#panel-historial #card-casuistica'),
    'historial y casuística viven en el panel HISTORIAL');
exigir(d.querySelector('#panel-sync #card-planilla') && d.querySelector('#panel-sync #firma_informe'),
    'planilla y firma viven en el panel SINCRONIZAR');
exigir(d.getElementById('herramientas-retiradas').style.display === 'none',
    'presets y checklist quedan fuera de la pantalla');

// ── Perlas: fuera del flujo, todas en el panel ──
exigir(!d.querySelector('.pearl-container'), 'no quedan perlas en medio de las secciones');
w.abrirPanel('perlas');
const temas = d.querySelectorAll('#perlas-lista details').length;
exigir(temas === Object.keys(w.eval('PEARLS_DATA')).length, `el panel muestra todos los temas (${temas})`);
exigir(!d.getElementById('panel-perlas').hidden, 'el panel se abre');
w.cerrarPanel();
exigir(d.getElementById('panel-perlas').hidden, 'y se cierra');

// ── Orden: motilidad antes que el eco post-esfuerzo ──
const html = fs.readFileSync(path.join(PROJ, 'index.html'), 'utf8');
exigir(html.indexOf('id="svg-reposo"') < html.indexOf('id="fevi_pico"'),
    'la motilidad va antes que el eco post-esfuerzo');
exigir(html.indexOf('id="fevi_pico"') < html.indexOf('id="sec-especiales"'),
    'y situaciones especiales después del eco post');
['sec-identificacion', 'sec-reposo', 'sec-esfuerzo', 'sec-motilidad', 'sec-post', 'sec-especiales', 'sec-informe']
    .forEach(id => exigir(d.querySelector(`.quick-nav a[href="#${id}"]`) && d.getElementById(id),
        `la barra salta a ${id}`));

// ── Ningún color fijo escrito en el HTML, salvo la paleta de grados del pincel ──
const inline = [...html.matchAll(/style="([^"]*)"/g)].map(m => m[1])
    .filter(st => /#[0-9a-f]{3,6}\b|rgb\(|(^|;)\s*(color|background(-color)?)\s*:\s*(white|black|red)/i.test(st))
    .filter(st => !/^--mb-color:#[0-9a-f]{6}$/i.test(st.trim()));
exigir(!inline.length, `sin colores inline en index.html (${inline.join(' | ')})`);

// ── Situaciones especiales: se abre sola en un estudio valvular ──
const det = d.getElementById('especiales-detalle');
det.open = false;
w.setSpecialTab('viabilidad');
d.getElementById('indicacion').value = 'eao_moderada';
d.getElementById('indicacion').dispatchEvent(new w.Event('change', { bubbles: true }));
exigir(det.open && w.eval('currentSpecialTab') === 'eao_ejercicio',
    'con indicación de EAo se abre en la pestaña de EAo con ejercicio');
d.getElementById('indicacion').value = '';

// ── BORRAR TODO sin preguntar, con Deshacer que devuelve el estudio entero ──
casoBase(w);
todoNormal(w);
w.eval("WM.estres[1] = 3; WM.estres[7] = 3;");
w.updateWMSI();
d.getElementById('paciente_id').value = 'HC-99';
// Mismo estado que tiene la app tras los eventos de carga (el arnés no los dispara).
w.autocompletarInterpretacion();
const antes = informe(w).texto;
let pregunto = false;
w.confirm = () => { pregunto = true; return true; };
w.borrarTodo();
exigir(!pregunto, 'BORRAR TODO no pide confirmación');
exigir(d.getElementById('paciente_id').value === '', 'el estudio quedó vacío');
exigir(w.eval('WM.reposo[1]') === 1 && w.eval('MOTILIDAD_TOCADA') === false,
    'la motilidad vuelve en verde y sin leer, como al abrir la app');
const barra = d.getElementById('undo-reset');
exigir(barra, 'aparece el Deshacer');
barra.querySelector('button').click();
exigir(d.getElementById('paciente_id').value === 'HC-99', 'Deshacer devuelve los datos');
exigir(w.eval('WM.estres[1]') === 3 && w.eval('WM.estres[7]') === 3, 'y la motilidad');
exigir(w.eval('MOTILIDAD_TOCADA') === true, 'con la motilidad como leída, igual que antes');
exigir(informe(w).texto === antes, 'el informe vuelve a ser idéntico al de antes de borrar');

// ── GUARDAR ESTUDIO: una sola decisión sobre la edición, historial + planilla ──
casoBase(w); todoNormal(w);
d.getElementById('paciente_id').value = 'HC-100';
w.generarInforme();
const out = d.getElementById('reporte-output');
out.textContent = out.textContent + ' Texto agregado a mano.';
w.marcarInformeEditado();
let preguntas = 0;
w.confirm = () => { preguntas++; return false; };   // conservar la edición
w.eval('EstresSheets.estaConfigurado = () => true');
let enviado = null;
w.eval('EstresSheets.construirFila = (inf) => { window.__fila = inf; return ["x"]; }');
w.eval('EstresSheets.encolar = () => ({ ok: true })');
w.guardarEstudio().then(() => {
    enviado = w.__fila;
    exigir(preguntas === 1, `la edición a mano se pregunta una sola vez (fueron ${preguntas})`);
    const hist = JSON.parse(w.localStorage.getItem('eco-estres-historial') || '[]');
    exigir(hist[0] && hist[0].reporte.includes('Texto agregado a mano.'), 'el historial guarda la edición');
    exigir(enviado && enviado.includes('Texto agregado a mano.'), 'y la planilla recibe el mismo texto');
    exigir(w.eval('INFORME_DECIDIDO') === null, 'la decisión no queda pegada para el próximo guardado');
    if (fallas) { console.log(`\n${fallas} falla(s)`); process.exit(1); }
    console.log('Sin fallas — estética v2.3: botonera, paneles, perlas, orden y deshacer');
});
