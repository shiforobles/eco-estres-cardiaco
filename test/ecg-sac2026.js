// ══════════════════════════════════════════════════════════════════
//  Módulo ECG — rediseño V9 y clasificación SAC 2026.
//  Los 15 casos del pedido de Lucas. Cada caso arma el estado del ECG con el modelo
//  canónico del módulo (ECGmod.aplicar) y revisa la clasificación, el texto del
//  informe (largo y cuadros de OSECAC), los avisos y, en el caso 10, la fila de planilla.
//  Al final imprime el dump de los 15 para revisar la redacción a ojo.
// ══════════════════════════════════════════════════════════════════
const { cargarApp, casoBase, todoNormal, puntajes, informe, linea } = require('./harness');

let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('  ✗ ' + m); fallas++; } };
const dumps = [];

// Un estudio base negativo (motilidad normal) salvo que el caso diga otra cosa.
function base(fn) {
    const w = cargarApp();
    casoBase(w); todoNormal(w);
    if (fn) fn(w);
    const inf = informe(w);
    const O = w.informeOsecac(inf.H);
    return { w, H: inf.H, texto: inf.texto, rama: inf.rama, O, A: inf.H.ecgCls.A };
}
function ecg(w, E) { w.ECGmod.aplicar(E); }
function registrar(nombre, r) {
    dumps.push({
        nombre,
        resultado: r.H.ecgResultado,
        reposoLargo: linea(r.texto, 'ECG reposo'),
        esfuerzoLargo: linea(r.texto, 'ECG post-esfuerzo'),
        conclusionLarga: linea(r.texto, 'Conclusión'),
        osecacReposo: r.O.reposo,
        osecacEsfuerzo: r.O.esfuerzo,
        osecacConclusion: r.O.conclusion,
        avisos: r.A
    });
}

// ── 1 · Todo normal, sin tocar nada → negativo ──
{
    const r = base();
    exigir(r.H.ecgResultado === 'Negativo', '1 · todo normal → Negativo');
    exigir(/sin trastornos de la conducción ni alteraciones del ST-T/i.test(linea(r.texto, 'ECG reposo')), '1 · reposo normal');
    exigir(/sin cambios significativos del ST-T/i.test(linea(r.texto, 'ECG post-esfuerzo')), '1 · esfuerzo normal');
    exigir(r.H.stIsquemico === false, '1 · no isquémico');
    registrar('1 · todo normal', r);
}

// ── 2 · Infra horizontal 2 mm V4-V6 desde etapa III, normaliza al min 3 → positivo ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '2', apar: 'III', recup: '3', leads: ['V4', 'V5', 'V6'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'Positivo', '2 · infra horizontal 2 mm → Positivo');
    exigir(r.H.stIsquemico === true, '2 · isquémico');
    const e = linea(r.texto, 'ECG post-esfuerzo');
    exigir(/infradesnivel del ST horizontal de 2 mm/i.test(e), '2 · magnitud y morfología');
    exigir(/V4, V5 y V6/.test(e), '2 · derivaciones');
    exigir(/desde la etapa III/i.test(e), '2 · aparición');
    exigir(/minuto 3 de la recuperación/i.test(e), '2 · recuperación');
    registrar('2 · infra horizontal 2 mm V4-V6, etapa III, recup min 3', r);
}

// ── 3 · Infra lentamente ascendente 2 mm → no concluyente ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'lent', mm: '2', leads: ['V5', 'V6'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'No concluyente', '3 · lentamente ascendente → No concluyente');
    exigir(r.H.stIsquemico === false, '3 · no isquémico (cambia lo de hoy)');
    exigir(r.A.amber.some(a => /lentamente ascendente/i.test(a)), '3 · aviso ámbar de dudoso');
    exigir(/no concluyente para isquemia/i.test(r.O.conclusion), '3 · con motilidad negativa, lo dice la conclusión OSECAC');
    registrar('3 · infra lentamente ascendente 2 mm', r);
}

// ── 4 · Infra horizontal 0,5 mm → no concluyente ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '0.5', leads: ['V5', 'V6'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'No concluyente', '4 · infra <1 mm → No concluyente');
    exigir(r.A.amber.some(a => /<1 mm/i.test(a)), '4 · aviso ámbar de <1 mm');
    registrar('4 · infra horizontal 0,5 mm', r);
}

