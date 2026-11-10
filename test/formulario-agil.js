// Persistencia aditiva y protecciones del formulario compacto. Datos ficticios;
// jsdom usa su propio localStorage y esta prueba no realiza envíos de red.
const assert = require('node:assert/strict');
const { cargarApp, casoBase, todoNormal, set } = require('./harness');

const w = cargarApp(), d = w.document;
casoBase(w); todoNormal(w);
set(w, 'paciente_id', 'PRUEBA-FORMULARIO');
w.autocompletarInterpretacion();
const antes = w.construirNarrativa(w.recolectarHallazgos()).texto;
const huella = w.huellaDelEstudio();
const sheets = w.eval('EstresSheets');
const cabecera = 'ECOCARDIOGRAMA DE ESTRÉS\nPRUEBA-FORMULARIO\n\n';
// Id fijo: la columna 'ID' es un timestamp al azar por llamada; se fija para que la
// comparación de abajo mida el contenido, no el id.
const ID_FIJO = 'ee-test-formulario';
const filaAntes = sheets.construirFila(cabecera + antes, ID_FIJO);

// Campo propio: no reutiliza el texto libre heredado ni cambia las salidas.
const aclaracion = 'ACLARACION_FICTICIA: Infradesnivel del ST en PEG previa';
set(w, 'indicacion_aclaracion', aclaracion);
w.autocompletarInterpretacion();
assert.equal(w.captureFields().indicacion_aclaracion, aclaracion);
// Desde v2.4 (pedido de Lucas, 03/11/2026) la aclaración sale en la línea de
// Indicación del informe. A la planilla todavía no: el contrato no cambia.
assert.notEqual(w.huellaDelEstudio(), huella, 'cambiar la aclaración desactualiza el informe');
const conAclaracion = w.construirNarrativa(w.recolectarHallazgos()).texto;
assert.match(conAclaracion, /Indicación: Diagnóstico de Isquemia \(ACLARACION_FICTICIA: Infradesnivel del ST en PEG previa\)/);
assert.equal(conAclaracion.replace(' (' + aclaracion + ')', ''), antes,
    'fuera de la línea de Indicación el informe no cambia');
assert.deepEqual(sheets.construirFila(cabecera + antes, ID_FIJO), filaAntes,
    'la aclaración no se añade al contrato ni al contenido enviado a Sheets');
assert.equal(d.querySelectorAll('#indicacion_aclaracion').length, 1);
assert.ok(d.getElementById('indicacion_libre'), 'el campo heredado se conserva');

// Borrador: no subir su versión ni perder los campos anteriores. Lleva el id del
// estudio, para que recuperarlo reguarde sobre la misma fila del Sheet.
w.saveDraft();
const borrador = w.readDraft();
assert.equal(borrador.version, w.eval('DRAFT_VERSION'));
assert.equal(borrador.fields.indicacion_aclaracion, aclaracion);
assert.ok(borrador.estudioId, 'el borrador guarda el id del estudio');
set(w, 'indicacion_aclaracion', 'Otra aclaración ficticia');
w.aplicarEstudio(borrador);
assert.equal(d.getElementById('indicacion_aclaracion').value, aclaracion);
assert.equal(d.getElementById('paciente_id').value, 'PRUEBA-FORMULARIO');
assert.equal(w.eval('estudioId'), borrador.estudioId, 'recuperar conserva el id del estudio');

// Desde v2.4 la aclaración sale en el informe generado (línea de Indicación).
w.generarInforme();
assert.ok(d.getElementById('reporte-output').textContent.includes('ACLARACION_FICTICIA'),
    'el informe generado lleva la aclaración');

// Registro viejo: ausencia de la clave no hereda texto del otro paciente.
const viejo = JSON.parse(JSON.stringify(borrador));
delete viejo.fields.indicacion_aclaracion;
w.aplicarEstudio(viejo);
assert.equal(d.getElementById('indicacion_aclaracion').value, '');
assert.equal(d.getElementById('paciente_id').value, 'PRUEBA-FORMULARIO');
assert.ok(!Object.hasOwn(viejo.fields, 'indicacion_aclaracion'), 'no mutar el registro viejo');

// Orden visual en DOM: conserva eventos, límites y unidades de los mismos campos.
const precede = (a, b) => !!(d.getElementById(a).compareDocumentPosition(d.getElementById(b)) & 4);
assert.ok(precede('siv_d', 'pp_d') && precede('pp_d', 'ddvi'));
assert.ok(precede('volvi_reposo', 'vtd_reposo') && precede('vtd_reposo', 'vts_reposo'));
assert.ok(precede('vtd_pico', 'vts_pico'));
for (const id of ['vts_reposo', 'vts_pico']) {
    assert.match(d.querySelector(`label[for="${id}"]`).textContent, /opcional/);
    assert.equal(d.getElementById(id).required, false);
}

// Ayudas y tabla son nativas, accesibles por teclado y cerradas por defecto.
for (const id of ['ayuda-antecedentes', 'ayuda-hemodinamia', 'completud-detalle']) {
    assert.equal(d.getElementById(id).tagName, 'DETAILS');
    assert.equal(d.getElementById(id).open, false);
    assert.ok(d.getElementById(id).querySelector(':scope > summary'));
}
// La tabla "Ver detalle por segmentos" se retiró en la tanda de motilidad.
assert.equal(d.getElementById('detalle-segmentos'), null);
assert.equal(d.getElementById('segments-tbody'), null);
assert.match(d.getElementById('criterios-propios-nota').textContent, /no de guía/);
assert.ok(d.getElementById('aviso-dp') && d.getElementById('aviso-adquisicion'));
assert.ok(d.getElementById('ej_mets_origen'), 'la procedencia del resultado permanece fuera de la ayuda');

// Plegar no desactiva errores ni los convierte en éxito.
assert.equal(w.mostrarValidacion([{ nivel: 'error', txt: 'Error ficticio' },
    { nivel: 'warn', txt: 'Aviso ficticio' }]), false);
assert.equal(d.getElementById('completud-detalle').open, false);
assert.equal(d.getElementById('completud-resumen').textContent, '1 error · 1 aviso');
assert.match(d.getElementById('validacion-panel').textContent, /Error ficticio/);
assert.equal(w.mostrarValidacion([]), true);
assert.equal(d.getElementById('completud-resumen').textContent, 'Sin observaciones');
const textoAnterior = d.getElementById('reporte-output').textContent;
set(w, 'ej_causa_detencion', '');
w.generarInforme();
assert.equal(d.getElementById('reporte-output').textContent, textoAnterior,
    'la causa ausente sigue bloqueando la generación');
assert.equal(d.activeElement.id, 'ej_causa_detencion');
assert.match(d.getElementById('validacion-panel').textContent, /Falta la causa de detención/);

// Las casillas conservan su efecto aunque la explicación esté plegada.
set(w, 'ant_bcri', true);
const H = w.recolectarHallazgos();
assert.equal(H.conduccionLimita, true);
assert.equal(H.stInterpretable, false);
assert.equal(d.getElementById('ayuda-antecedentes').open, false);

console.log('Sin fallas — formulario ágil: borrador, id de estudio, registro antiguo, salidas y protecciones');
w.close();
