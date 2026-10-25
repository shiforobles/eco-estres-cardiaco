// Medidas del VI implausibles.
const { cargarApp, set, casoBase, todoNormal, informe, linea } = require('./harness');

const w = cargarApp();
casoBase(w);
set(w, 'peso', 80);
set(w, 'altura', 175);
todoNormal(w);

const casos = [
    { n: 'correcto 48/9/9',        ddvi: 48, siv: 9,  pp: 9,  ok: true },
    { n: 'RWT 8,67: DDVI 3/PP 13', ddvi: 3,  siv: 9,  pp: 13, ok: false },
    { n: 'RWT 1,82: DDVI 11/PP 10',ddvi: 11, siv: 10, pp: 10, ok: false },
    { n: 'RWT 1,82: DDVI 44/PP 40',ddvi: 44, siv: 40, pp: 40, ok: false },
    { n: 'todo en cm 4,8/0,9/0,9', ddvi: 4.8, siv: 0.9, pp: 0.9, ok: false },
    { n: 'chico real 30/6/6',      ddvi: 30, siv: 6,  pp: 6,  ok: true },
    { n: 'MCH severa 44/22/18',    ddvi: 44, siv: 22, pp: 18, ok: true },
    { n: 'dilatada extrema 78/10/10', ddvi: 78, siv: 10, pp: 10, ok: true },
    { n: 'combinación imposible 25/25/25', ddvi: 25, siv: 25, pp: 25, ok: false },
    { n: 'HVI real 52/14/13',      ddvi: 52, siv: 14, pp: 13, ok: true },
    { n: 'dilatado 68/9/9',        ddvi: 68, siv: 9,  pp: 9,  ok: true },
    { n: 'DDVI 90 (fuera)',        ddvi: 90, siv: 9,  pp: 9,  ok: false },
    { n: 'PP 30 (fuera)',          ddvi: 48, siv: 9,  pp: 30, ok: false },
    { n: 'tipeo a medio: DDVI 3',  ddvi: 3,  siv: 0,  pp: 0,  ok: false },
];

let fallas = 0;
casos.forEach(c => {
    set(w, 'ddvi', c.ddvi); set(w, 'siv_d', c.siv); set(w, 'pp_d', c.pp);
    w.calcGeometria();
    const G = w.medidasVI();
    const campoRwt = w.document.getElementById('rwt').value;
    const campoImvi = w.document.getElementById('imvi').value;
    const geo = w.document.getElementById('geometria_vi').value;
    const lRep = linea(informe(w).texto, 'Reposo');

    if (c.ok && G.problemas.length) { console.log(`✗ ${c.n}: rechaza una medida válida — ${G.problemas[0]}`); fallas++; }
    if (!c.ok && !G.problemas.length) { console.log(`✗ ${c.n}: acepta una medida imposible`); fallas++; }
    if (!c.ok && (campoRwt || campoImvi)) { console.log(`✗ ${c.n}: dejó un valor calculado`); fallas++; }
    if (!c.ok && geo) { console.log(`✗ ${c.n}: propuso geometría`); fallas++; }
    if (!c.ok && /remodelado|hipertrofia|ventricular normal/.test(lRep)) {
        console.log(`✗ ${c.n}: el informe afirma geometría`); fallas++;
    }
});

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
