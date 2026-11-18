// La app abre siempre en blanco (Lucas, 18/11/2026): sin aviso de recuperación,
// sin autosave y sin aplicar en silencio el borrador de un paciente anterior.
const { cargarApp, casoBase, set } = require('./harness');

let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };

// Un borrador viejo de otro paciente, como lo dejaba el autosave retirado.
const viejo = JSON.stringify({ version: 3, savedAt: new Date().toISOString(),
    estudioId: 'ee-viejo', fields: { paciente_id: 'HC-ANTERIOR', edad: '71' } });

const w = cargarApp(win => {
    win.localStorage.setItem('eco-estres-draft', viejo);
    win.localStorage.setItem('eco-estres-draft-pendiente', viejo);
});
const d = w.document;

exigir(!d.getElementById('draft-recovery-banner'), 'no aparece el aviso de recuperación');
exigir(!/estudio sin terminar/i.test(d.body.textContent), 'ni su texto');
exigir(d.getElementById('paciente_id').value === '', 'el formulario abre en blanco (HC)');
exigir(d.getElementById('edad').value === '', 'el formulario abre en blanco (edad)');
exigir(w.eval('estudioId') !== 'ee-viejo', 'el estudio nuevo no hereda el id del borrador');
['eco-estres-draft', 'eco-estres-draft-pendiente'].forEach(k =>
    exigir(w.localStorage.getItem(k) === null, `se borró la clave ${k}`));

// Cargar datos ya no escribe nada en localStorage.
casoBase(w);
set(w, 'paciente_id', 'HC-NUEVO');
exigir(w.localStorage.getItem('eco-estres-draft') === null, 'cargar datos no guarda borrador');
w.dispatchEvent(new w.Event('pagehide'));
exigir(w.localStorage.getItem('eco-estres-draft') === null, 'cerrar la pestaña tampoco');

// El Deshacer de BORRAR TODO sigue devolviendo el estudio con su id.
const id = w.eval('estudioId');
w.borrarTodo();
exigir(d.getElementById('paciente_id').value === '', 'BORRAR TODO limpia');
exigir(w.eval('estudioId') !== id, 'y empieza otro estudio');
d.querySelector('#undo-reset button').click();
exigir(d.getElementById('paciente_id').value === 'HC-NUEVO', 'Deshacer devuelve los datos');
exigir(w.eval('estudioId') === id, 'y el id del estudio');
exigir(w.localStorage.getItem('eco-estres-draft') === null, 'sin escribir borrador');

if (fallas) { console.log(`sin-borrador: ${fallas} falla(s)`); process.exit(1); }
console.log('✓ sin-borrador: la app abre en blanco, sin aviso ni autosave; Deshacer intacto');