// ── 5 · BCRI → no interpretable; el septum se maneja igual que hoy ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: ['bcri'], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '2', leads: ['V5', 'V6'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'No interpretable', '5 · BCRI → No interpretable');
    exigir(r.H.stInterpretable === false && r.H.stIsquemico === false, '5 · ST no interpretable ni isquémico');
    exigir(r.H.conduccionLimita === true && r.H.wmsiExcluyeSeptales === true, '5 · el septum queda fuera (igual que hoy)');
    exigir(/no valorable por el trastorno de conducción/i.test(linea(r.texto, 'ECG post-esfuerzo')), '5 · la línea de ECG lo dice');
    registrar('5 · BCRI', r);
}

// ── 6 · FA → no interpretable para el ST, la motilidad no cambia ──
{
    const r = base(w => ecg(w, { ritmo: 'fa', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '2', leads: ['V5', 'V6'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'No interpretable', '6 · FA → No interpretable');
    exigir(r.H.stIsquemico === false, '6 · ST no isquémico');
    exigir(r.H.conduccionLimita === false && r.H.wmsiExcluyeSeptales === false, '6 · FA NO toca el septum ni la motilidad');
    exigir(/fibrilación auricular/i.test(r.H.ecgNoInterpretableMotivo), '6 · el motivo es la FA');
    registrar('6 · FA', r);
}

// ── 7 · Infra basal 0,5 mm V5-V6 + infra de esfuerzo 1,5 mm adicional ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], q: [], arrBasal: [],
        stBasal: [{ id: 'infra', mm: '0.5', leads: ['V5', 'V6'] }],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '1.5', leads: ['V5', 'V6'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'Positivo', '7 · infra basal 0,5 + esfuerzo 1,5 → Positivo (basal <1 no invalida)');
    const e = linea(r.texto, 'ECG post-esfuerzo');
    exigir(/1,5 mm adicional respecto del basal/i.test(e), '7 · la magnitud de esfuerzo va como adicional');
    exigir(/infradesnivel del ST de 0,5 mm/i.test(linea(r.texto, 'ECG reposo')), '7 · el basal se describe en reposo');
    exigir(r.A.info.some(a => /infradesnivel basal/i.test(a)), '7 · nota técnica de adicional');
    registrar('7 · infra basal 0,5 + esfuerzo 1,5 adicional', r);
}

// ── 8 · Q en DII, DIII, aVF + supra en DII, DIII, aVF → no isquémico ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], arrBasal: [],
        q: [{ id: 'q', leads: ['DII', 'DIII', 'aVF'] }],
        stEsf: [{ id: 'supra', mm: '2', leads: ['DII', 'DIII', 'aVF'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'Negativo', '8 · supra sobre Q de secuela → no isquémico (Negativo)');
    exigir(r.H.stIsquemico === false, '8 · no isquémico');
    exigir(r.A.info.some(a => /disquinesia/i.test(a)), '8 · nota técnica de disquinesia');
    exigir(!/discordancia/i.test(r.O.conclusion), '8 · no se informa discordancia');
    registrar('8 · Q + supra en DII/DIII/aVF', r);
}

// ── 9 · Supra 2 mm en V1-V3 sin Q → positivo, aviso rojo ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'supra', mm: '2', leads: ['V1', 'V2', 'V3'] }], arrEsf: [] }));
    exigir(r.H.ecgResultado === 'Positivo', '9 · supra sin Q → Positivo');
    exigir(r.A.red.some(a => /Supradesnivel del ST en derivaciones sin ondas Q/i.test(a)), '9 · aviso rojo de isquemia transmural');
    registrar('9 · supra 2 mm V1-V3 sin Q', r);
}

// ── 10 · Infra descendente 4 mm en 6 derivaciones, recupera > min 6, con TVNS → 4 rojos ──
let fila10 = null, headers10 = null;
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'descendente', mm: '4', recup: 'gt6', leads: ['DII', 'DIII', 'aVF', 'V4', 'V5', 'V6'] }],
        arrEsf: [{ type: 'TVNS', morf: 'monomorfa' }] }));
    exigir(r.H.ecgResultado === 'Positivo', '10 · Positivo');
    const rojos = r.A.red;
    exigir(rojos.some(a => /descendente >3 mm/i.test(a)), '10 · rojo: descendente >3 mm');
    exigir(rojos.some(a => /5 o más derivaciones/i.test(a)), '10 · rojo: ≥5 derivaciones');
    exigir(rojos.some(a => /después del minuto 6/i.test(a)), '10 · rojo: recuperación > min 6');
    exigir(rojos.some(a => /Arritmia ventricular compleja/i.test(a)), '10 · rojo: arritmia ventricular compleja con isquemia');
    exigir(rojos.length >= 4, `10 · al menos 4 avisos rojos (hubo ${rojos.length})`);
    fila10 = r.w.EstresSheets.construirFila(r.texto, 'caso-10');
    headers10 = r.w.EstresSheets.HEADERS;
    registrar('10 · infra descendente 4 mm ×6, recup >min6, TVNS', r);
}

