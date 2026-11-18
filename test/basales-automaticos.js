// La simplificación cambia la carga, no los criterios ni los datos heredados.
const assert = require('node:assert/strict');
const { cargarApp, set, casoBase, todoNormal } = require('./harness');
const w = cargarApp(), d = w.document;
casoBase(w); todoNormal(w);
const oculto = id => {
    for (let el = d.getElementById(id); el; el = el.parentElement)
        if (el.hidden || el.style.display === 'none') return true;
    return false;
};
for (const id of ['geometria_vi', 'diast_grado', 'reposo_libre', 'pp_reposo', 'vd_funcion'])
    assert.ok(oculto(id), `${id} no debe ser un control de carga visible`);

// Las cuatro combinaciones y ambos cortes por sexo se mantienen.
for (const sexo of ['M', 'F']) {
    set(w, 'sexo', sexo); set(w, 'peso', 80); set(w, 'altura', 175);
    for (const [ddvi, siv, pp, esperado] of [
        [48, 9, 9, 'normal'], [38, 9, 9, 'remodelado'],
        [52, 14, 13, 'hvi_concentrica'], [68, 11, 11, 'hvi_excentrica']
    ]) {
        set(w, 'ddvi', ddvi); set(w, 'siv_d', siv); set(w, 'pp_d', pp);
        assert.equal(d.getElementById('geometria_vi').value, esperado);
        assert.ok(d.getElementById('geometria_criterios').textContent.includes(sexo === 'M' ? '115' : '95'));
    }
}
set(w, 'ddvi', '');
assert.equal(d.getElementById('geometria_vi').value, '', 'no conservar el automático obsoleto');
assert.match(d.getElementById('geometria_vi_calculo').textContent, /No clasificable/);
set(w, 'ddvi', 3);
assert.equal(d.getElementById('geometria_vi').value, '');
assert.equal(d.getElementById('imvi').value, '');

