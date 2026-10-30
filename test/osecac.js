// Salida para el formulario de OSECAC: tres cuadros de texto plano.
//
// Lo que se verifica acá no es la redacción —de eso se ocupan las otras baterías—
// sino el reparto: que cada cosa esté en su cuadro y en uno solo, que no quede
// interpretación fuera de la conclusión, que el ECG no se cuele, y que lo que se
// copia sea exactamente lo que se ve en pantalla.
const { cargarApp, casoBase, set, puntajes, todoNormal } = require('./harness');

let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };

// ── 1 · Texto plano, sin una sola marca de formato ───────────────
// Lo que entra al formulario tiene que poder pegarse sin limpiar nada.
const FORMATO = [
    { re: /<[a-z/!][^>]*>/i,        que: 'etiquetas HTML' },
    { re: /\*\*|__|\*\s|^\s*#/m,    que: 'marcas de markdown' },
    { re: /^[\s]*[•▪◦‣·–-]\s/m,     que: 'viñetas' },
    { re: /&(nbsp|amp|lt|gt|quot);/i, que: 'entidades HTML' },
    { re: /\t/,                      que: 'tabulaciones' },
    { re: /\u00a0/,                  que: 'espacios duros' }
];
const sinFormato = (txt, rot) => FORMATO.forEach(f =>
    exigir(!f.re.test(txt), `${rot} no puede traer ${f.que}`));

// ── Los cuatro casos ─────────────────────────────────────────────
function negativo() {
    const w = cargarApp();
    casoBase(w);
    todoNormal(w);
    set(w, 'ddvi', 48); set(w, 'siv_d', 10); set(w, 'pp_d', 9);
    set(w, 'peso', 80); set(w, 'altura', 175);
    set(w, 'volvi_reposo', 52);
    set(w, 'pp_reposo', 28);
    return w;
}

function positivoDA() {
    const w = cargarApp();
    casoBase(w);
    todoNormal(w);
    // Isquemia nueva en segmentos de la descendente anterior
    puntajes(w, {}, { 1: 3, 7: 3, 13: 3 });
    // Diastólico de esfuerzo positivo: deja ver si el dato y su interpretación se
    // reparten entre los cuadros o se repiten.
    set(w, 'e_onda_est', 120); set(w, 'e_prima_est', 7);
    set(w, 'e_prima_lat_est', 9); set(w, 'vrt_est', 3.0); set(w, 'e_prima_rep', 6);
    set(w, 'esf_max_sint', 'Angina típica');
    set(w, 'ej_causa_detencion', 'angina');
    set(w, 'ddvi', 50); set(w, 'siv_d', 11); set(w, 'pp_d', 10);
    set(w, 'peso', 82); set(w, 'altura', 172);
    set(w, 'pp_reposo', 32);
    return w;
}

function conBcri() {
    const w = cargarApp();
    casoBase(w);
    todoNormal(w);
    set(w, 'ant_bcri', true);
    set(w, 'pp_reposo', 30);
    return w;
}

function eaoModerada() {
    const w = cargarApp();
    casoBase(w);
    todoNormal(w);
    set(w, 'valv_tipo', 'eao');
    set(w, 'valv_severidad', 'moderada');
    set(w, 'ant_bicuspide', true);
    set(w, 'pp_reposo', 34);
    return w;
}

// La categorización de riesgo se deduce de los hallazgos y vive en un campo de
// pantalla: sin refrescarla, un estudio positivo puede arrastrar la categoría
// anterior. En la app lo hace generarInforme(); acá hay que pedirlo.
const preparado = f => { const w = f(); w.autocompletarInterpretacion(); return w; };

const CASOS = [
    { nombre: 'negativo',        w: preparado(negativo) },
    { nombre: 'positivo de DA',  w: preparado(positivoDA) },
    { nombre: 'con BCRI',        w: preparado(conBcri) },
    { nombre: 'EAo moderada',    w: preparado(eaoModerada) }
];

CASOS.forEach(({ nombre, w }) => {
    const H = w.recolectarHallazgos();
    const O = w.informeOsecac(H);
    const rot = `[${nombre}]`;

    // Los tres cuadros existen y ninguno queda vacío.
    ['reposo', 'esfuerzo', 'conclusion'].forEach(b =>
        exigir(O[b] && O[b].trim().length > 20, `${rot} el cuadro ${b} tiene texto`));
    sinFormato(O.texto, rot);

    // Los títulos y la línea en blanco entre cuadros.
    exigir(/^REPOSO\n/.test(O.texto), `${rot} abre con el título REPOSO`);
    exigir(O.texto.includes('\n\nESFUERZO\n'), `${rot} ESFUERZO va separado por una línea en blanco`);
    exigir(O.texto.includes('\n\nCONCLUSIÓN\n'), `${rot} CONCLUSIÓN va separado por una línea en blanco`);

    // ── 3 · REPOSO: sólo el eco basal ──
    exigir(/FEy/i.test(O.reposo), `${rot} el reposo informa la FEy`);
    exigir(/E\/e'|presiones de llenado|no consignad/i.test(O.reposo),
        `${rot} el reposo informa la función diastólica`);
    exigir(/presión sistólica pulmonar/i.test(O.reposo),
        `${rot} el reposo informa la presión pulmonar, aunque sea para decir que falta`);
    // Nada del esfuerzo se cuela en el cuadro de reposo.
    exigir(!/post-esfuerzo|doble producto|METs|FC máxima|Kgm\/min/i.test(O.reposo),
        `${rot} el cuadro de reposo no habla del esfuerzo`);
    // Ni interpretación: eso vive sólo en la conclusión.
    exigir(!/prueba (positiva|negativa)|se sugiere correlación/i.test(O.reposo),
        `${rot} el cuadro de reposo no interpreta`);

    // ── 4 · ESFUERZO: hemodinamia primero, eco después ──
    const primerRenglon = O.esfuerzo.split('\n')[0];
    exigir(/doble producto/i.test(primerRenglon),
        `${rot} el primer renglón del esfuerzo trae el doble producto`);
    exigir(/% de la (frecuencia cardíaca|FC) máxima predicha|FC máxima predicha/i.test(primerRenglon),
        `${rot} y el porcentaje de la FC máxima predicha`);
    exigir(/se detuvo|detención/i.test(primerRenglon),
        `${rot} y el motivo de detención`);
    exigir(/WMSI/i.test(O.esfuerzo), `${rot} el esfuerzo trae la línea de WMSI`);
    exigir(/diastólico de esfuerzo/i.test(O.esfuerzo),
        `${rot} el esfuerzo trae el test diastólico`);
    exigir(!/se sugiere correlación/i.test(O.esfuerzo),
        `${rot} el cuadro de esfuerzo no cierra como una conclusión`);

    // ── 5 · CONCLUSIÓN: toda la interpretación, y el cierre obligado ──
    exigir(/Se sugiere correlación clínica\.?\s*$/.test(O.conclusion.trim()) ||
           /Se sugiere correlación clínica/.test(O.conclusion),
        `${rot} la conclusión cierra con "Se sugiere correlación clínica"`);
    exigir(!/^Conclusión:/.test(O.conclusion),
        `${rot} la conclusión no repite el rótulo: el cuadro ya lo dice`);
    // El informe describe el hallazgo, nunca la conducta.
    exigir(!/se recomienda|debe realizarse|indicar|derivar a|iniciar tratamiento/i.test(O.conclusion),
        `${rot} la conclusión no indica conducta`);

    // ── 6 · El ECG no va en ningún cuadro ──
    exigir(!/arritmia|extrasístole|ECG reposo|ECG post-esfuerzo/i.test(O.reposo + O.esfuerzo),
        `${rot} las arritmias y el ECG no entran en reposo ni en esfuerzo`);
});

// El dato en Esfuerzo, la interpretación en Conclusión: una vez cada cosa.
{
    const w = CASOS.find(c => c.nombre === 'positivo de DA').w;
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/Estudio diastólico de esfuerzo: Positivo\.$/m.test(O.esfuerzo),
        'con el diastólico positivo, el cuadro de esfuerzo trae sólo el resultado');
    exigir(/diastólico de esfuerzo resultó positivo/i.test(O.conclusion),
        'y la conclusión lo explica');
    exigir(!/presiones de llenado/i.test(O.esfuerzo),
        'la explicación no se repite en el cuadro de esfuerzo');
}