// ── 11 · BCRD + HBAI y T negativas en DIII-aVF + infra basal → dos filas por apartado ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: ['bcrd', 'hbai'], q: [], arrBasal: [],
        stBasal: [{ id: 'tneg', leads: ['DIII', 'aVF'] }, { id: 'infra', mm: '1', leads: ['V5', 'V6'] }],
        stEsf: [], arrEsf: [] }));
    const rep = linea(r.texto, 'ECG reposo');
    exigir(/BCRD/.test(rep) && /HBAI/.test(rep), '11 · las dos filas de conducción');
    exigir(/ondas T negativas en DIII y aVF/i.test(rep), '11 · T negativas');
    exigir(/infradesnivel del ST de 1 mm en V5 y V6/i.test(rep), '11 · infra basal, segunda fila del ST-T');
    registrar('11 · BCRD+HBAI, T negativas, infra basal', r);
}

// ── 12 · EV basales que desaparecen + ESV con rachas de TSV en recuperación ──
{
    const r = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [],
        arrBasal: [{ type: 'EV', freq: 'aisladas', morf: 'monomorfas', pats: [], evol: 'desaparecen' }],
        stEsf: [], arrEsf: [{ type: 'ESV', freq: 'aisladas', pats: ['rachas'], place: 'recuperacion' }] }));
    const rep = linea(r.texto, 'ECG reposo'), esf = linea(r.texto, 'ECG post-esfuerzo');
    exigir(/extrasístoles ventriculares/i.test(rep), '12 · EV basales en reposo');
    exigir(/extrasístoles ventriculares basales desaparecieron con el esfuerzo/i.test(esf), '12 · evolución con el esfuerzo');
    exigir(/rachas de taquicardia supraventricular/i.test(esf), '12 · rachas de TSV');
    exigir(/durante la recuperación/i.test(esf), '12 · en recuperación');
    registrar('12 · EV basales desaparecen + ESV con rachas en recuperación', r);
}

// ── 13 · Discordancia en ambos sentidos ──
{
    // (a) Motilidad positiva (DA) + ECG negativo → estudio positivo, sin discordancia espuria.
    const a = base(w => { puntajes(w, {}, { 1: 3, 7: 3, 13: 3 }); });
    exigir(/positiv/i.test(a.rama) || a.H.isquemicos.length > 0, '13a · motilidad positiva da estudio positivo');
    exigir(!/discordancia/i.test(a.O.conclusion), '13a · ECG negativo: sin discordancia');
    // (b) Motilidad negativa + ECG positivo → discordancia en la conclusión, como hoy.
    const b = base(w => ecg(w, { ritmo: 'sinusal', conduccion: [], stBasal: [], q: [], arrBasal: [],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '2', leads: ['V4', 'V5', 'V6'] }], arrEsf: [] }));
    exigir(b.rama === 'discordancia', '13b · motilidad normal + ST isquémico → rama discordancia');
    exigir(/discordancia/i.test(b.O.conclusion), '13b · la conclusión OSECAC dice la discordancia');
    exigir(/discordancia|infradesnivel/i.test(linea(b.texto, 'Conclusión')), '13b · y el informe largo también');
    registrar('13a · motilidad positiva + ECG negativo', a);
    registrar('13b · motilidad negativa + ECG positivo (discordancia)', b);
}

