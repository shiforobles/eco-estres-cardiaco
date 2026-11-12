// FEy baja o hipoquinesia global ≠ miocardiopatía dilatada (12/11/2026).
// El informe describe morfología (dilatado o no, por DDVI) y función (por FEy) por
// separado, y no nombra por su cuenta miocardiopatía dilatada, cardiopatía isquémica,
// hipertensiva ni valvular. Esos diagnósticos sólo salen en Antecedentes si los marcó
// el médico.
const { cargarApp, casoBase, set, puntajes, todoNormal, informe } = require('./harness');

let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };
const ver = process.argv.includes('--ver');
const ETIOLOGIA = /miocardiopat[ií]a dilatada|cardiopat[ií]a isqu[eé]mica|(cardiopat[ií]a|miocardiopat[ií]a) hipertensiva|miocardiopat[ií]a valvular/i;
const GLOBAL = Object.fromEntries(Array.from({ length: 17 }, (_, i) => [i + 1, 2]));
const DA = { 1: 3, 2: 3, 7: 3, 8: 3, 13: 3, 14: 3, 17: 3 };

const CASOS = [
    { t: 'FEy 60 %, VI normal',                        ddvi: 48, fey: 60, seg: null,   dilatado: false },
    { t: 'FEy 25 %, VI no dilatado, hipoquinesia global', ddvi: 50, fey: 25, seg: GLOBAL, dilatado: false, global: true },
    { t: 'FEy 25 %, VI dilatado, hipoquinesia global',    ddvi: 66, fey: 25, seg: GLOBAL, dilatado: true,  global: true },
    { t: 'FEy 42 %, VI dilatado',                         ddvi: 64, fey: 42, seg: null,   dilatado: true },
    { t: 'FEy 28 %, VI dilatado, alteraciones segmentarias (DA)',     ddvi: 64, fey: 28, seg: DA,     dilatado: true },
];

for (const c of CASOS) {
    const w = cargarApp();
    casoBase(w);
    todoNormal(w);
    set(w, 'sexo', 'M'); set(w, 'peso', 80); set(w, 'altura', 175);
    set(w, 'ddvi', c.ddvi); set(w, 'siv_d', 9); set(w, 'pp_d', 9);
    if (c.seg) puntajes(w, c.seg, c.seg);
    set(w, 'fevi_reposo', c.fey); set(w, 'fevi_pico', c.fey + 2);
    if (c.global) exigir(w.document.getElementById('patron_motilidad').value === 'global', `${c.t}: se esperaba patrón global`);
    const H = w.recolectarHallazgos();
    const O = w.informeOsecac(H);
    const largo = informe(w).texto;
    const todo = [O.reposo, O.esfuerzo, O.conclusion, largo].join('\n');
    if (ver) console.log(`\n── ${c.t} ──\nREPOSO: ${O.reposo}\nCONCLUSIÓN: ${O.conclusion}`);
    exigir(!ETIOLOGIA.test(todo), `${c.t}: aparece un diagnóstico etiológico`);
    exigir(/dilata/i.test(O.reposo) === c.dilatado, `${c.t}: la dilatación debe seguir al DDVI, no a la FEy`);
    exigir(new RegExp(`FEy ${c.fey} ?%`).test(O.reposo), `${c.t}: falta la FEy en el reposo`);
}

// Marcada por el médico en Antecedentes, sí puede figurar (ahí, no en la conclusión)
{
    const w = cargarApp(); casoBase(w); todoNormal(w);
    set(w, 'ant_mcd', true);
    exigir(/miocardiopat[ií]a dilatada/i.test(informe(w).texto), 'antecedente consignado: debe figurar en el informe');
}

console.log(fallas ? `${fallas} fallas` : `Sin fallas — sin etiología automática: ${CASOS.length} escenarios + antecedente consignado`);
process.exit(fallas ? 1 : 0);