// Estados basales del algoritmo vigente (ASE 2025); no se fuerzan mediante el selector.
const DIAS = ['e_onda_rep','a_onda_rep','e_prima_rep','e_prima_lat_rep','vrt_rep','volvi_reposo','fevi_reposo','edad'];
for (const [datos, esperado] of [
    [{e_onda_rep:80,a_onda_rep:80,e_prima_rep:10,e_prima_lat_rep:12,vrt_rep:2,volvi_reposo:40,fevi_reposo:60},'normal'],
    [{e_onda_rep:40,a_onda_rep:80,e_prima_rep:10,e_prima_lat_rep:12,vrt_rep:2,fevi_reposo:40},'g1'],
    [{e_onda_rep:120,a_onda_rep:60,e_prima_rep:10,e_prima_lat_rep:12,vrt_rep:2,fevi_reposo:40},'g3'],
    [{e_onda_rep:100,a_onda_rep:100,e_prima_rep:5,e_prima_lat_rep:5,vrt_rep:3,volvi_reposo:90,fevi_reposo:40},'g2'],
    // e' bajo, E/e' alto, VRT normal: decide el LAVi (20 mL/m² → presiones normales, grado I)
    [{e_onda_rep:80,a_onda_rep:80,e_prima_rep:5,e_prima_lat_rep:5,vrt_rep:2,volvi_reposo:40,fevi_reposo:60},'g1'],
    // ...y sin LAVi no hay quien decida
    [{e_onda_rep:80,a_onda_rep:80,e_prima_rep:5,e_prima_lat_rep:5,vrt_rep:2,fevi_reposo:60},'indeterminada'],
    // Sin VRT ni volumen AI (criterio propio, 18/11/2026): con E, A y e' alcanza
    [{e_onda_rep:70,a_onda_rep:60,e_prima_rep:8,e_prima_lat_rep:11,fevi_reposo:60,edad:50},'normal'],
    // 70 años, lateral 8 y septal 7: normal por ASE 2025 (con 2016 era e' bajo)
    [{e_onda_rep:60,a_onda_rep:70,e_prima_rep:7,e_prima_lat_rep:8,fevi_reposo:60,edad:70},'normal'],
    [{e_onda_rep:50,a_onda_rep:80,e_prima_rep:5,e_prima_lat_rep:6,fevi_reposo:60,edad:70},'g1'],
    [{e_onda_rep:90,a_onda_rep:80,e_prima_rep:5,e_prima_lat_rep:6,fevi_reposo:60,edad:70},'g2'],
    [{e_onda_rep:110,a_onda_rep:50,e_prima_rep:5,e_prima_lat_rep:6,fevi_reposo:60,edad:70},'g3'],
    // e' bajo, E/e' normal, E/A >0,8: puede ser pseudonormal, sin LAVi queda indeterminada
    [{e_onda_rep:60,a_onda_rep:60,e_prima_rep:5,e_prima_lat_rep:6,fevi_reposo:60,edad:70},'indeterminada'],
    // e' normal con E/e' alto (discordante): indeterminada
    [{e_onda_rep:150,a_onda_rep:100,e_prima_rep:9,e_prima_lat_rep:10,fevi_reposo:60,edad:50},'indeterminada']
]) {
    for (const id of DIAS) set(w, id, '');
    for (const [id, val] of Object.entries(datos)) set(w,id,val);
    assert.equal(w.clasificarDiastolica().grado, esperado, JSON.stringify(datos));
    assert.equal(d.getElementById('diast_grado').value, esperado);
}
// Presiones con la diastólica indeterminada: E/e' normal → normales; E/e' alto → sin clasificar
for (const id of DIAS) set(w, id, '');
for (const [id, val] of Object.entries({e_onda_rep:60,a_onda_rep:60,e_prima_rep:5,e_prima_lat_rep:6,fevi_reposo:60,edad:70})) set(w,id,val);
assert.equal(w.presionesIndeterminada(), 'normales');
assert.match(d.body.textContent, /Presiones de llenado normales por E\/e'/);
for (const id of DIAS) set(w, id, '');
for (const [id, val] of Object.entries({e_onda_rep:150,a_onda_rep:100,e_prima_rep:9,e_prima_lat_rep:10,fevi_reposo:60,edad:50})) set(w,id,val);
assert.equal(w.presionesIndeterminada(), null);
// El criterio propio sin VRT se declara en pantalla
for (const id of DIAS) set(w, id, '');
for (const [id, val] of Object.entries({e_onda_rep:70,a_onda_rep:60,e_prima_rep:8,e_prima_lat_rep:11,fevi_reposo:60,edad:50})) set(w,id,val);
assert.match(d.body.textContent, /Criterio propio: sin VRT/);
for (const id of DIAS) set(w, id, '');
set(w, 'fevi_reposo', 60);
for (const id of ['e_onda_rep','a_onda_rep','e_prima_rep','e_prima_lat_rep','vrt_rep','volvi_reposo']) set(w,id,'');
assert.equal(d.getElementById('diast_grado').value, '');
assert.match(d.getElementById('diast_grado_calculo').textContent, /No clasificable/);

// Registro con correcciones y datos retirados: se conserva valor, bandera e informe.
set(w,'geometria_vi','hvi_concentrica');
set(w,'diast_grado','g2');
set(w,'reposo_libre','DESCRIPCION FICTICIA CONSERVADA.');
set(w,'pp_reposo',45); set(w,'vd_funcion','leve');
const viejo=JSON.parse(JSON.stringify(w.construirBorrador()));
viejo.reporte='INFORME FICTICIO EDITADO';
const copia=JSON.stringify(viejo);
w.aplicarEstudio(viejo);
assert.equal(JSON.stringify(viejo),copia, 'no mutar el registro original');
for(const [id,valor] of Object.entries({geometria_vi:'hvi_concentrica',diast_grado:'g2',reposo_libre:'DESCRIPCION FICTICIA CONSERVADA.',pp_reposo:'45',vd_funcion:'leve'}))
    assert.equal(d.getElementById(id).value,valor);
for(const id of ['geometria_vi','diast_grado']) {
    assert.equal(w.fueCorregido(id),true);
    assert.equal(d.getElementById(id+'_discrepancia').hidden,false);
    assert.match(d.getElementById(id+'_discrepancia').textContent,/Corrección manual guardada/);
    assert.match(d.getElementById(id+'_discrepancia').textContent,/Difiere/);
}
assert.equal(d.getElementById('reporte-output').textContent,'INFORME FICTICIO EDITADO');
assert.equal(d.getElementById('datos-basales-heredados-aviso').hidden,false);
const texto=w.construirNarrativa(w.recolectarHallazgos()).texto;
assert.ok(texto.includes('DESCRIPCION FICTICIA CONSERVADA.'));
const guardado=JSON.parse(JSON.stringify(w.construirBorrador()));
assert.equal(guardado.version,viejo.version);
assert.equal(guardado.corregidos.geometria_vi,true);
assert.equal(guardado.fields.pp_reposo,'45');
w.generarInforme();
const recuperado=JSON.parse(JSON.stringify(w.construirBorrador()));
w.aplicarEstudio(recuperado);
assert.equal(d.getElementById('reposo_libre').value,'DESCRIPCION FICTICIA CONSERVADA.');
assert.equal(w.fueCorregido('diast_grado'),true);

// Ausencia de claves retiradas no arrastra el texto/VD/PP del paciente anterior.
const sinEsos=JSON.parse(JSON.stringify(guardado));
sinEsos.corregidos={};
for(const id of ['reposo_libre','pp_reposo','vd_funcion','geometria_vi','diast_grado']) delete sinEsos.fields[id];
w.aplicarEstudio(sinEsos);
assert.equal(d.getElementById('reposo_libre').value,'');
assert.equal(d.getElementById('vd_funcion').value,'');
assert.equal(d.getElementById('pp_reposo').value,'');
assert.equal(d.getElementById('geometria_vi_discrepancia').hidden,true);
console.log('Sin fallas — basales automáticos: criterios, obsoletos, controles retirados y conservación en el borrador');
w.close();