// En cambio un diastólico negativo sólo se dice una vez, y con su frase entera:
// la conclusión no lo menciona, así que recortarlo lo haría desaparecer.
{
    const w = CASOS.find(c => c.nombre === 'negativo').w;
    set(w, 'diast_resultado', 'negativo');
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/sin aumento de las presiones de llenado/i.test(O.esfuerzo),
        'el diastólico negativo conserva su frase en el cuadro de esfuerzo');
}

// ── 6 bis · La excepción: el ECG que cambia la interpretación ────
{
    const w = conBcri();
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/segmento ST/i.test(O.conclusion),
        'con BCRI la conclusión dice que el ST no es interpretable');
    const veces = (O.conclusion.match(/segmento ST/gi) || []).length;
    exigir(veces === 1, `y lo dice una sola vez (lo dijo ${veces})`);
    exigir(!/segmento ST/i.test(O.reposo + O.esfuerzo),
        'y no lo repite en los otros cuadros');
    // Y el septum excluido tiene que verse en el cuadro de esfuerzo o en la conclusión.
    exigir(/septal/i.test(O.esfuerzo + O.conclusion),
        'la limitación septal del BCRI se informa');
}

// Sin trastorno de conducción, el ST no se menciona porque no cambia nada.
{
    const w = negativo();
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(!/segmento ST/i.test(O.texto),
        'sin nada que lo haga relevante, el ST no aparece en ningún cuadro');
}

