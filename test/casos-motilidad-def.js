// Los 19 casos de la tanda de motilidad (super prompt v2, 04/11/2026). Los usa el
// test y el volcado que se le muestra a Lucas: una sola definición para los dos.
const fijos = m => ({ reposo: m, estres: m });
const CASOS = [
  { n: 1,  t: 'Hipoquinesia nueva en territorio DA, reposo normal', estres: { 7: 3, 8: 3, 13: 3, 14: 3 } },
  { n: 2,  t: 'Hipoquinesia nueva anterolateral basal y media', estres: { 6: 2, 12: 2 } },
  { n: 3,  t: 'Hipoquinesia DA en reposo que se mantiene igual', ...fijos({ 7: 3, 8: 3, 13: 3, 14: 3 }) },
  { n: 4,  t: 'Aquinesia inferior en reposo que se mantiene', ...fijos({ 4: 4, 10: 4 }) },
  { n: 5,  t: 'Aquinesia inferior + hipoquinesia inferolateral fijas', ...fijos({ 4: 4, 10: 4, 5: 3, 11: 3 }) },
  { n: 6,  t: 'BCRI con septum alterado en reposo y esfuerzo', campos: { ant_bcri: true }, ...fijos({ 2: 3, 3: 3, 8: 3, 9: 3 }) },
  { n: 7,  t: 'BCRI + hipoquinesia inferolateral fija', campos: { ant_bcri: true }, ...fijos({ 5: 3, 11: 3 }) },
  { n: 8,  t: 'Miocardiopatía dilatada, FEy 30 % (FEy cargada después del bull\'s eye)',
    campos: { fevi_reposo: 30, fevi_pico: 32 }, feyDespues: true,
    ...fijos(Object.fromEntries(Array.from({ length: 17 }, (_, i) => [i + 1, 3]))) },
  { n: 9,  t: 'IAM anterior (aquinesia DA fija) + 1 segmento lateral nuevo', campos: { ant_iam: true },
    reposo: { 7: 4, 8: 4, 13: 4, 14: 4 }, estres: { 7: 4, 8: 4, 13: 4, 14: 4, 12: 2 } },
  { n: 10, t: 'Multivaso real: hipoquinesia nueva DA + inferior', estres: { 7: 3, 13: 3, 4: 3, 10: 3 } },
  { n: 11, t: 'Hipoquinesia inferior en reposo → aquinesia con esfuerzo (IAM cargado)', campos: { ant_iam: true },
    reposo: { 4: 3, 10: 3 }, estres: { 4: 4, 10: 4 } },
  { n: 12, t: 'Hipoquinesia leve → moderada inferior: sin isquemia', reposo: { 4: 2, 10: 2 }, estres: { 4: 3, 10: 3 } },
  { n: 13, t: 'Patrón apical nuevo (13–17)', estres: { 13: 3, 14: 3, 15: 3, 16: 3, 17: 3 } },
  { n: 14, t: 'Hipoquinesia inferior en reposo → normal con esfuerzo', reposo: { 4: 3, 10: 3 }, estres: {} },
  { n: 15, t: 'BCRI + isquemia nueva lateral', campos: { ant_bcri: true }, estres: { 5: 3, 11: 3, 6: 3, 12: 3 } },
  { n: 16, t: 'Disquinesia apical → aquinesia: sin cambio, no mejoría',
    reposo: { 13: 5, 14: 5, 15: 5, 16: 5, 17: 5 }, estres: { 13: 4, 14: 4, 15: 4, 16: 4, 17: 4 } },
  { n: 17, t: 'Secuela DA fija + isquemia nueva inferior', campos: { ant_iam: true },
    reposo: { 7: 4, 8: 4, 13: 4, 14: 4 }, estres: { 7: 4, 8: 4, 13: 4, 14: 4, 4: 3, 10: 3 } },
  { n: 18, t: 'Aquinesia extensa de 12 segmentos en reposo, FEy 35 %', campos: { fevi_reposo: 35, fevi_pico: 36, ant_iam: true },
    ...fijos({ 1: 4, 2: 4, 7: 4, 8: 4, 13: 4, 14: 4, 17: 4, 3: 4, 4: 4, 9: 4, 10: 4, 15: 4 }) },
  { n: 19, t: 'Grados mixtos nuevos: aquinesia anterior medio-apical + hipoquinesia leve anterior basal',
    estres: { 7: 4, 13: 4, 1: 2 } },
];

function armar(w, h, caso, opciones = {}) {
    const { set, casoBase, todoNormal } = h;
    w.resetFormulario();
    casoBase(w);
    todoNormal(w);
    const campos = { ...(caso.campos || {}) };
    const feyAntes = !(caso.feyDespues && !opciones.feyAntes);
    const diferidos = {};
    Object.entries(campos).forEach(([id, val]) => {
        if (!feyAntes && id.startsWith('fevi_')) { diferidos[id] = val; return; }
        const el = set(w, id, val);
        if (el.type === 'checkbox' && el.onchange) el.onchange();
    });
    Object.entries(caso.reposo || {}).forEach(([id, v]) => w.setScore(Number(id), 'reposo', v));
    Object.entries(caso.estres || {}).forEach(([id, v]) => w.setScore(Number(id), 'estres', v));
    Object.entries(diferidos).forEach(([id, val]) => set(w, id, val));
    w.autocompletarInterpretacion();
    const H = w.recolectarHallazgos();
    const N = w.construirNarrativa(H);
    const O = w.informeOsecac(H);
    return { H, rama: N.rama, texto: N.texto, piezas: N.piezas, O };
}

module.exports = { CASOS, armar };
