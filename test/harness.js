// Arnés de prueba: carga index.html en jsdom y expone el window con app.js cargado.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// El proyecto es la carpeta que contiene a test/
const PROJ = path.join(__dirname, '..');

// La carpeta Documents devuelve ETIMEDOUT de vez en cuando y tumbaba corridas largas.
function leer(f) {
    for (let i = 0; i < 5; i++) {
        try { return fs.readFileSync(path.join(PROJ, f), 'utf8'); }
        catch (e) { if (e.code !== 'ETIMEDOUT' || i === 4) throw e; }
    }
}

function cargarApp() {
    const html = leer('index.html')
        // los <script src> no se resuelven en jsdom sin servidor: se inyectan a mano
        .replace(/<script src="[^"]*"><\/script>/g, '');
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        url: 'http://localhost:8753/',
        pretendToBeVisual: true
    });
    const w = dom.window;
    w.alert = () => {};
    w.confirm = () => true;
    w.scrollTo = () => {};
    w.Element.prototype.scrollIntoView = () => {};
    // Los scripts se inyectan como elementos: window.eval deja los `const` fuera del
    // ámbito global y nada queda visible después.
    ['pearls.js', 'report-templates.js', 'sheets-storage.js', 'app.js'].forEach(f => {
        const s = w.document.createElement('script');
        s.textContent = leer(f);
        w.document.body.appendChild(s);
    });
    if (typeof w.init === 'function') { try { w.init(); } catch (e) {} }
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    return w;
}

function set(w, id, val) {
    const el = w.document.getElementById(id);
    if (!el) throw new Error('no existe el campo ' + id);
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = String(val);
    el.dispatchEvent(new w.Event('input', { bubbles: true }));
    el.dispatchEvent(new w.Event('change', { bubbles: true }));
    return el;
}

function casoBase(w) {
    set(w, 'edad', 62);
    set(w, 'sexo', 'M');
    set(w, 'indicacion', w.document.getElementById('indicacion').options[1].value);
    set(w, 'fevi_reposo', 60);
    set(w, 'fevi_pico', 68);
    set(w, 'esf_basal_fc', 70);
    set(w, 'esf_basal_tas', 120);
    set(w, 'esf_basal_tad', 80);
    set(w, 'esf_max_fc', 150);
    set(w, 'esf_max_tas', 170);
    set(w, 'esf_max_tad', 85);
    set(w, 'esf_rec_fc', 130);
    set(w, 'ej_mets', 9);
    set(w, 'ej_seg_img', 45);
    set(w, 'ej_fc_img', 135);
    set(w, 'ej_causa_detencion',
        w.document.getElementById('ej_causa_detencion').options[1].value);
    return w;
}

function puntajes(w, reposo = {}, estres = {}) {
    Object.entries(reposo).forEach(([id, v]) => w.setScore(Number(id), 'reposo', v));
    Object.entries(estres).forEach(([id, v]) => w.setScore(Number(id), 'estres', v));
}

function todoNormal(w) {
    for (let i = 1; i <= 17; i++) { w.setScore(i, 'reposo', 1); w.setScore(i, 'estres', 1); }
}

function informe(w) {
    const H = w.recolectarHallazgos();
    const { rama, texto } = w.construirNarrativa(H);
    // INCOHERENCIAS_INFORME es un `let` de script: no queda en window. Se recalcula.
    return { H, rama, texto, incoherencias: w.incoherenciasInforme(texto, H) };
}

// Un bloque puede tener varios párrafos (Reposo: método / eco / diastólica): se
// devuelven todos hasta el siguiente rótulo.
const ROTULOS = /^(Indicación|Antecedentes|Calidad del estudio|Reposo|Esfuerzo|Motilidad|Viabilidad|Estenosis aórtica|ECG reposo|ECG post-esfuerzo|Estudio diastólico de esfuerzo|Conclusión):/;
function linea(texto, rotulo) {
    const ps = texto.split('\n\n');
    const i = ps.findIndex(p => p.startsWith(rotulo + ':'));
    if (i < 0) return '';
    let j = i + 1;
    while (j < ps.length && !ROTULOS.test(ps[j])) j++;
    return ps.slice(i, j).join('\n\n');
}

module.exports = { cargarApp, set, casoBase, puntajes, todoNormal, informe, linea, PROJ };