// Un ST isquémico con motilidad normal sí cambia la lectura: va una vez, en la
// conclusión. Si se callara, el cuadro afirmaría un negativo sin decir que el ECG
// fue positivo, y en el informe largo eso lo cubría la línea de ECG, que acá no está.
{
    const w = negativo();
    set(w, 'ecg_st_tipo', 'infra');
    set(w, 'ecg_st_morfologia', 'horizontal');
    set(w, 'ecg_st_mm', 2);
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/discordancia/i.test(O.conclusion),
        'un ST isquémico sin correlato de motilidad se informa en la conclusión');
    exigir(!/infradesnivel/i.test(O.reposo + O.esfuerzo),
        'y no en los otros cuadros');
}

// ── EAo moderada: la valvulopatía sale en el cuadro de reposo ────
{
    const w = eaoModerada();
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/estenosis aórtica/i.test(O.reposo),
        'la EAo moderada se describe en el cuadro de reposo');
    exigir(/moderada/i.test(O.reposo), 'con su severidad');
    exigir(/bicúspide/i.test(O.reposo), 'y la bicuspidia');
}

// ── Medidas del reposo: dimensiones y espesores con su número ────
{
    const w = negativo();
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/48 mm/.test(O.reposo), 'el DDVI sale con su número');
    exigir(/10 mm/.test(O.reposo), 'el septum también');
    exigir(/52 mL/.test(O.reposo), 'y el volumen auricular');
    exigir(/28 mmHg/.test(O.reposo), 'y la presión pulmonar estimada');
}

// ── 7 · Sin repetir entre cuadros ────────────────────────────────
// Los valores clave sí pueden repetirse (FEy, % FCMT, METs, territorio, WMSI); las
// frases, no. Se compara oración por oración.
CASOS.forEach(({ nombre, w }) => {
    const O = w.informeOsecac(w.recolectarHallazgos());
    const oraciones = t => (t.match(/[^.]+\./g) || [])
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 40);
    const rep = oraciones(O.reposo);
    const esf = oraciones(O.esfuerzo);
    const con = oraciones(O.conclusion);
    const repetidas = [...rep, ...esf].filter(s => con.includes(s))
        .concat(rep.filter(s => esf.includes(s)));
    exigir(repetidas.length === 0,
        `[${nombre}] una oración entera aparece en dos cuadros: "${(repetidas[0] || '').slice(0, 70)}"`);
});

