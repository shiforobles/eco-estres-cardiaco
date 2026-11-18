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

    // ── 5 · Prosa ordenada (Lucas, 18/11/2026) ─────────────────────
    // Con muchos segmentos el texto del motor se hacía difícil de leer. Formato
    // elegido: de lo más grave a lo más leve; en cada grado, las paredes que
    // comparten niveles van juntas y el nivel se dice una sola vez, entre
    // paréntesis. "Aquinesia del casquete apical, con hipoquinesia leve de las paredes
    // anterior, anteroseptal, inferoseptal e inferior (basal y medio)."
    //  · "en toda su extensión" sólo para las paredes que tienen segmento apical
    //    propio (anterior e inferior) o para el septum entero (2, 3, 8, 9 y 14).
    //  · Los cuatro apicales (13-16) son "el casquete apical"; si el ápex tiene el
    //    mismo grado, "del casquete apical y del ápex".
    //  · El apical septal (14) y el apical lateral (16) sueltos van por su nombre.
    const PAREDES_NIVEL = [
        { nombre: 'anterior',      b: 1, m: 7,  a: 13 },
        { nombre: 'anteroseptal',  b: 2, m: 8 },
        { nombre: 'inferoseptal',  b: 3, m: 9 },
        { nombre: 'inferior',      b: 4, m: 10, a: 15 },
        { nombre: 'inferolateral', b: 5, m: 11 },
        { nombre: 'anterolateral', b: 6, m: 12 },
    ];
    const ANILLO = [13, 14, 15, 16];
    // Con los tres niveles a la vista (Lucas, 18/11/2026).
    const TODA_EXTENSION = 'en toda su extensión (basal, medio y apical)';

    /** Dónde, sin el grado: "de las paredes anterior e inferior (basal y medio) y del ápex". */
    function ubicacionOrdenada(ids) {
        const S = new Set(ids);
        const usados = new Set();
        const piezas = [];
        if (ANILLO.every(id => S.has(id))) {
            // "Casquete apical" (Lucas, 18/11/2026): 13-16. Con el ápex del mismo
            // grado se lo nombra también, para no perder que está comprometido.
            if (S.has(APEX)) { piezas.push('del casquete apical y del ápex'); usados.add(APEX); }
            else piezas.push('del casquete apical');
            ANILLO.forEach(id => usados.add(id));
        }
        // Cada pared con sus niveles alterados.
        const nivelesDe = p => {
            const n = [];
            if (S.has(p.b) && !usados.has(p.b)) n.push('basal');
            if (S.has(p.m) && !usados.has(p.m)) n.push('medio');
            if (p.a && S.has(p.a) && !usados.has(p.a)) n.push('apical');
            return n;
        };
        // Pared septal y pared lateral (Lucas, 18/11/2026): si las dos subdivisiones
        // (anteroseptal e inferoseptal; anterolateral e inferolateral) tienen los mismos
        // niveles, se nombran como una sola pared. Con su segmento apical (14 o 16),
        // la pared queda "en toda su extensión".
        const unidades = [];
        // La clave es la que aparece primero en PAREDES_NIVEL.
        const pares = { anteroseptal: ['inferoseptal', 'septal', 14], inferolateral: ['anterolateral', 'lateral', 16] };
        const yaUnidas = new Set();
        PAREDES_NIVEL.forEach(p => {
            if (yaUnidas.has(p.nombre)) return;
            const par = pares[p.nombre];
            if (par) {
                const otra = PAREDES_NIVEL.find(x => x.nombre === par[0]);
                const n1 = nivelesDe(p), n2 = nivelesDe(otra);
                if (n1.length && n1.join() === n2.join()) {
                    yaUnidas.add(otra.nombre);
                    const apical = par[2];
                    const conApical = n1.length === 2 && S.has(apical) && !usados.has(apical);
                    [p.b, p.m, otra.b, otra.m].forEach(id => { if (S.has(id)) usados.add(id); });
                    if (conApical) usados.add(apical);
                    unidades.push({ nombre: par[1], clave: conApical ? TODA_EXTENSION : `(${lista(n1)})` });
                    return;
                }
            }
            const niveles = nivelesDe(p);
            if (!niveles.length) return;
            [p.b, p.m, p.a].forEach(id => { if (id && S.has(id)) usados.add(id); });
            unidades.push({ nombre: p.nombre,
                clave: (p.a && niveles.length === 3) ? TODA_EXTENSION : `(${lista(niveles)})` });
        });
        // Paredes con el mismo conjunto de niveles van juntas.
        const grupos = [];
        unidades.forEach(u => {
            let g = grupos.find(x => x.clave === u.clave);
            if (!g) { g = { clave: u.clave, paredes: [] }; grupos.push(g); }
            g.paredes.push(u.nombre);
        });
        grupos.forEach(g => piezas.push(
            `${g.paredes.length > 1 ? 'de las paredes' : 'de la pared'} ${lista(g.paredes)} ${g.clave}`));
        if (S.has(14) && !usados.has(14)) { piezas.push('del segmento apical septal'); usados.add(14); }
        if (S.has(16) && !usados.has(16)) { piezas.push('del segmento apical lateral'); usados.add(16); }
        if (S.has(APEX) && !usados.has(APEX)) piezas.push('del ápex');
        return lista(piezas);
    }

    function describirOrdenado(st) {
        const grupos = [5, 4, 3, 2].map(g => {
            const ids = Object.keys(st).map(Number).filter(id => st[id] === g);
            return ids.length ? `${NOMBRE_GRADO[g]} ${ubicacionOrdenada(ids)}` : '';
        }).filter(Boolean);
        // El segundo grado entra con «, con»; los siguientes, con «y»/«e».
        let t = grupos[0];
        grupos.slice(1).forEach((g, i) => {
            t += i === 0 ? `, con ${g}` : ((/^(i|hi(?!e))/i.test(g) ? ' e ' : ' y ') + g);
        });
        return mayuscula(t + '.');
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

        const anormales = Object.keys(st).map(Number).filter(id => st[id] > 1);
        const hayOtros = Object.keys(sinApex).some(id => sinApex[id] > 1);
        let texto;

        if (!hayOtros && !apexAnormal) {
            texto = Engine.NORMAL_TEXT;
        } else if (!hayOtros && apexAnormal) {
            // Sólo el ápex: el motor diría "conservada" y sería falso.
            texto = mayuscula(`${NOMBRE_GRADO[st[APEX]]} del ápex.`);
        } else if (apexAnormal && anormales.length === 5 && APICALES.every(id => st[id] === st[APEX])) {
            // (sin `apexAnormal`, cinco segmentos alterados FUERA del ápex con los cinco
            // apicales normales entraban acá y salía "La undefined de la totalidad…")
            // (b) Los cinco apicales, mismo grado, nada más.
            texto = mayuscula(`${NOMBRE_GRADO[st[APEX]]} de la totalidad del casquete apical.`);
        } else if (!/global del ventrículo izquierdo/i.test(MotorA5.describe(sinApex))) {
            // (5) Prosa ordenada: todo lo segmentario.
            texto = describirOrdenado(st);
        } else {
            texto = unirAdyacentes(limpiarNiveles(MotorA5.describe(sinApex)));
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
                    texto = sumarApex(texto, st[APEX]);
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
        return ubicacionOrdenada(ids);
        const wm = {};
        for (let id = 1; id <= 17; id++) wm[id] = ids.includes(id) ? 3 : 1;
        return describirFase(wm, null).texto
            .replace(/\.\s*$/, '')
            .replace(/, con hipoquinesia moderada del ápex$/i, ' y del ápex')   // compatibilidad: hoy sumarApex ya lo une
            .replace(/^hipoquinesia moderada\s+/i, '')
            .replace(/; hipoquinesia moderada /gi, '; ');
    }

    /** El motor encadena las extensiones adyacentes con «, con … , con …». A partir
     *  de la segunda, «y»/«e»: «…, con hipoquinesia moderada del segmento X
     *  adyacente e hipoquinesia leve de los segmentos Y adyacentes». */
    function unirAdyacentes(texto) {
        let n = 0;
        return texto.replace(/, con (\S+)/g, (m, palabra) => {
            n++;
            if (n === 1) return m;
            return (/^(i|hi(?!e))/i.test(palabra) ? ' e ' : ' y ') + palabra;
        });
    }

    /** Agrega el ápex sin encadenar dos «con»: con el mismo grado se suma a la
     *  ubicación («…con extensión al septum apical y al ápex», «…en toda su
     *  extensión y del ápex»); con otro grado va en cláusula aparte, con «con» sólo
     *  si la frase todavía no tiene uno. */
    function sumarApex(texto, gradoApex) {
        const base = texto.replace(/\.\s*$/, '');
        const nombre = NOMBRE_GRADO[gradoApex];
        const mismoGrado = base.toLowerCase().startsWith(nombre.toLowerCase()) && !base.includes(';');
        // Sólo se une con «y» si la última cláusula no trae ya su propia «y»/«e»:
        // «…septum apical e inferolateral a nivel basal y medio y al ápex» no se lee.
        const ultima = base.split(',').pop();
        if (mismoGrado && !/ (y|e) /.test(ultima)) {
            if (/, con extensión a(l|\s)[^,;]*$/.test(base)) return `${base} y al ápex.`;
            return `${base} y del ápex.`;
        }
        if (/, con /.test(base)) return `${base}; ${nombre} del ápex.`;
        return `${base}, con ${nombre} del ápex.`;
    }

    function mayuscula(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

    raiz.MotilidadDoppler = { describirFase, ubicacion, ubicacionPorPared, ubicacionOrdenada, MotorA5, TEXTO_NORMAL: Engine.NORMAL_TEXT };
})(typeof window !== 'undefined' ? window : globalThis);
