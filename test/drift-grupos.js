// Test de drift: `motility-groups.js` es una copia deliberada de ANATOMIC_GROUPS y
// VIEWS del `motility-model.js` de la app de eco Doppler. Las dos apps son estáticas y
// no comparten build, así que la copia se vigila en vez de importarse.
//
// Si la carpeta de Doppler no está (otra computadora), el test se saltea en vez de
// romper: no tiene sentido que la batería dependa de un proyecto vecino.
const fs = require('fs');
const path = require('path');
const os = require('os');

const DOPPLER = path.join(os.homedir(), 'Documents', 'App Calculadora Ecodoppler Cardiaco',
                          'js', 'motility-model.js');
const propios = require(path.join(__dirname, '..', 'motility-groups.js'));

if (!fs.existsSync(DOPPLER)) {
    console.log('Sin fallas (la app de Doppler no está en esta computadora: drift no verificable)');
    process.exit(0);
}

// El modelo de Doppler se evalúa como módulo: el archivo exporta MotilityModel.
const MotilityModel = require(DOPPLER);

// Las dos diferencias son a propósito y están documentadas en motility-groups.js.
const EXCEPCIONES = {
    'niveles.apicales': {
        motivo: 'acá el ápex se puntúa y esPatronApical() lo cuenta, aunque quede fuera del WMSI',
        esperado: doppler => [...doppler, 17],
    },
    'territorios.global': {
        motivo: 'el "global" de acá incluye el ápex: se puede puntuar y conviene poder pintarlo',
        esperado: doppler => [...doppler, 17],
    },
};

let fallas = 0;
const igual = (a, b) => JSON.stringify([...a].sort((x, y) => x - y)) ===
                        JSON.stringify([...b].sort((x, y) => x - y));

Object.entries(MotilityModel.ANATOMIC_GROUPS).forEach(([familia, grupos]) => {
    Object.entries(grupos).forEach(([nombre, idsDoppler]) => {
        const clave = `${familia}.${nombre}`;
        const mios = propios.segmentosDeGrupo(clave);
        if (!mios) { console.log(`✗ falta el grupo ${clave}`); fallas++; return; }
        const exc = EXCEPCIONES[clave];
        const esperado = exc ? exc.esperado(idsDoppler) : idsDoppler;
        if (!igual(mios, esperado)) {
            console.log(`✗ ${clave} divergió de Doppler` + (exc ? ` (excepción: ${exc.motivo})` : ''));
            console.log(`   Doppler: [${idsDoppler}]  esperado acá: [${esperado}]  tengo: [${mios}]`);
            fallas++;
        }
    });
});

// Y al revés: ningún grupo propio que Doppler no tenga.
Object.entries(propios.GRUPOS_ANATOMICOS).forEach(([familia, grupos]) => {
    Object.keys(grupos).forEach(nombre => {
        if (!MotilityModel.ANATOMIC_GROUPS[familia] ||
            !MotilityModel.ANATOMIC_GROUPS[familia][nombre]) {
            console.log(`✗ el grupo ${familia}.${nombre} no existe en Doppler`); fallas++;
        }
    });
});

// Las vistas se copian sin excepciones.
Object.entries(MotilityModel.VIEWS).forEach(([vista, ids]) => {
    if (!igual(propios.VISTAS_APICALES[vista] || [], ids)) {
        console.log(`✗ la vista ${vista} divergió de Doppler`);
        console.log(`   Doppler: [${ids}]  tengo: [${propios.VISTAS_APICALES[vista]}]`);
        fallas++;
    }
});

console.log(fallas ? `${fallas} FALLAS de drift contra la app de Doppler` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