// ── 2 y 8 · Los botones, y que lo copiado sea lo que se ve ───────
{
    const w = positivoDA();
    casoBase(w);
    w.generarInforme();

    const caja = w.document.getElementById('osecac-salida');
    exigir(caja && caja.style.display === 'block',
        'generar el informe muestra también los tres cuadros');

    const botones = [...w.document.querySelectorAll('#osecac-salida button')]
        .map(b => b.getAttribute('onclick') || '');
    exigir(botones.some(b => b.includes('copiarOsecacTodo')), 'hay un botón de copiar todo');
    ['reposo', 'esfuerzo', 'conclusion'].forEach(b =>
        exigir(botones.some(x => x.includes(`copiarBloqueOsecac('${b}')`)),
            `hay un botón de copiar el cuadro ${b}`));

    // Lo que se copia tiene que salir del elemento, no de una regeneración: si el
    // operador cambia un dato sin volver a generar, el botón entrega lo que está
    // viendo y no una versión nueva que nadie leyó.
    let copiado = null;
    w.navigator.clipboard = { writeText: t => { copiado = t; return Promise.resolve(); } };

    const enPantalla = {};
    ['reposo', 'esfuerzo', 'conclusion'].forEach(b => {
        enPantalla[b] = w.document.getElementById('osecac-' + b).textContent;
        w.copiarBloqueOsecac(b);
        exigir(copiado === enPantalla[b],
            `lo copiado del cuadro ${b} es exactamente lo que se ve en pantalla`);
        sinFormato(copiado, `lo copiado de ${b}`);
    });

    w.copiarOsecacTodo();
    exigir(copiado === `REPOSO\n${enPantalla.reposo}\n\nESFUERZO\n${enPantalla.esfuerzo}` +
                       `\n\nCONCLUSIÓN\n${enPantalla.conclusion}`,
        'copiar todo entrega los tres cuadros con sus títulos y una línea en blanco');

    // Y cambiar un dato sin regenerar no cambia lo que el botón entrega.
    set(w, 'fevi_reposo', 35);
    w.copiarBloqueOsecac('reposo');
    exigir(copiado === enPantalla.reposo,
        'sin volver a generar, el botón sigue entregando lo que está en pantalla');
}

// ── Presión pulmonar: cómo se dice cuando no está ────────────────
{
    const w = cargarApp(); casoBase(w); todoNormal(w);
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/Presión pulmonar no estimada\./.test(O.reposo),
        'sin el dato, el cuadro dice "Presión pulmonar no estimada"');
}

// ── 4 · Volúmenes ventriculares, opcionales ──────────────────────
{
    // Sin cargar, no se nombran en ninguna parte.
    const w = cargarApp(); casoBase(w); todoNormal(w);
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(!/VTD|VTS/.test(O.texto), 'sin cargar, los volúmenes no aparecen');

    // Cargados, cada uno en su cuadro.
    const w2 = cargarApp(); casoBase(w2); todoNormal(w2);
    set(w2, 'vtd_reposo', 110); set(w2, 'vts_reposo', 42);
    set(w2, 'vtd_pico', 104);   set(w2, 'vts_pico', 36);
    const O2 = w2.informeOsecac(w2.recolectarHallazgos());
    exigir(/VTD 110 mL/.test(O2.reposo) && /VTS 42 mL/.test(O2.reposo),
        'los volúmenes de reposo salen en el cuadro de reposo');
    exigir(/VTS post-esfuerzo 36 mL/.test(O2.esfuerzo),
        'el VTS post-esfuerzo sale como dato en la línea del esfuerzo');
    exigir(/VTD post-esfuerzo 104 mL/.test(O2.esfuerzo),
        'y el VTD post-esfuerzo también');
    exigir(!/VTD 110|VTS 42/.test(O2.esfuerzo), 'sin mezclarse con los de reposo');

    // Y no mueven ningún criterio: misma rama y mismo WMSI que sin ellos.
    const H1 = w.recolectarHallazgos(), H2 = w2.recolectarHallazgos();
    exigir(w.elegirRama(H1) === w2.elegirRama(H2),
        'cargar volúmenes no cambia la rama del informe');
    exigir(H1.wmsiEstres === H2.wmsiEstres,
        'ni el WMSI');
    // También salen en el informe largo: un dato que se carga tiene que salir.
    exigir(/VTD 110 mL/.test(w2.construirNarrativa(H2).texto),
        'y el informe largo también los trae');
}