// ── 14 · Estudio viejo guardado con los campos anteriores → se abre igual ──
{
    const w = cargarApp();
    casoBase(w); todoNormal(w);
    const d = w.document;
    // Como un estudio del diseño anterior: sólo los campos viejos, sin estado del módulo.
    d.getElementById('ecg_st_tipo').value = 'infra';
    d.getElementById('ecg_st_morfologia').value = 'horizontal';
    d.getElementById('ecg_st_mm').value = '2';
    d.getElementById('ecg_conduccion').value = 'ninguno';
    // Sin tocar el módulo, el canónico cae a los campos viejos:
    let H = w.recolectarHallazgos();
    exigir(H.ecgResultado === 'Positivo', '14 · con el módulo intacto, lee los campos viejos → Positivo');
    // Y al reconstruir el bloque desde esos campos (lo que hace aplicarEstudio), el
    // modelo nuevo queda cargado igual.
    w.ECGmod.aplicar(w.ECGmod.estadoLegacy());
    const E = w.ECGmod.estadoVivo();
    exigir(E.stEsf.some(x => x.id === 'infra' && x.mm === '2'), '14 · el bloque visible se reconstruye con el infra de 2 mm');
    H = w.recolectarHallazgos();
    exigir(H.ecgResultado === 'Positivo', '14 · y sigue dando Positivo después de reconstruir');
    registrar('14 · estudio viejo reconstruido', { H, texto: informe(w).texto, rama: '', O: w.informeOsecac(H), A: H.ecgCls.A });
}

// ── 15 · Cargar hallazgos y "nuevo estudio" → todo vuelve a normal, sin sobrantes ──
{
    const w = cargarApp();
    casoBase(w); todoNormal(w);
    ecg(w, { ritmo: 'fa', conduccion: ['bcri'], stBasal: [{ id: 'hvi' }], q: [{ id: 'q', leads: ['DII'] }],
        arrBasal: [{ type: 'EV', freq: 'frecuentes', morf: 'polimorfas', pats: ['duplas'] }],
        stEsf: [{ id: 'infra', morph: 'horizontal', mm: '3', leads: ['V4', 'V5'] }],
        arrEsf: [{ type: 'TVNS', morf: 'polimorfa' }] });
    exigir(w.ECGmod.tocado() === true, '15 · con hallazgos el módulo está "tocado"');
    exigir(w.document.querySelectorAll('#ecgx_eventos .ecg-event').length === 1, '15 · hay un evento de esfuerzo');
    w.resetFormulario();
    exigir(w.ECGmod.tocado() === false, '15 · tras "nuevo estudio" el módulo vuelve a normal');
    exigir(w.document.querySelectorAll('#ecgx_eventos .ecg-event, #ecgx_eventosBasal .ecg-event').length === 0, '15 · sin eventos sobrantes');
    const E = w.ECGmod.estadoVivo();
    exigir(E.conduccion.length === 0 && E.stBasal.length === 0 && E.q.length === 0 && E.stEsf.length === 0, '15 · sin filas de hallazgos sobrantes');
    exigir(w.recolectarHallazgos().ecgResultado === 'Negativo', '15 · y el resultado vuelve a Negativo');
}

// ══ Dump para revisar la redacción ══
console.log('\n════════ TEXTOS DE LOS 15 CASOS ════════');
dumps.forEach(dd => {
    console.log('\n── ' + dd.nombre + '  [' + dd.resultado + '] ──');
    console.log('  LARGO · ' + (dd.reposoLargo || '(sin línea)').replace(/\n+/g, ' '));
    console.log('        · ' + (dd.esfuerzoLargo || '(sin línea)').replace(/\n+/g, ' '));
    console.log('  CONCL · ' + (dd.conclusionLarga || '').replace(/\n+/g, ' '));
    console.log('  OSECAC REPOSO   · ' + dd.osecacReposo.replace(/\n+/g, ' '));
    console.log('  OSECAC ESFUERZO · ' + dd.osecacEsfuerzo.replace(/\n+/g, ' '));
    console.log('  OSECAC CONCL    · ' + dd.osecacConclusion.replace(/\n+/g, ' '));
});

console.log('\n════════ FILA DE PLANILLA · CASO 10 ════════');
if (fila10) headers10.forEach((h, i) => { if (/ecg|st |ritmo|conduc|arritm|resultado|q\/secuela|interpretable/i.test(h)) console.log('  ' + h.padEnd(26) + ' = ' + fila10[i]); });

if (fallas) { console.log(`\n${fallas} FALLA(S)`); process.exit(1); }
console.log('\nSin fallas — módulo ECG SAC 2026: 15 casos');
