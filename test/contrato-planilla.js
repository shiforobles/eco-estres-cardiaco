// Contrato único de columnas: la app y el Apps Script tienen que coincidir.
//
// Existe porque dejaron de coincidir sin que nada avisara: la app pasó a 61 columnas
// el 25/10/2026 y el script siguió con 59, así que desde la columna 39 cada dato caía
// bajo otro rótulo. Nadie lo nota leyendo la hoja.
const fs = require('fs');
const path = require('path');
const { cargarApp } = require('./harness');

const w = cargarApp();
const S = w.EstresSheets;
const gs = fs.readFileSync(path.join(__dirname, '..', 'apps-script-unificado.gs'), 'utf8');

let fallas = 0;
const exigir = (cond, msg) => { if (!cond) { console.log('✗ ' + msg); fallas++; } };

const m = gs.match(/const HEADERS_ESTRES = (\[[\s\S]*?\]);/);
exigir(!!m, 'no se encontró HEADERS_ESTRES en el Apps Script');
if (m) {
    let gsH = null;
    try { gsH = JSON.parse(m[1]); } catch (e) { exigir(false, 'HEADERS_ESTRES no es JSON válido'); }
    if (gsH) {
        exigir(gsH.length === S.HEADERS.length,
            `la app tiene ${S.HEADERS.length} columnas y el script ${gsH.length}`);
        const prim = S.HEADERS.findIndex((h, i) => gsH[i] !== h);
        exigir(prim === -1,
            prim >= 0 ? `divergen en la columna ${prim + 1}: app "${S.HEADERS[prim]}" vs script "${gsH[prim]}"` : '');
    }
}

// La fila construida tiene que medir lo mismo que el encabezado.
const { casoBase, todoNormal, informe } = require('./harness');
casoBase(w); todoNormal(w);
const fila = S.construirFila(informe(w).texto);
exigir(fila.length === S.HEADERS.length,
    `construirFila devuelve ${fila.length} valores y el encabezado tiene ${S.HEADERS.length}`);

// Los índices de formato numérico tienen que apuntar a las columnas que son ratios.
const mn = gs.match(/const NUM_ESTRES\s*=\s*(\[[^\]]*\]);/);
exigir(!!mn, 'no se encontró NUM_ESTRES');
if (mn) {
    const gsNum = JSON.parse(mn[1]);
    const esperado = S.COLUMNAS_RATIO.map(h => S.HEADERS.indexOf(h) + 1).filter(i => i > 0);
    exigir(JSON.stringify([...gsNum].sort((a,b)=>a-b)) === JSON.stringify([...esperado].sort((a,b)=>a-b)),
        `NUM_ESTRES apunta a ${gsNum} y las columnas de ratio están en ${esperado}`);
}

// Y el script tiene que rechazar una fila de otro largo en vez de escribirla corrida.
exigir(/ESQUEMA_DESALINEADO/.test(gs), 'el script no rechaza filas con otra cantidad de columnas');
exigir(/HOJA_SIN_MIGRAR/.test(gs), 'el script no detecta una hoja con el encabezado viejo');
exigir(/function migrarEstresV1aV2/.test(gs), 'falta la migración de las filas existentes');

console.log(fallas ? `${fallas} FALLAS` : 'Sin fallas');
process.exit(fallas ? 1 : 0);
