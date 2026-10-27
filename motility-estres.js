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

        const hayOtros = Object.keys(sinApex).some(id => sinApex[id] > 1);
        let texto;

        if (!hayOtros && !apexAnormal) {
            texto = Engine.NORMAL_TEXT;
        } else if (!hayOtros && apexAnormal) {
            // Sólo el ápex: el motor diría "conservada" y sería falso.
            texto = mayuscula(`${NOMBRE_GRADO[st[APEX]]} del ápex.`);
        } else {
            texto = limpiarNiveles(MotorA5.describe(sinApex));
            // La cláusula del ápex se agrega salvo que el texto ya lo cubra: en el
            // patrón apical puro —los cuatro apicales con el mismo grado que el 17—
            // el motor ya dijo "de los segmentos apicales" y repetirlo deja la frase
            // diciendo "apical" tres veces.
            const anilloApical = [13, 14, 15, 16];
            const apicalPuro = anilloApical.every(id => st[id] === st[APEX]) &&
                               /apical/i.test(texto);
            if (apexAnormal && !apicalPuro)
                texto = texto.replace(/\.\s*$/, '') +
                    `, con ${NOMBRE_GRADO[st[APEX]]} del ápex.`;
        }

        let territorio = '';
        if (Territory) {
            try { territorio = Territory.interpret(sinApex).text || ''; } catch (e) { territorio = ''; }
        }
        return { texto, territorio, normal: !hayOtros && !apexAnormal };
    }

    function mayuscula(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

    raiz.MotilidadDoppler = { describirFase, MotorA5, TEXTO_NORMAL: Engine.NORMAL_TEXT };
})(typeof window !== 'undefined' ? window : globalThis);
