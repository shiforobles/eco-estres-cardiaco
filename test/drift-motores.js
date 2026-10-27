// `vendor/doppler/` es una copia byte a byte de tres archivos de la app de eco
// Doppler. Este test falla si divergen. Si la app de Doppler no está en esta
// computadora, se saltea: la batería no puede depender de un proyecto vecino.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const ORIGEN = path.join(os.homedir(), 'Documents', 'App Calculadora Ecodoppler Cardiaco', 'js');
const VENDOR = path.join(__dirname, '..', 'vendor', 'doppler');
const ARCHIVOS = ['motility-model.js', 'motility-engine.js', 'territory-engine.js'];

if (!fs.existsSync(ORIGEN)) {
    console.log('Sin fallas (la app de Doppler no está en esta computadora: drift no verificable)');
    process.exit(0);
}

const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
let fallas = 0;

ARCHIVOS.forEach(f => {
    const a = path.join(ORIGEN, f), b = path.join(VENDOR, f);
    if (!fs.existsSync(b)) { console.log(`✗ falta vendor/doppler/${f}`); fallas++; return; }
    const ha = hash(a), hb = hash(b);
    if (ha !== hb) {
        console.log(`✗ ${f} divergió: origen ${ha}, vendorizado ${hb}`);
        console.log('   Si el cambio viene de Doppler, recopiá el archivo y corré npm test:');
        console.log('   un cambio de redacción del Motor A cambia el texto del informe.');
        console.log('   Si alguien editó la copia, revertilo: lo propio va en motility-estres.js.');
        fallas++;
    }
});

console.log(fallas ? `${fallas} FALLAS de drift contra la app de Doppler` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
