// Guardado igual que eco Doppler convencional (18/11/2026): la app espera el acuse
// del script. Se corre el script REAL (apps-script-eco-estres.gs) sobre una planilla
// simulada, y la app le habla por un fetch que llega a su doPost.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { cargarApp, casoBase, todoNormal } = require('./harness');

let fallas = 0;
const exigir = (c, m) => { if (!c) { console.log('✗ ' + m); fallas++; } };

// ── Planilla simulada con lo mínimo que usa el script ──
function planilla() {
    const hojas = {};
    const hoja = (nombre) => {
        const filas = [];
        const h = {
            filas,
            getLastRow: () => filas.length,
            getLastColumn: () => filas.reduce((m, f) => Math.max(m, f.length), 0),
            getMaxRows: () => 1000,
            appendRow: (r) => { filas.push([...r]); },
            setFrozenRows: () => {},
            getRange: (r, c, nr = 1, nc = 1) => ({
                getValues: () => Array.from({ length: nr }, (_, i) =>
                    Array.from({ length: nc }, (_, j) => (filas[r - 1 + i] || [])[c - 1 + j] ?? '')),
                setValues: (v) => { v.forEach((fila, i) => { filas[r - 1 + i] = [...fila]; }); },
                setFontWeight() { return this; }, setBackground() { return this; },
                setFontColor() { return this; }, setNumberFormat() { return this; }
            })
        };
        return h;
    };
    return {
        hojas,
        getSheetByName: (n) => hojas[n] || null,
        insertSheet: (n) => (hojas[n] = hoja(n))
    };
}
function cargarScript(ss) {
    const ctx = {
        SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
        LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
        ContentService: { MimeType: { JSON: 'json' },
            createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }) },
        JSON, String, Array, Number
    };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script-eco-estres.gs'), 'utf8'), ctx);
    return ctx;
}

const ss = planilla();
const gs = cargarScript(ss);
const w = cargarApp();
const d = w.document;
const avisos = [];
w.showNotice = (msg, tipo) => avisos.push({ msg, tipo });
w.eval('EstresSheets.getUrl = () => "https://script.google.com/macros/s/X/exec"');
let modo = 'script';
w.fetch = async (url, opt) => {
    exigir(!opt.mode || opt.mode !== 'no-cors', 'el envío ya no usa no-cors: lee la respuesta');
    if (modo === 'ilegible') return { json: async () => { throw new Error('opaque'); } };
    const out = gs.doPost({ postData: { contents: opt.body } });
    return { json: async () => JSON.parse(out.texto) };
};

(async () => {
    casoBase(w); todoNormal(w);
    w.generarInforme();

    await w.guardarEstudio();
    const H = ss.hojas['Estrés'];
    exigir(H && H.filas.length === 2, 'primer guardado: encabezado + una fila');
    exigir(/Guardado confirmado/.test(avisos.at(-1).msg) && avisos.at(-1).tipo === 'ok',
        'primer guardado: "Guardado confirmado"');

    await w.guardarEstudio();
    exigir(H.filas.length === 2, 'reguardar el mismo estudio no duplica la fila');
    exigir(/Reemplazó la fila anterior/.test(avisos.at(-1).msg), 'y avisa que la reemplazó');

    w.borrarTodo();
    casoBase(w); todoNormal(w); w.generarInforme();
    await w.guardarEstudio();
    exigir(H.filas.length === 3, 'otro estudio: fila nueva');

    modo = 'ilegible';
    await w.guardarEstudio();
    exigir(/sin confirmación/.test(avisos.at(-1).msg) && avisos.at(-1).tipo === 'warn',
        'respuesta ilegible: "Enviado, pero sin confirmación"');

    // Hoja con otro encabezado: el script lo rechaza y la app lo muestra.
    modo = 'script';
    H.filas[0] = H.filas[0].slice(0, 70);
    await w.guardarEstudio();
    exigir(/Error al guardar/.test(avisos.at(-1).msg) && /columnas/.test(avisos.at(-1).msg),
        'un error del script se muestra, no se da por guardado');

    if (fallas) { console.log(`guardado-confirmado: ${fallas} falla(s)`); process.exit(1); }
    console.log('Sin fallas — guardado confirmado como eco Doppler: confirma, reemplaza, avisa sin acuse y muestra errores');
})();