// ── 5 · El WMSI, una sola vez dentro de ESFUERZO ─────────────────
{
    const w = CASOS.find(c => c.nombre === 'positivo de DA').w;
    const O = w.informeOsecac(w.recolectarHallazgos());
    const veces = (O.esfuerzo.match(/WMSI/g) || []).length;
    exigir(veces === 1, `el WMSI sale una vez en el cuadro de esfuerzo (salió ${veces})`);
    exigir(/WMSI 1,00 → /.test(O.esfuerzo),
        'y la que queda es la línea cuantitativa, con el delta y los segmentos');
    exigir(!/El WMSI ascendió/.test(O.esfuerzo),
        'la oración del WMSI de la descripción sale del cuadro');
    // El informe largo conserva las dos: son párrafos distintos.
    const texto = w.construirNarrativa(w.recolectarHallazgos()).texto;
    exigir(/El WMSI ascendió/.test(texto) && /^Motilidad: WMSI/m.test(texto),
        'el informe largo sigue teniendo la frase y la línea');
}

// Un territorio y FEy que cae: la plantilla de isquemia de un solo territorio NO
// engancha la caída de la FEy a la oración del WMSI, y reconstruirla como si lo
// hiciera dejaba la oración puesta y el índice dicho dos veces.
{
    const w = cargarApp(); casoBase(w); todoNormal(w);
    puntajes(w, {}, { 1: 3, 7: 3, 13: 3 });
    set(w, 'fevi_reposo', 58); set(w, 'fevi_pico', 52);
    const O = w.informeOsecac(w.recolectarHallazgos());
    const veces = (O.esfuerzo.match(/WMSI/g) || []).length;
    exigir(veces === 1,
        `con un territorio y caída de FEy, el WMSI sale una vez (salió ${veces})`);
    exigir(/FEy post-esfuerzo 52 %/.test(O.esfuerzo), 'y la FEy post-esfuerzo sigue');
}

// Con caída de la FEy, sacar la oración del WMSI no puede llevarse la FEy con ella.
{
    const w = cargarApp(); casoBase(w); todoNormal(w);
    // Isquemia extensa en dos territorios y FEy que cae: rama positivaMulti, que es
    // donde la caída de la FEy viaja pegada a la oración del WMSI.
    puntajes(w, {}, { 1: 3, 7: 3, 13: 3, 4: 3, 10: 3, 15: 3 });
    set(w, 'fevi_reposo', 58); set(w, 'fevi_pico', 50);
    const O = w.informeOsecac(w.recolectarHallazgos());
    exigir(/FEy/.test(O.esfuerzo), 'la FEy post-esfuerzo sigue en el cuadro');
    exigir(/50/.test(O.esfuerzo), 'con su número');
    exigir((O.esfuerzo.match(/WMSI/g) || []).length === 1,
        'y el WMSI sigue saliendo una sola vez');
}

// ── 1 · El informe largo cierra con la fórmula, una sola vez ─────
CASOS.forEach(({ nombre, w }) => {
    const texto = w.construirNarrativa(w.recolectarHallazgos()).texto;
    const veces = (texto.match(/Se sugiere correlación clínica/g) || []).length;
    exigir(veces === 1, `[${nombre}] el informe largo dice la fórmula de cierre una vez (dijo ${veces})`);
    exigir(/Se sugiere correlación clínica\.$/.test(texto.trim()),
        `[${nombre}] y la deja al final`);
});

