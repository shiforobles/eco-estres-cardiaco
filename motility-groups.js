/* ════════════════════════════════════════════════════════════════
   GRUPOS ANATÓMICOS Y VISTAS — para la barra de carga de motilidad

   Copiado de `motility-model.js` de la app de eco Doppler
   (ANATOMIC_GROUPS y VIEWS). Es una COPIA deliberada, no un import: las
   dos apps son estáticas y no comparten build. `test/drift-grupos.js`
   lee el archivo original y falla si divergen, salvo en las dos
   diferencias de abajo, que son a propósito.

   DIFERENCIAS CON DOPPLER, a propósito:

   1. `niveles.apicales` incluye el ápex (17). En Doppler el 17 no es
      seleccionable; acá sí se puntúa —aparece en el bull's eye y
      `esPatronApical()` lo cuenta— aunque quede fuera del WMSI.

   2. Los territorios NO incluyen el 17, igual que en Doppler. El ápex
      tiene irrigación variable y `territoriosDe()` no le asigna vaso:
      pintar "DA" ya no lo alcanza. En un infarto anterior extenso hay
      que sumar "apicales" o tocarlo, que es una decisión del operador y
      no una suposición de la app.
   ════════════════════════════════════════════════════════════════ */

const GRUPOS_ANATOMICOS = {
    paredes: {
        anterior: [1, 7, 13],
        // A nivel apical el ventrículo pasa de 6 a 4 paredes: el septum apical (14)
        // cierra las dos columnas septales y el lateral apical (16) las dos laterales.
        septal:   [2, 3, 8, 9, 14],
        inferior: [4, 10, 15],
        lateral:  [5, 6, 11, 12, 16],
    },
    niveles: {
        basales:  [1, 2, 3, 4, 5, 6],
        medios:   [7, 8, 9, 10, 11, 12],
        apicales: [13, 14, 15, 16, 17],   // ← con el ápex (ver nota 1)
    },
    territorios: {
        DA:     [1, 2, 7, 8, 13, 14],
        CD:     [3, 4, 9, 10, 15],
        Cx:     [5, 6, 11, 12, 16],
        global: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    },
};

/* Segmentos visibles en cada vista apical (ASE). El mapeo viejo de Doppler ubicaba
   la pared anterior en el A4C y era incorrecto; éste es el bueno. */
const VISTAS_APICALES = {
    A4C: [3, 9, 14, 6, 12, 16],   // inferoseptal/septal + anterolateral/lateral
    A2C: [4, 10, 15, 1, 7, 13],   // inferior + anterior
    A3C: [5, 11, 16, 2, 8, 14],   // inferolateral/lateral + anteroseptal/septal
};

/* Segmentos de un grupo por su clave "familia.nombre" (ej. "paredes.anterior") */
function segmentosDeGrupo(clave) {
    const [familia, nombre] = String(clave).split('.');
    const f = GRUPOS_ANATOMICOS[familia];
    return (f && f[nombre]) ? f[nombre] : null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GRUPOS_ANATOMICOS, VISTAS_APICALES, segmentosDeGrupo };
}
