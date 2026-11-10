/* ════════════════════════════════════════════════════════════════
   CAPA DE ESTRÉS SOBRE LOS MOTORES DE DOPPLER

   Los motores de `vendor/doppler/` no se tocan. Todo lo propio de eco
   estrés vive acá:

   1. CINCO GRADOS. Doppler puntúa 1-4 y dice "hipoquinesia" a secas; acá
      se distingue leve de moderada. `describe()` lee los sustantivos de
      `this.NOUNS` y el orden de `this.SEVERITY_ORDER`, así que alcanza con
      heredar el motor y redefinir esas dos propiedades: el motor sigue
      agrupando y comprimiendo igual, con cinco grados en vez de cuatro.

   2. EL ÁPEX. El Motor A analiza los segmentos 1-16 y descarta el 17 en
      silencio. Acá el ápex se puntúa, aparece en el bull's eye y
      `esPatronApical()` lo cuenta. Si quedara fuera, un ápex aquinético
      saldría como "motilidad conservada" y la guarda de coherencia
      dispararía, con razón. La cláusula del ápex se agrega acá.

   3. LA REDACCIÓN DE LOS NIVELES. "baso-medial" es jerga: acá se dice
      "basales y medios".
   ════════════════════════════════════════════════════════════════ */

(function (raiz) {
    'use strict';

    const Engine = raiz.MotilityEngine;
    const Territory = raiz.TerritoryEngine;
    if (!Engine) return;   // los motores no cargaron: la app sigue con su texto propio

    // ── 1 · Los cinco grados ─────────────────────────────────────
    const MotorA5 = Object.create(Engine);
    MotorA5.NOUNS = {
        2: 'hipoquinesia leve',
        3: 'hipoquinesia moderada',
        4: 'aquinesia',
        5: 'disquinesia',
    };
    // Se redacta primero lo más severo.
    MotorA5.SEVERITY_ORDER = [5, 4, 3, 2];

    // ── 3 · Los niveles, sin jerga ───────────────────────────────
    // "baso-medial" se reemplaza por lenguaje llano. NO por "basales y medios": el
    // motor inserta este fragmento en tres contextos con distinto género y número
    //   · "de las paredes anterior y anteroseptal, ___"   → femenino plural
    //   · "de predominio septal ___"                      → masculino plural
    //   · "anteroseptal ___"                              → singular
    // y una sola forma flexionada da mala concordancia en dos de los tres
    // ("las paredes ... basales y medios"). "A nivel basal y medio" es invariable y
    // entra bien en los tres, con el mismo registro llano.
    const NIVEL_LLANO = 'a nivel basal y medio';
    MotorA5._levelSpan = function (segs) {
        const span = Engine._levelSpan.call(this, segs);
        return span === 'baso-medial' ? NIVEL_LLANO : span;
    };
    // `_matchWallPair` arma "{pared} baso-medial" inline: se limpia sobre el final.
    const limpiarNiveles = t => t.replace(/baso-medial(es)?/g, NIVEL_LLANO);

    // ── 2 · El ápex ──────────────────────────────────────────────
    const APEX = 17;
    const NOMBRE_GRADO = {
        2: 'hipoquinesia leve', 3: 'hipoquinesia moderada',
        4: 'aquinesia', 5: 'disquinesia',
    };

    /** Convierte WM[fase] al mapa que esperan los motores. El 0 (no evaluado) va como
     *  normal: el motor no tiene forma de expresar "no se vio" y afirmarlo como
     *  alterado sería peor. La línea de Calidad ya informa cuántos se evaluaron. */
    function estadoDeFase(wm) {
        const st = {};
        for (let id = 1; id <= 17; id++) st[id] = wm[id] > 0 ? wm[id] : 1;
        return st;
    }

    // ── 4 · Lo que el Motor A no resuelve bien en estrés ────────────
    // (super prompt de motilidad, 04/11/2026). Se corrige ACÁ y no en vendor/: los
    // motores son copia byte a byte de la app de eco Doppler. Cuando la fuente lo
    // arregle, esta capa deja de dispararse sola.
    //
    //  a) Casos extensos: el motor enumera ("con extensión de los segmentos anterior
    //     basal, anteroseptal basal, inferoseptal basal…"). Con cuatro o más
    //     segmentos enumerados se redacta por PARED.
    //  b) Casquete apical: los cinco apicales con el mismo grado, y nada más, son
    //     "la totalidad del casquete apical", no cinco nombres.
    //  c) Global: "hipoquinesia global…, con hipoquinesia del ápex" decía el ápex
    //     dos veces: lo global ya lo incluye.
    const PAREDES = [
        { nombre: 'anterior',      segs: [1, 7, 13] },
        { nombre: 'anteroseptal',  segs: [2, 8] },
        { nombre: 'inferoseptal',  segs: [3, 9] },
        { nombre: 'inferior',      segs: [4, 10, 15] },
        { nombre: 'inferolateral', segs: [5, 11] },
        { nombre: 'anterolateral', segs: [6, 12] },
    ];
    const NIVEL = id => id <= 6 ? 'basal' : id <= 12 ? 'medio' : 'apical';
    const SUELTOS = { 14: 'del segmento apical septal', 16: 'del segmento apical lateral', 17: 'del ápex' };
    const lista = xs => xs.length <= 1 ? (xs[0] || '')
        : xs.slice(0, -1).join(', ') + (/^(i|hi)/i.test(xs[xs.length - 1]) ? ' e ' : ' y ') + xs[xs.length - 1];

    /** Dónde está un grupo de segmentos, por pared. Devuelve "de las paredes X e Y en
     *  toda su extensión, de la pared Z a nivel basal y del ápex". */
    function ubicacionPorPared(ids) {
        const S = new Set(ids);
        const completas = [], parciales = [];
        PAREDES.forEach(p => {
            const dentro = p.segs.filter(id => S.has(id));
            if (!dentro.length) return;
            if (dentro.length === p.segs.length) completas.push(p.nombre);
            else parciales.push(`de la pared ${p.nombre} a nivel ${lista(dentro.map(NIVEL))}`);
        });
        const partes = [];
        if (completas.length === 1) partes.push(`de la pared ${completas[0]} en toda su extensión`);
        else if (completas.length > 1) partes.push(`de las paredes ${lista(completas)} en toda su extensión`);
        partes.push(...parciales);
        [14, 16, 17].forEach(id => { if (S.has(id)) partes.push(SUELTOS[id]); });
        return lista(partes).replace(/ y de(l| la| las) /g, ' y de$1 ');
    }

    function describirPorPared(st) {
        const grupos = [5, 4, 3, 2].map(g => {
            const ids = Object.keys(st).map(Number).filter(id => st[id] === g);
            return ids.length ? `${NOMBRE_GRADO[g]} ${ubicacionPorPared(ids)}` : '';
        }).filter(Boolean);
        return mayuscula(grupos.join('; ') + '.');
    }

    const ENUMERA_DEMASIADO = /de los segmentos [^.;]*?,[^.;]*?,[^.;]*?(,| y | e )/;
    const APICALES = [13, 14, 15, 16, 17];

    /**
     * Texto de motilidad de una fase, con los motores de Doppler.
     * @param {Object} wm   WM.reposo o WM.estres
     * @param {number[]} excluir  segmentos no valorables (septales por conducción)
     * @returns {{texto: string, territorio: string, normal: boolean}}
     */
    function describirFase(wm, excluir) {
        const st = estadoDeFase(wm);
        (excluir || []).forEach(id => { st[id] = 1; });   // fuera del análisis, como del WMSI

        const apexAnormal = st[APEX] > 1;
        // El motor descarta el 17 solo; se lo saca explícito para que el núcleo del
        // texto no dependa de un detalle interno suyo.
        const sinApex = { ...st };
        sinApex[APEX] = 1;

        const anormales = Object.keys(st).map(Number).filter(id => st[id] > 1);
        const hayOtros = Object.keys(sinApex).some(id => sinApex[id] > 1);
        let texto;

        if (!hayOtros && !apexAnormal) {
            texto = Engine.NORMAL_TEXT;
        } else if (!hayOtros && apexAnormal) {
            // Sólo el ápex: el motor diría "conservada" y sería falso.
            texto = mayuscula(`${NOMBRE_GRADO[st[APEX]]} del ápex.`);
        } else if (anormales.length === 5 && APICALES.every(id => st[id] === st[APEX])) {
            // (b) Los cinco apicales, mismo grado, nada más.
            texto = mayuscula(`${NOMBRE_GRADO[st[APEX]]} de la totalidad del casquete apical.`);
        } else {
            texto = limpiarNiveles(MotorA5.describe(sinApex));
            if (ENUMERA_DEMASIADO.test(texto)) {
                // (a) Extenso: por pared, con el ápex incluido en la misma redacción.
                texto = describirPorPared(st);
            } else {
                // La cláusula del ápex se agrega salvo que el texto ya lo cubra: el
                // patrón apical puro ("de los segmentos apicales") o lo global (c).
                const anilloApical = [13, 14, 15, 16];
                const apicalPuro = anilloApical.every(id => st[id] === st[APEX]) &&
                                   /apical/i.test(texto);
                const global = /global del ventrículo izquierdo/i.test(texto);
                if (apexAnormal && !apicalPuro && !global)
                    texto = texto.replace(/\.\s*$/, '') +
                        `, con ${NOMBRE_GRADO[st[APEX]]} del ápex.`;
            }
        }

        let territorio = '';
        if (Territory) {
            try { territorio = Territory.interpret(sinApex).text || ''; } catch (e) { territorio = ''; }
        }
        return { texto, territorio, normal: !hayOtros && !apexAnormal };
    }

    /**
     * Dónde está un grupo de segmentos, SIN el grado: "inferior a nivel basal y
     * medio". Sirve para decir progresiones ("de hipoquinesia a aquinesia …") y para
     * nombrar el septum asincrónico sin enumerar segmentos.
     */
    function ubicacion(ids) {
        if (!ids || !ids.length) return '';
        const wm = {};
        for (let id = 1; id <= 17; id++) wm[id] = ids.includes(id) ? 3 : 1;
        return describirFase(wm, null).texto
            .replace(/\.\s*$/, '')
            .replace(/, con hipoquinesia moderada del ápex$/i, ' y del ápex')
            .replace(/^hipoquinesia moderada\s+/i, '')
            .replace(/; hipoquinesia moderada /gi, '; ');
    }

    function mayuscula(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

    raiz.MotilidadDoppler = { describirFase, ubicacion, ubicacionPorPared, MotorA5, TEXTO_NORMAL: Engine.NORMAL_TEXT };
})(typeof window !== 'undefined' ? window : globalThis);
