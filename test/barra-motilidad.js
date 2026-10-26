// La barra de carga de motilidad: pincel de grado, grupos por unión, apagado con el
// mismo botón, selector de fase y filtro de vista.
const { cargarApp, todoNormal } = require('./harness');

const w = cargarApp();
const WM = w.eval('WM');
const GRUPOS = w.eval('GRUPOS_ANATOMICOS');
const VISTAS = w.eval('VISTAS_APICALES');

let fallas = 0;
const exigir = (cond, msg) => { if (!cond) { console.log('✗ ' + msg); fallas++; } };
const scores = (fase, ids) => ids.map(id => WM[fase][id]);
const todos = (fase, ids, v) => ids.every(id => WM[fase][id] === v);

function limpiar() {
    todoNormal(w);
    w.setFaseCarga('reposo');
    if (w.eval('GRADO_PINCEL') !== null) w.setGradoPincel(w.eval('GRADO_PINCEL'));
    if (w.eval('VISTA_ACTIVA')) w.setVistaMotilidad(w.eval('VISTA_ACTIVA'));
}

// ── El pincel ────────────────────────────────────────────────────
limpiar();
w.setGradoPincel(4);
exigir(w.eval('GRADO_PINCEL') === 4, 'el pincel no quedó en 4');
w.setGradoPincel(4);
exigir(w.eval('GRADO_PINCEL') === null, 'tocar el mismo grado no soltó el pincel');

// ── Grupos: aplican el grado del pincel, en la fase elegida ──────
limpiar();
w.setGradoPincel(4);
w.aplicarGrupoMotilidad('paredes.anterior');
exigir(todos('reposo', GRUPOS.paredes.anterior, 4),
    'la pared anterior no quedó en 4: ' + scores('reposo', GRUPOS.paredes.anterior));
exigir(todos('estres', GRUPOS.paredes.anterior, 1),
    'con fase reposo no se debe escribir en estrés');

// ── Unión, no reemplazo ──────────────────────────────────────────
w.aplicarGrupoMotilidad('niveles.apicales');
exigir(todos('reposo', GRUPOS.paredes.anterior, 4) && todos('reposo', GRUPOS.niveles.apicales, 4),
    'el segundo grupo reemplazó al primero en vez de sumarse');

// ── El mismo botón apaga ─────────────────────────────────────────
w.aplicarGrupoMotilidad('niveles.apicales');
exigir(todos('reposo', GRUPOS.niveles.apicales, 1), 'el segundo toque no apagó el grupo');
exigir(WM.reposo[1] === 4 && WM.reposo[7] === 4,
    'apagar el anillo apical no debe tocar lo que no es suyo');

// ── Sin pincel, hipoquinesia leve ────────────────────────────────
limpiar();
w.aplicarGrupoMotilidad('territorios.CD');
exigir(todos('reposo', GRUPOS.territorios.CD, 2), 'sin pincel el grupo debe aplicar hipo leve (2)');

// ── Fase "ambas" ─────────────────────────────────────────────────
limpiar();
w.setFaseCarga('ambas');
w.setGradoPincel(3);
w.aplicarGrupoMotilidad('paredes.inferior');
exigir(todos('reposo', GRUPOS.paredes.inferior, 3) && todos('estres', GRUPOS.paredes.inferior, 3),
    'la fase "ambas" debe escribir en los dos bull\'s eye');

// ── El ápex: en apicales sí, en territorios no ───────────────────
exigir(GRUPOS.niveles.apicales.includes(17), 'el ápex debe estar en "apicales"');
['DA', 'CD', 'Cx'].forEach(t =>
    exigir(!GRUPOS.territorios[t].includes(17), `el ápex no debe estar en el territorio ${t}`));
limpiar();
w.setGradoPincel(4);
w.aplicarGrupoMotilidad('territorios.DA');
exigir(WM.reposo[17] === 1, 'pintar DA no debe tocar el ápex');
w.aplicarGrupoMotilidad('niveles.apicales');
exigir(WM.reposo[17] === 4, 'pintar apicales sí debe tocar el ápex');

// ── La vista es un filtro, no un pincel ──────────────────────────
limpiar();
const antes = [...Array(17)].map((_, i) => WM.reposo[i + 1]);
w.setVistaMotilidad('A4C');
const despues = [...Array(17)].map((_, i) => WM.reposo[i + 1]);
exigir(JSON.stringify(antes) === JSON.stringify(despues), 'la vista NO debe cambiar ningún puntaje');
exigir(w.eval('VISTA_ACTIVA') === 'A4C', 'la vista no quedó activa');

const opacidad = id => {
    const p = w.document.querySelector(`#svg-reposo path[data-id="${id}"]`);
    return p ? p.getAttribute('opacity') : null;
};
VISTAS.A4C.forEach(id => exigir(opacidad(id) === '1', `el segmento ${id} se ve en A4C y quedó atenuado`));
exigir(opacidad(1) !== '1', 'el segmento 1 no se ve en A4C y debería estar atenuado');

w.setVistaMotilidad('A4C');
exigir(w.eval('VISTA_ACTIVA') === null, 'tocar la misma vista no la apagó');
exigir(opacidad(1) === '1', 'al apagar la vista todo vuelve a opacidad plena');

// ── El clic directo va al bull's eye que se tocó, no a la fase ───
limpiar();
w.setFaseCarga('estres');
w.setGradoPincel(5);
w.document.querySelector('#svg-reposo path[data-id="6"]').dispatchEvent(
    new w.Event('click', { bubbles: true }));
exigir(WM.reposo[6] === 5, 'el clic en el bull\'s eye de reposo debe escribir en reposo');
exigir(WM.estres[6] === 1, 'el clic NO debe seguir al selector de fase');

// Y el segundo toque sobre el mismo grado vuelve a normal
w.document.querySelector('#svg-reposo path[data-id="6"]').dispatchEvent(
    new w.Event('click', { bubbles: true }));
exigir(WM.reposo[6] === 1, 'volver a tocar con el mismo pincel debe devolver a normal');

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