// ── 3 · Los cuadros se editan, y la edición no se pisa sola ──────
{
    const w = positivoDA();
    casoBase(w);
    w.generarInforme();

    const caja = id => w.document.getElementById('osecac-' + id);
    ['reposo', 'esfuerzo', 'conclusion'].forEach(id =>
        exigir(caja(id).getAttribute('contenteditable') === 'true',
            `el cuadro ${id} se puede editar`));

    const aviso = w.document.getElementById('osecac-editado');
    exigir(aviso && aviso.style.display === 'none', 'recién generado, no hay aviso de edición');
    exigir(!w.osecacFueEditado(), 'ni edición registrada');

    // Se edita a mano
    caja('conclusion').textContent = 'Mi texto corregido a mano. Se sugiere correlación clínica.';
    w.marcarOsecacEditado();
    exigir(w.osecacFueEditado(), 'editar un cuadro queda registrado');
    exigir(aviso.style.display === 'block', 'y el aviso aparece');

    // Copiar entrega la edición, no el texto generado
    let copiado = null;
    w.navigator.clipboard = { writeText: t => { copiado = t; return Promise.resolve(); } };
    w.copiarBloqueOsecac('conclusion');
    exigir(copiado === 'Mi texto corregido a mano. Se sugiere correlación clínica.',
        'copiar entrega lo editado a mano');

    // Regenerar pregunta antes de pisar. Si se dice que no, el texto queda.
    w.confirm = () => false;
    w.generarInforme();
    exigir(caja('conclusion').textContent === 'Mi texto corregido a mano. Se sugiere correlación clínica.',
        'al decir que no, la edición sobrevive a regenerar el informe');
    exigir(w.osecacFueEditado(), 'y se sigue considerando editada');

    // Si se dice que sí, se rehace desde los datos.
    w.confirm = () => true;
    w.generarInforme();
    exigir(/Prueba de eco estrés con ejercicio positiva/.test(caja('conclusion').textContent),
        'al decir que sí, el cuadro se rehace desde los datos');
    exigir(!w.osecacFueEditado(), 'y deja de estar editado');

    // Lo editado se guarda con el borrador: cerrar el navegador no puede costarlo.
    caja('reposo').textContent = 'Reposo a mano.';
    w.marcarOsecacEditado();
    w.saveDraft();
    const d = JSON.parse(w.localStorage.getItem('eco-estres-draft'));
    exigir(d.osecac && d.osecac.reposo === 'Reposo a mano.',
        'el borrador guarda los cuadros con la edición');
    exigir(d.osecacGenerado && d.osecacGenerado.reposo !== 'Reposo a mano.',
        'y también lo que había dejado el generador, para seguir distinguiendo una cosa de la otra');

    w.restaurarCuadrosOsecac(d.osecac, d.osecacGenerado);
    exigir(caja('reposo').textContent === 'Reposo a mano.', 'y al restaurar vuelve la edición');
    exigir(w.osecacFueEditado(), 'reconocida como edición');
}

// ── El informe largo no se tocó ──────────────────────────────────
// La salida para OSECAC reparte las mismas piezas: no puede haber cambiado la
// redacción del informe que se firma.
{
    const w = positivoDA();
    const { texto, piezas } = w.construirNarrativa(w.recolectarHallazgos());
    exigir(/^Indicación:/m.test(texto), 'el informe largo sigue empezando por la indicación');
    exigir(/^Antecedentes:/m.test(texto), 'y sigue trayendo los antecedentes');
    exigir(/^ECG post-esfuerzo:/m.test(texto), 'y la línea de ECG');
    exigir(texto.includes(piezas.metodo), 'el método del informe largo es la misma pieza');
    exigir(texto.includes(piezas.esfuerzo), 'y el bloque de esfuerzo también');
    exigir(texto.includes(piezas.conclusion), 'y la conclusión');
}

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
