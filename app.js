/* ================================================
   Eco Estrés Cardíaco — app.js  v1.0
   ================================================ */

// ── ESTADO GLOBAL ──────────────────────────────
const WM = {
    reposo: {},   // segId → score 0-5
    estres: {}
};

// Definición de los 17 segmentos AHA
// Orientación estándar eco: visto desde el ápex, LATERAL a la derecha, SEPTAL a la izquierda.
// Sentido horario desde 12h: Anterior → Anterolateral → Inferolateral → Inferior → Inferoseptal → Anteroseptal
const SEGMENTS = [
    // Basales (ring 0) — horario desde 12h: Ant(0), AL(1), IL(2), Inf(3), IS(4), AS(5)
    { id:1,  name:'Basal Anterior',       ring:0, pos:0, territory:'DA' },
    { id:6,  name:'Basal Anterolateral',  ring:0, pos:1, territory:'Cx' },
    { id:5,  name:'Basal Inferolateral',  ring:0, pos:2, territory:'Cx' },
    { id:4,  name:'Basal Inferior',       ring:0, pos:3, territory:'CD' },
    { id:3,  name:'Basal Inferoseptal',   ring:0, pos:4, territory:'CD' },
    { id:2,  name:'Basal Anteroseptal',   ring:0, pos:5, territory:'DA' },
    // Medios (ring 1) — mismo orden horario
    { id:7,  name:'Mid Anterior',         ring:1, pos:0, territory:'DA' },
    { id:12, name:'Mid Anterolateral',    ring:1, pos:1, territory:'Cx' },
    { id:11, name:'Mid Inferolateral',    ring:1, pos:2, territory:'Cx' },
    { id:10, name:'Mid Inferior',         ring:1, pos:3, territory:'CD' },
    { id:9,  name:'Mid Inferoseptal',     ring:1, pos:4, territory:'CD' },
    { id:8,  name:'Mid Anteroseptal',     ring:1, pos:5, territory:'DA' },
    // Apicales (ring 2, 4 seg a 90°) — horario: Ant(0), Lat(1), Inf(2), Sep(3)
    { id:13, name:'Apical Anterior',      ring:2, pos:0, territory:'DA' },
    { id:16, name:'Apical Lateral',       ring:2, pos:1, territory:'Cx' },
    { id:15, name:'Apical Inferior',      ring:2, pos:2, territory:'CD' },
    { id:14, name:'Apical Septal',        ring:2, pos:3, territory:'DA' },
    // Apex (ring 3)
    { id:17, name:'Apex',                 ring:3, pos:0, territory:'DA' }
];

// Radios [interior, exterior] por anillo
const RING_RADII = [[85,140],[45,85],[15,45],[0,15]];
const RING_COUNTS = [6,6,4,1];
const CX = 150, CY = 150;

const SCORE_COLORS = ['#9CA3AF','#22C55E','#FDE047','#FB923C','#EF4444','#A855F7'];
const SCORE_LABELS = ['—','Normal','Hipoc.L','Hipoc.M','Acinesia','Discinesia'];

let currentProtocol = 'ejercicio';
let currentSpecialTab = 'viabilidad';

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar scores en 0 (no evaluado)
    SEGMENTS.forEach(s => { WM.reposo[s.id] = 0; WM.estres[s.id] = 0; });

    initTheme();
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

    buildSegmentsTable();
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    updateWMSI();

    // Sincronizar peso dobutamina con peso principal
    document.getElementById('peso').addEventListener('input', () => {
        const p = document.getElementById('peso').value;
        if (p) document.getElementById('dob_peso').value = p;
        if (p) document.getElementById('dip_peso').value = p;
        calcDobutamina();
        calcDipiridamol();
    });
});

// ── TEMA ──────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('eco-estres-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-icon').textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('eco-estres-theme', next);
}

// ── BSA ───────────────────────────────────────
function calcBSA() {
    const peso = parseFloat(document.getElementById('peso').value);
    const altura = parseFloat(document.getElementById('altura').value);
    if (peso > 0 && altura > 0) {
        const bsa = 0.007184 * Math.pow(altura, 0.725) * Math.pow(peso, 0.425);
        document.getElementById('sc_display').value = bsa.toFixed(2) + ' m²';
    } else {
        document.getElementById('sc_display').value = '';
    }
}

// ── CAMBIO DE EDAD ─────────────────────────────
function onEdadChange() {
    calcEjercicio();
    calcDobutamina();
}

// ── PROTOCOLO TABS ────────────────────────────
function setProtocol(proto) {
    currentProtocol = proto;
    document.querySelectorAll('.protocol-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.protocol === proto);
    });
    document.querySelectorAll('.protocol-panel').forEach(p => p.style.display = 'none');
    document.getElementById('panel-' + proto).style.display = 'block';
}

// ── CALCULADORA EJERCICIO ─────────────────────
function calcEjercicio() {
    const edad = parseInt(document.getElementById('edad').value) || 0;
    const fcPico = parseInt(document.getElementById('ej_fc_pico').value) || 0;

    if (edad > 0) {
        const fcMax = 220 - edad;
        const fc85 = Math.round(fcMax * 0.85);
        document.getElementById('fc_max_predicha').textContent = fcMax + ' lpm';
        document.getElementById('fc_85').textContent = fc85 + ' lpm';

        if (fcPico > 0) {
            const pct = Math.round((fcPico / fcMax) * 100);
            document.getElementById('pct_fc').textContent = pct + '%';
            document.getElementById('pct_fc').style.color = pct >= 85 ? 'var(--color-success)' : 'var(--color-error)';
            document.getElementById('resp_cronotrop').textContent = pct >= 85 ? '✓ Adecuada' : '✗ Inadecuada / Incompetencia cronotrópica';
            document.getElementById('resp_cronotrop').style.color = pct >= 85 ? 'var(--color-success)' : 'var(--color-error)';
        } else {
            document.getElementById('pct_fc').textContent = '—';
            document.getElementById('resp_cronotrop').textContent = '—';
        }
    } else {
        document.getElementById('fc_max_predicha').textContent = '—';
        document.getElementById('fc_85').textContent = '—';
        document.getElementById('pct_fc').textContent = '—';
        document.getElementById('resp_cronotrop').textContent = '—';
    }
}

// ── CALCULADORA DOBUTAMINA ────────────────────
function calcDobutamina() {
    const edad = parseInt(document.getElementById('edad').value) || 0;
    const peso = parseFloat(document.getElementById('dob_peso').value) || 0;
    const fcPico = parseInt(document.getElementById('dob_fc_pico').value) || 0;
    const dosisMax = parseInt(document.getElementById('dob_dosis_max').value) || 40;

    // FC targets
    if (edad > 0) {
        const fcMax = 220 - edad;
        const fc85 = Math.round(fcMax * 0.85);
        document.getElementById('dob_fc_max').textContent = fcMax + ' lpm';
        document.getElementById('dob_fc_target').textContent = fc85 + ' lpm';
        if (fcPico > 0) {
            const pct = Math.round((fcPico / fcMax) * 100);
            document.getElementById('dob_pct_fc').textContent = pct + '%';
            document.getElementById('dob_adecuacion').textContent = pct >= 85 ? '✓ Estudio adecuado' : '✗ FC sub-máxima';
            document.getElementById('dob_adecuacion').style.color = pct >= 85 ? 'var(--color-success)' : 'var(--color-error)';
        }
    }

    // Tabla de etapas
    const etapas = [5, 10, 20, 30, 40];
    const tbody = document.getElementById('dob-etapas');
    tbody.innerHTML = '';

    etapas.forEach((dosis, i) => {
        if (dosis > dosisMax) return;
        const velH = peso > 0 ? ((dosis * peso * 60) / 1000).toFixed(1) : '—';
        let rowClass = '';
        if (dosis <= 10) rowClass = 'dob-stage-low';
        else if (dosis <= 20) rowClass = 'dob-stage-mid';
        else if (dosis <= 30) rowClass = 'dob-stage-high';
        else rowClass = 'dob-stage-max';

        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `
            <td><strong>E${i+1}</strong></td>
            <td><strong>${dosis}</strong></td>
            <td>3 min</td>
            <td>${velH}${peso > 0 ? ' mL/h' : ''}</td>
            <td><input type="number" placeholder="lpm" style="width:65px"></td>
            <td><input type="text" placeholder="SIS/DIA" style="width:75px"></td>
            <td><input type="text" placeholder="Sin síntomas" style="width:120px"></td>
        `;
        tbody.appendChild(tr);
    });

    // Fila atropina
    const trAtr = document.createElement('tr');
    trAtr.style.background = '#FDF4FF';
    trAtr.innerHTML = `
        <td colspan="2"><strong style="color:#7C3AED">Atropina</strong> (0.25 mg c/1 min, máx 1 mg)</td>
        <td>—</td><td>—</td>
        <td><input type="number" placeholder="lpm" style="width:65px"></td>
        <td><input type="text" placeholder="SIS/DIA" style="width:75px"></td>
        <td><input type="text" placeholder="Sin síntomas" style="width:120px"></td>
    `;
    tbody.appendChild(trAtr);
}

// ── CALCULADORA DIPIRIDAMOL ───────────────────
function calcDipiridamol() {
    const peso = parseFloat(document.getElementById('dip_peso').value) || 0;
    const protocolo = document.getElementById('dip_protocolo').value;

    if (peso <= 0) {
        ['dip_dosis_total','dip_volumen','dip_fase1','dip_fase2'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
        return;
    }

    const dosis1 = 0.56 * peso;
    const vol1 = dosis1 / 5; // amp 5 mg/mL
    const velH1 = (vol1 * 60 / 4).toFixed(1); // 4 min

    document.getElementById('dip_fase1').textContent =
        `${dosis1.toFixed(1)} mg | Vol: ${vol1.toFixed(1)} mL | Vel: ${velH1} mL/h (en 4 min)`;

    const fase2Row = document.getElementById('dip_fase2_row');

    if (protocolo === 'alto') {
        const dosis2 = 0.28 * peso;
        const vol2 = dosis2 / 5;
        const velH2 = (vol2 * 60 / 2).toFixed(1); // 2 min
        document.getElementById('dip_fase2').textContent =
            `${dosis2.toFixed(1)} mg | Vol: ${vol2.toFixed(1)} mL | Vel: ${velH2} mL/h (en 2 min)`;
        fase2Row.style.display = 'flex';
        document.getElementById('dip_dosis_total').textContent = `${(dosis1 + dosis2).toFixed(1)} mg (0.84 mg/kg)`;
        document.getElementById('dip_volumen').textContent = `${(vol1 + vol2).toFixed(1)} mL`;
    } else {
        fase2Row.style.display = 'none';
        document.getElementById('dip_dosis_total').textContent = `${dosis1.toFixed(1)} mg (0.56 mg/kg)`;
        document.getElementById('dip_volumen').textContent = `${vol1.toFixed(1)} mL`;
    }
}

// ── FEY ───────────────────────────────────────
function calcFEVI() {
    const rep = parseFloat(document.getElementById('fevi_reposo').value);
    const pico = parseFloat(document.getElementById('fevi_pico').value);
    if (rep > 0 && pico > 0) {
        const delta = pico - rep;
        const txt = (delta >= 0 ? '+' : '') + delta.toFixed(0) + '%';
        document.getElementById('delta_fevi').value = txt +
            (delta >= 5 ? ' ▲ Adecuada' : delta >= 0 ? ' → Preservada' : ' ▼ Caída (isquemia / fatiga)');
    } else {
        document.getElementById('delta_fevi').value = '';
    }
}

// ── BULL'S EYE SVG ────────────────────────────
function polar2cart(r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function makeSegPath(ring, pos) {
    const [r1, r2] = RING_RADII[ring];
    const count = RING_COUNTS[ring];

    if (count === 1) {
        return `M ${CX} ${CY} m -${r2} 0 a ${r2} ${r2} 0 1 0 ${r2*2} 0 a ${r2} ${r2} 0 1 0 -${r2*2} 0`;
    }

    const step = 360 / count;
    const a1 = pos * step;
    const a2 = (pos + 1) * step;
    const [x1i, y1i] = polar2cart(r1, a1);
    const [x1o, y1o] = polar2cart(r2, a1);
    const [x2i, y2i] = polar2cart(r1, a2);
    const [x2o, y2o] = polar2cart(r2, a2);
    const large = step > 180 ? 1 : 0;
    return `M ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${r1} ${r1} 0 ${large} 0 ${x1i} ${y1i} Z`;
}

function getSegLabelPos(seg) {
    if (seg.ring === 3) return [CX, CY];
    const [r1, r2] = RING_RADII[seg.ring];
    const rMid = (r1 + r2) / 2;
    const step = 360 / RING_COUNTS[seg.ring];
    const aMid = (seg.pos + 0.5) * step;
    return polar2cart(rMid, aMid);
}

function renderBullsEye(svgId, stateKey) {
    const svg = document.getElementById(svgId);
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';

    // Background circle
    const bg = document.createElementNS(NS, 'circle');
    bg.setAttribute('cx', CX); bg.setAttribute('cy', CY); bg.setAttribute('r', 148);
    bg.setAttribute('fill', 'var(--color-bg-card)');
    svg.appendChild(bg);

    SEGMENTS.forEach(seg => {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'seg-group');

        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', makeSegPath(seg.ring, seg.pos));
        path.setAttribute('class', 'seg-path');
        path.setAttribute('data-id', seg.id);
        path.setAttribute('data-key', stateKey);
        path.setAttribute('fill', SCORE_COLORS[WM[stateKey][seg.id]]);
        path.setAttribute('stroke', 'var(--color-bg-card)');
        path.setAttribute('stroke-width', '2');
        path.style.cursor = 'pointer';

        path.addEventListener('click', () => {
            WM[stateKey][seg.id] = (WM[stateKey][seg.id] + 1) % 6;
            path.setAttribute('fill', SCORE_COLORS[WM[stateKey][seg.id]]);
            updateWMSI();
            updateSegTableRow(seg.id);
        });

        // Tooltip
        const title = document.createElementNS(NS, 'title');
        title.textContent = `${seg.id}. ${seg.name} (${seg.territory}) — ${SCORE_LABELS[WM[stateKey][seg.id]]}`;
        path.appendChild(title);
        path.addEventListener('click', () => {
            title.textContent = `${seg.id}. ${seg.name} (${seg.territory}) — ${SCORE_LABELS[WM[stateKey][seg.id]]}`;
        });

        // Número
        const [lx, ly] = getSegLabelPos(seg);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', lx); txt.setAttribute('y', ly);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('font-size', seg.ring === 3 ? '11' : '9');
        txt.setAttribute('font-weight', 'bold');
        txt.setAttribute('fill', [2,3].includes(seg.id) || WM[stateKey][seg.id] === 0 ? '#374151' : '#fff');
        txt.style.pointerEvents = 'none';
        txt.textContent = seg.id;

        g.appendChild(path);
        g.appendChild(txt);
        svg.appendChild(g);
    });

    // Labels de anillos
    addRingLabels(svg, NS);
}

function addRingLabels(svg, NS) {
    const labels = [
        { text: 'Basal', r: 115, a: 272 },
        { text: 'Mid', r: 65, a: 272 },
        { text: 'Ap.', r: 30, a: 272 }
    ];
    labels.forEach(l => {
        const [x, y] = polar2cart(l.r, l.a);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', x); txt.setAttribute('y', y);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('font-size', '7');
        txt.setAttribute('fill', 'var(--color-text-secondary)');
        txt.setAttribute('font-style', 'italic');
        txt.style.pointerEvents = 'none';
        txt.textContent = l.text;
        svg.appendChild(txt);
    });
}

// ── WMSI ─────────────────────────────────────
function calcWMSI(stateKey) {
    let sum = 0, n = 0;
    SEGMENTS.forEach(s => {
        const score = WM[stateKey][s.id];
        if (score > 0) { sum += score; n++; }
    });
    if (n === 0) return null;
    return (sum / n).toFixed(2);
}

function updateWMSI() {
    const wmsiRep = calcWMSI('reposo');
    const wmsiEst = calcWMSI('estres');

    const repTxt = wmsiRep !== null ? wmsiRep : '—';
    const estTxt = wmsiEst !== null ? wmsiEst : '—';

    document.getElementById('wmsi-reposo').textContent = repTxt;
    document.getElementById('wmsi-estres').textContent = wmsiEst !== null ? wmsiEst : '—';
    document.getElementById('wmsi-rep-tabla').textContent = repTxt;
    document.getElementById('wmsi-est-tabla').textContent = estTxt;

    // Respuesta global
    const globalResp = document.getElementById('wmsi-global-resp');
    if (wmsiRep !== null && wmsiEst !== null) {
        const dif = parseFloat(wmsiEst) - parseFloat(wmsiRep);
        if (parseFloat(wmsiEst) > 1.0 && dif > 0.1) {
            globalResp.innerHTML = '<span class="response-ischemia">▲ WMSI Estrés elevado</span>';
        } else if (parseFloat(wmsiEst) <= 1.0) {
            globalResp.innerHTML = '<span class="response-normal">✓ Sin nueva anomalía</span>';
        } else {
            globalResp.innerHTML = '<span class="response-scar">Sin cambio significativo</span>';
        }
    } else {
        globalResp.textContent = '';
    }
}

// ── TABLA SEGMENTOS ───────────────────────────
function getResponse(scoreRep, scoreEst) {
    if (scoreRep === 0 && scoreEst === 0) return '<span style="color:var(--color-text-secondary)">—</span>';
    if (scoreRep <= 1 && scoreEst <= 1) return '<span class="response-normal">Normal</span>';
    if (scoreRep <= 1 && scoreEst > 1) return '<span class="response-ischemia">Isquemia</span>';
    if (scoreRep > 1 && scoreEst < scoreRep && scoreEst <= 1) return '<span class="response-viability">Viabilidad</span>';
    if (scoreRep > 1 && scoreEst < scoreRep) return '<span class="response-viability">Mejoría</span>';
    if (scoreRep > 1 && scoreEst > scoreRep) return '<span class="response-ischemia">Isq. s/ necrosis</span>';
    if (scoreRep > 1 && scoreEst === scoreRep) return '<span class="response-scar">Cicatriz</span>';
    return '<span style="color:var(--color-text-secondary)">—</span>';
}

function makeBtns(segId, stateKey) {
    return SCORE_COLORS.map((color, i) =>
        `<button class="seg-score-btn ${WM[stateKey][segId] === i ? 'active' : ''}"
            style="background:${color}; color:${i >= 4 ? '#fff' : '#111'}"
            onclick="setScore(${segId},'${stateKey}',${i})" title="${SCORE_LABELS[i]}">${i}</button>`
    ).join('');
}

function buildSegmentsTable() {
    const tbody = document.getElementById('segments-tbody');
    tbody.innerHTML = '';
    // Siempre mostrar en orden 1-17 independientemente del orden visual del bull's eye
    const sorted = [...SEGMENTS].sort((a, b) => a.id - b.id);
    sorted.forEach(seg => {
        const badgeClass = seg.territory === 'DA' ? 'badge-da' : seg.territory === 'CD' ? 'badge-cd' : 'badge-cx';
        const tr = document.createElement('tr');
        tr.id = `seg-row-${seg.id}`;
        tr.innerHTML = `
            <td>${seg.id}</td>
            <td>${seg.name}</td>
            <td><span class="${badgeClass}">${seg.territory}</span></td>
            <td id="btns-rep-${seg.id}">${makeBtns(seg.id, 'reposo')}</td>
            <td id="btns-est-${seg.id}">${makeBtns(seg.id, 'estres')}</td>
            <td id="resp-${seg.id}">${getResponse(WM.reposo[seg.id], WM.estres[seg.id])}</td>
        `;
        tbody.appendChild(tr);
    });
}

function setScore(segId, stateKey, score) {
    WM[stateKey][segId] = score;
    updateSegTableRow(segId);
    updateWMSI();
    // Actualizar color en SVG correspondiente
    const svgId = stateKey === 'reposo' ? 'svg-reposo' : 'svg-estres';
    const path = document.querySelector(`#${svgId} path[data-id="${segId}"]`);
    if (path) path.setAttribute('fill', SCORE_COLORS[score]);
}

function updateSegTableRow(segId) {
    const repCell = document.getElementById(`btns-rep-${segId}`);
    const estCell = document.getElementById(`btns-est-${segId}`);
    const respCell = document.getElementById(`resp-${segId}`);
    if (repCell) repCell.innerHTML = makeBtns(segId, 'reposo');
    if (estCell) estCell.innerHTML = makeBtns(segId, 'estres');
    if (respCell) respCell.innerHTML = getResponse(WM.reposo[segId], WM.estres[segId]);
}

// ── ESTRÉS DIASTÓLICO ─────────────────────────
function calcDiastolico() {
    const ePrimeRep = parseFloat(document.getElementById('e_prima_rep').value);
    const eOndaRep = parseFloat(document.getElementById('e_onda_rep').value);
    const ePrimeEst = parseFloat(document.getElementById('e_prima_est').value);
    const eOndaEst = parseFloat(document.getElementById('e_onda_est').value);

    if (ePrimeRep > 0 && eOndaRep > 0) {
        const eeRep = (eOndaRep / ePrimeRep).toFixed(1);
        document.getElementById('ee_reposo').value = eeRep;
        const interpRep = parseFloat(eeRep) > 14 ? '↑ Elevado (DD probable)' : parseFloat(eeRep) > 8 ? 'Normal-alto' : '✓ Normal';
        document.getElementById('diast_rep_interp').textContent = `E/e' ${eeRep} — ${interpRep}`;
    }

    if (ePrimeEst > 0 && eOndaEst > 0) {
        const eeEst = (eOndaEst / ePrimeEst).toFixed(1);
        document.getElementById('ee_estres').value = eeEst;
        const interpEst = parseFloat(eeEst) > 14 ? '↑ Elevado — PAD aumentada con estrés' : parseFloat(eeEst) > 8 ? 'Normal-alto' : '✓ Normal';
        document.getElementById('diast_est_interp').textContent = `E/e' ${eeEst} — ${interpEst}`;
    }

    const eeRepVal = ePrimeRep > 0 && eOndaRep > 0 ? eOndaRep / ePrimeRep : 0;
    const eeEstVal = ePrimeEst > 0 && eOndaEst > 0 ? eOndaEst / ePrimeEst : 0;

    if (eeRepVal > 0 && eeEstVal > 0) {
        let resp;
        if (eeEstVal > 14) {
            resp = '⚠ POSITIVO: PAD elevada con estrés (E/e\' >14)';
        } else if (eeEstVal > eeRepVal * 1.2) {
            resp = '↑ Aumento de PAD con estrés (sugestivo)';
        } else {
            resp = '✓ Respuesta diastólica normal al estrés';
        }
        document.getElementById('diast_respuesta').textContent = resp;
    } else {
        document.getElementById('diast_respuesta').textContent = '—';
    }
}

// ── RESULTADO BANNER ──────────────────────────
function updateResultBanner() {
    const val = document.getElementById('resultado_estudio').value;
    const banner = document.getElementById('resultado-banner');
    if (!val) { banner.style.display = 'none'; return; }
    banner.style.display = 'block';
    banner.className = 'resultado-banner';
    const map = {
        'negativo':            { cls: 'resultado-negativo',      txt: '✓ NEGATIVO PARA ISQUEMIA INDUCIBLE' },
        'positivo':            { cls: 'resultado-positivo',      txt: '⚠ POSITIVO PARA ISQUEMIA INDUCIBLE' },
        'no_concluyente':      { cls: 'resultado-no-concluyente', txt: '— ESTUDIO NO CONCLUYENTE —' },
        'hta_respuesta':       { cls: 'resultado-no-concluyente', txt: 'RESPUESTA HIPERTENSIVA — Sin isquemia evidente' },
        'viabilidad_positiva': { cls: 'resultado-viabilidad',    txt: '✓ VIABILIDAD MIOCÁRDICA POSITIVA' },
        'viabilidad_negativa': { cls: 'resultado-no-concluyente', txt: 'VIABILIDAD NEGATIVA — Cicatriz transmural' },
        'diastolico_positivo': { cls: 'resultado-positivo',      txt: '⚠ DISFUNCIÓN DIASTÓLICA INDUCIBLE' }
    };
    const item = map[val] || { cls: '', txt: val };
    banner.classList.add(item.cls);
    banner.textContent = item.txt;
}

// ── MÓDULOS ESPECIALES ────────────────────────
function setSpecialTab(tab) {
    currentSpecialTab = tab;
    document.querySelectorAll('.special-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab.split('_')[0]) ||
            btn.onclick.toString().includes(tab));
    });
    document.querySelectorAll('.special-panel').forEach(p => p.style.display = 'none');
    document.getElementById('panel-' + tab).style.display = 'block';
}

// CFR
function calcCFR() {
    const vBas = parseFloat(document.getElementById('cfr_vel_basal').value);
    const vEst = parseFloat(document.getElementById('cfr_vel_estres').value);
    if (vBas > 0 && vEst > 0) {
        const cfr = (vEst / vBas).toFixed(2);
        document.getElementById('cfr_resultado').value = cfr;
        let interp;
        if (parseFloat(cfr) >= 2.0) interp = '✓ Normal (≥2.0)';
        else if (parseFloat(cfr) >= 1.5) interp = '⚠ Limítrofe (1.5–1.99)';
        else interp = '✗ Reducida (<1.5) — Isquemia / Disfunción microvascular';
        document.getElementById('cfr_interp').value = interp;
    } else {
        document.getElementById('cfr_resultado').value = '';
        document.getElementById('cfr_interp').value = '';
    }
}

// Strain
function calcStrain() {
    const glsRep = parseFloat(document.getElementById('strain_gls_rep').value);
    const glsEst = parseFloat(document.getElementById('strain_gls_est').value);
    if (!isNaN(glsRep) && !isNaN(glsEst)) {
        const delta = Math.abs(glsEst) - Math.abs(glsRep);
        document.getElementById('strain_reserva').value = (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
        let interp;
        if (delta >= 2) interp = '✓ Reserva contráctil normal (ΔGLS ≥2%)';
        else if (delta >= 0) interp = '⚠ Reserva contráctil reducida (ΔGLS <2%)';
        else interp = '✗ Deterioro GLS con estrés (isquemia / disfunción subclínica)';
        document.getElementById('strain_interp').value = interp;
    }
}

// EAo
function calcEAo() {
    const gradRep = parseFloat(document.getElementById('eao_grad_reposo').value);
    const avaRep = parseFloat(document.getElementById('eao_ava_reposo').value);
    const gradDob = parseFloat(document.getElementById('eao_grad_dob').value);
    const avaDob = parseFloat(document.getElementById('eao_ava_dob').value);

    if (gradRep > 0 && gradDob > 0) {
        const dGrad = gradDob - gradRep;
        document.getElementById('eao_delta_grad').textContent = (dGrad >= 0 ? '+' : '') + dGrad.toFixed(0) + ' mmHg';
    }
    if (avaRep > 0 && avaDob > 0) {
        const dAva = avaDob - avaRep;
        document.getElementById('eao_delta_ava').textContent = (dAva >= 0 ? '+' : '') + dAva.toFixed(2) + ' cm²';

        // Interpretación
        let interp = '—';
        if (gradDob >= 40 && dAva < 0.3) {
            interp = 'EAo VERDADERA severa (↑ gradiente, AVA sin cambio)';
        } else if (gradDob < 40 && dAva >= 0.3) {
            interp = 'PSEUDOESTENOSIS (↑ AVA, gradiente no aumenta a ≥40 mmHg)';
        } else if (gradDob >= 40 && dAva >= 0.3) {
            interp = 'Indeterminado (ambos aumentan)';
        } else {
            interp = 'Sin reserva de flujo — pronóstico adverso';
        }
        document.getElementById('eao_interp').textContent = interp;
    }
}

// MCH
function calcMCH() {
    const gradRep = parseFloat(document.getElementById('mch_grad_reposo').value) || 0;
    const gradEst = parseFloat(document.getElementById('mch_grad_estres').value) || 0;
    if (gradRep > 0 && gradEst > 0) {
        const delta = gradEst - gradRep;
        document.getElementById('mch_delta_grad').value = (delta >= 0 ? '+' : '') + delta.toFixed(0) + ' mmHg';
        document.getElementById('mch_obs_latente').value =
            gradEst > 30 && gradRep <= 30 ? '✓ Obstrucción latente inducible' :
            gradEst > 30 && gradRep > 30 ? 'Obstrucción en reposo y estrés' :
            '— Sin obstrucción significativa';
    }
}

// ── CARGA RÁPIDA POR TERRITORIO ───────────────
function setTerritoryScore(stateKey, territory, score) {
    SEGMENTS.forEach(seg => {
        if (seg.territory === territory) WM[stateKey][seg.id] = score;
    });
    renderBullsEye('svg-' + stateKey, stateKey);
    buildSegmentsTable();
    updateWMSI();
}

function setAllNormal(stateKey) {
    SEGMENTS.forEach(seg => { WM[stateKey][seg.id] = 1; });
    renderBullsEye('svg-' + stateKey, stateKey);
    buildSegmentsTable();
    updateWMSI();
}

function resetAllScores() {
    SEGMENTS.forEach(seg => { WM.reposo[seg.id] = 0; WM.estres[seg.id] = 0; });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();
}

// ── GENERADOR DE REPORTE ──────────────────────
function generarReporte() {
    const hoy = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const id = v('paciente_id');
    const nombre = v('paciente_nombre');
    const edad = v('edad');
    const sexo = document.getElementById('sexo').value === 'M' ? 'Masculino' : 'Femenino';
    const peso = v('peso');
    const altura = v('altura');
    const sc = document.getElementById('sc_display').value;
    const ventana = document.getElementById('ventana').options[document.getElementById('ventana').selectedIndex].text;
    const contraste = document.getElementById('contraste_usado').value !== 'no' ? 'Sí' : 'No';

    const fcRep = v('fc_reposo');
    const taRep = v('ta_reposo');

    // Indicación
    const indEl = document.getElementById('indicacion');
    const indicacion = indEl.value ? indEl.options[indEl.selectedIndex].text : '—';
    const indLibre = v('indicacion_libre');

    // Antecedentes
    const ants = [];
    ['hta','dm','tabaquismo','dislipemia','isquemia','iam','crm','fa','betabloq','epoc','mcd','valv'].forEach(k => {
        if (document.getElementById('ant_' + k).checked)
            ants.push(document.getElementById('ant_' + k).nextElementSibling.textContent);
    });

    // Protocolo
    let protoTxt = '';
    if (currentProtocol === 'ejercicio') {
        const modal = document.getElementById('ej_modalidad').options[document.getElementById('ej_modalidad').selectedIndex].text;
        const fcPico = v('ej_fc_pico');
        const fcMax = document.getElementById('fc_max_predicha').textContent;
        const pct = document.getElementById('pct_fc').textContent;
        const cronotrop = document.getElementById('resp_cronotrop').textContent;
        const mets = v('ej_mets');
        const dur = v('ej_duracion');
        const etapa = v('ej_etapa') || '—';
        const taPico = v('ej_ta_pico');
        const motivoEl = document.getElementById('ej_motivo_fin');
        const motivo = motivoEl.options[motivoEl.selectedIndex].text;
        protoTxt = `PROTOCOLO: ESTRÉS CON EJERCICIO
Modalidad: ${modal}
FC Reposo: ${fcRep || '—'} lpm  |  TA Reposo: ${taRep || '—'} mmHg
FC Máxima Predicha: ${fcMax}  |  Target 85%: ${document.getElementById('fc_85').textContent}
FC Pico Alcanzada: ${fcPico ? fcPico + ' lpm' : '—'}  |  % FC Máxima: ${pct}
Respuesta Cronotrópica: ${cronotrop}
METs: ${mets || '—'}  |  Duración: ${dur || '—'}  |  Etapa: ${etapa}
TA Pico: ${taPico || '—'} mmHg
Motivo de terminación: ${motivo}`;

    } else if (currentProtocol === 'dobutamina') {
        const dosisMax = v('dob_dosis_max');
        const fcPico = v('dob_fc_pico');
        const pct = document.getElementById('dob_pct_fc').textContent;
        const adec = document.getElementById('dob_adecuacion').textContent;
        const atrop = document.getElementById('dob_atropina').value;
        const taPico = v('dob_ta_pico');
        const motivoEl = document.getElementById('dob_motivo_fin');
        const motivo = motivoEl.options[motivoEl.selectedIndex].text;
        protoTxt = `PROTOCOLO: DOBUTAMINA
Dosis Máxima: ${dosisMax} mcg/kg/min  |  Atropina: ${atrop === 'no' ? 'No' : atrop + ' mg'}
FC Reposo: ${fcRep || '—'} lpm  |  TA Reposo: ${taRep || '—'} mmHg
FC Pico: ${fcPico ? fcPico + ' lpm' : '—'}  |  % FC Máxima: ${pct}
Adecuación: ${adec}
TA Pico: ${taPico || '—'} mmHg
Motivo de terminación: ${motivo}`;

    } else if (currentProtocol === 'dipiridamol') {
        const protoDip = document.getElementById('dip_protocolo').options[document.getElementById('dip_protocolo').selectedIndex].text;
        const dosisTxt = document.getElementById('dip_dosis_total').textContent;
        const aminoEl = document.getElementById('dip_aminofilina');
        const amino = aminoEl.value !== 'no' ? aminoEl.options[aminoEl.selectedIndex].text : 'No utilizada';
        const motivoEl = document.getElementById('dip_motivo_fin');
        const motivo = motivoEl.options[motivoEl.selectedIndex].text;
        protoTxt = `PROTOCOLO: DIPIRIDAMOL
Protocolo: ${protoDip}
Dosis Total Administrada: ${dosisTxt}
FC Reposo: ${fcRep || '—'} lpm  |  TA Reposo: ${taRep || '—'} mmHg
FC Pico: ${v('dip_fc_pico') || '—'} lpm  |  TA Pico: ${v('dip_ta_pico') || '—'} mmHg
Aminofilina: ${amino}
Motivo de terminación: ${motivo}`;

    } else {
        const ncEl = document.getElementById('nc_tipo');
        const tipo = ncEl.options[ncEl.selectedIndex].text;
        protoTxt = `PROTOCOLO: NO CONVENCIONAL
Tipo de apremio: ${tipo}
${v('nc_descripcion') ? 'Descripción: ' + v('nc_descripcion') : ''}`;
    }

    // FEy
    const feviRep = v('fevi_reposo');
    const feviPico = v('fevi_pico');
    const feviRecup = v('fevi_recup');
    const deltaFevi = document.getElementById('delta_fevi').value;

    // Wall motion
    let wmLines = '';
    SEGMENTS.forEach(seg => {
        const scRep = WM.reposo[seg.id];
        const scEst = WM.estres[seg.id];
        if (scRep > 0 || scEst > 0) {
            const resp = getResponseText(scRep, scEst);
            wmLines += `  ${String(seg.id).padStart(2)}. ${seg.name.padEnd(22)} [${seg.territory}]   Reposo: ${SCORE_LABELS[scRep] || '—'.padEnd(9)}  Estrés: ${SCORE_LABELS[scEst] || '—'.padEnd(9)}  → ${resp}\n`;
        }
    });
    const wmsiRep = calcWMSI('reposo') || '—';
    const wmsiEst = calcWMSI('estres') || '—';

    // Diastólico
    const eeRep = document.getElementById('ee_reposo').value;
    const eeEst = document.getElementById('ee_estres').value;
    const diastResp = document.getElementById('diast_respuesta').textContent;

    // Resultado
    const resultEl = document.getElementById('resultado_estudio');
    const resultado = resultEl.value ? resultEl.options[resultEl.selectedIndex].text : '—';
    const territorioEl = document.getElementById('territorio_afectado');
    const territorio = territorioEl.options[territorioEl.selectedIndex].text;
    const extensionEl = document.getElementById('extension_isquemia');
    const extension = extensionEl.value ? extensionEl.options[extensionEl.selectedIndex].text : '—';

    // Hallazgos
    const hals = [];
    const halMap = {
        'hal_angina':'Angina durante el estudio',
        'hal_disnea':'Disnea de esfuerzo',
        'hal_st_dep':'Descenso del ST en ECG',
        'hal_st_ele':'Elevación del ST en ECG',
        'hal_arritmia':'Arritmia significativa',
        'hal_hipotension':'Respuesta hipotensora',
        'hal_hipertensiva':'Respuesta hipertensiva',
        'hal_extrasistoles':'Extrasístoles ventriculares frecuentes'
    };
    Object.entries(halMap).forEach(([id, lbl]) => {
        if (document.getElementById(id).checked) hals.push(lbl);
    });

    const conclusion = v('conclusion_libre');

    // Armar reporte
    const sep = '─'.repeat(64);
    let rep = `ECOCARDIOGRAMA DE ESTRÉS
${sep}

DATOS DEL PACIENTE
${nombre ? 'Paciente: ' + nombre + '\n' : ''}ID / HC: ${id || '—'}  |  Sexo: ${sexo}  |  Edad: ${edad || '—'} años
Peso: ${peso || '—'} kg  |  Altura: ${altura || '—'} cm  |  SC: ${sc || '—'}

INDICACIÓN
${indicacion}${indLibre ? '\n' + indLibre : ''}

ANTECEDENTES CLÍNICOS
${ants.length > 0 ? ants.join(', ') : 'Sin antecedentes registrados'}

CALIDAD TÉCNICA
Ventana Acústica: ${ventana}  |  Contraste: ${contraste}

${protoTxt}

FUNCIÓN VENTRICULAR IZQUIERDA
FEy en Reposo: ${feviRep ? feviRep + '%' : '—'}  |  FEy Pico: ${feviPico ? feviPico + '%' : '—'}  |  FEy Recuperación: ${feviRecup ? feviRecup + '%' : '—'}
${deltaFevi ? 'Variación FEy: ' + deltaFevi : ''}

MOTILIDAD PARIETAL SEGMENTARIA — MODELO AHA 17 SEGMENTOS
${sep}
${wmLines || '  (No se registraron alteraciones segmentarias)\n'}
${sep}
  WMSI Reposo: ${wmsiRep}   |   WMSI Pico Estrés: ${wmsiEst}

${eeRep || eeEst ? `ESTRÉS DIASTÓLICO
E/e' Reposo: ${eeRep || '—'}   |   E/e' Estrés: ${eeEst || '—'}
Respuesta: ${diastResp}\n` : ''}
RESULTADO DEL ESTUDIO
${sep}
${resultado.toUpperCase()}
Territorio: ${territorio}${extension && extension !== '—' ? '\nExtensión de isquemia: ' + extension : ''}
${hals.length > 0 ? '\nHallazgos asociados:\n' + hals.map(h => '  • ' + h).join('\n') : ''}

${conclusion ? 'CONCLUSIÓN\n' + conclusion : ''}

${sep}
Fecha de realización: ${hoy}
Eco Estrés Cardíaco v1.0 — Calculadora Clínica
`;

    const out = document.getElementById('reporte-output');
    out.style.display = 'block';
    out.textContent = rep;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getResponseText(scRep, scEst) {
    if (scRep <= 1 && scEst <= 1) return 'Normal';
    if (scRep <= 1 && scEst > 1) return 'ISQUEMIA INDUCIBLE';
    if (scRep > 1 && scEst < scRep && scEst <= 1) return 'VIABILIDAD';
    if (scRep > 1 && scEst < scRep) return 'Mejoría (viabilidad probable)';
    if (scRep > 1 && scEst > scRep) return 'Isquemia sobre necrosis';
    if (scRep > 1 && scEst === scRep) return 'Necrosis / Cicatriz';
    return '—';
}

function v(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function copiarReporte() {
    const txt = document.getElementById('reporte-output').textContent;
    if (!txt) { alert('Primero genere el reporte.'); return; }
    navigator.clipboard.writeText(txt).then(() => alert('Reporte copiado al portapapeles.'));
}

function limpiarFormulario() {
    if (!confirm('¿Confirma iniciar un nuevo estudio? Se borrarán todos los datos.')) return;
    resetFormulario();
}

function resetFormulario() {
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
        el.value = '';
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    document.querySelectorAll('select').forEach(el => el.selectedIndex = 0);

    SEGMENTS.forEach(s => { WM.reposo[s.id] = 0; WM.estres[s.id] = 0; });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();

    document.getElementById('reporte-output').style.display = 'none';
    document.getElementById('resultado-banner').style.display = 'none';
    setProtocol('ejercicio');
}

// ── PRESETS ───────────────────────────────────
function setVal(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
        for (let i = 0; i < el.options.length; i++) {
            if (el.options[i].value === val) { el.selectedIndex = i; break; }
        }
    } else if (el.type === 'checkbox') {
        el.checked = !!val;
    } else {
        el.value = val;
    }
}

function setWM(scores) {
    // scores = { reposo: {segId: score, ...}, estres: {segId: score, ...} }
    if (scores.reposo) Object.entries(scores.reposo).forEach(([id, sc]) => { WM.reposo[parseInt(id)] = sc; });
    if (scores.estres) Object.entries(scores.estres).forEach(([id, sc]) => { WM.estres[parseInt(id)] = sc; });
    renderBullsEye('svg-reposo', 'reposo');
    renderBullsEye('svg-estres', 'estres');
    buildSegmentsTable();
    updateWMSI();
}

function allSegments(score) {
    const o = {};
    for (let i = 1; i <= 17; i++) o[i] = score;
    return o;
}

function applyPreset(name) {
    resetFormulario();

    const P = PRESETS[name];
    if (!P) return;

    // Datos del paciente
    if (P.edad) setVal('edad', P.edad);
    if (P.sexo) setVal('sexo', P.sexo);
    if (P.peso) { setVal('peso', P.peso); setVal('dob_peso', P.peso); setVal('dip_peso', P.peso); }
    if (P.altura) setVal('altura', P.altura);
    calcBSA();

    if (P.fc_reposo) setVal('fc_reposo', P.fc_reposo);
    if (P.ta_reposo) setVal('ta_reposo', P.ta_reposo);
    if (P.ventana) setVal('ventana', P.ventana);
    if (P.indicacion) setVal('indicacion', P.indicacion);

    // Antecedentes
    if (P.antecedentes) P.antecedentes.forEach(a => setVal('ant_' + a, true));

    // Protocolo
    if (P.protocolo) {
        setProtocol(P.protocolo);
        if (P.protocolo === 'ejercicio') {
            if (P.ej_modalidad) setVal('ej_modalidad', P.ej_modalidad);
            if (P.ej_etapa) setVal('ej_etapa', P.ej_etapa);
            if (P.ej_duracion) setVal('ej_duracion', P.ej_duracion);
            if (P.ej_mets) setVal('ej_mets', P.ej_mets);
            if (P.ej_fc_pico) setVal('ej_fc_pico', P.ej_fc_pico);
            if (P.ej_ta_pico) setVal('ej_ta_pico', P.ej_ta_pico);
            if (P.ej_motivo_fin) setVal('ej_motivo_fin', P.ej_motivo_fin);
            calcEjercicio();
        } else if (P.protocolo === 'dobutamina') {
            if (P.dob_dosis_max) setVal('dob_dosis_max', P.dob_dosis_max);
            if (P.dob_fc_pico) setVal('dob_fc_pico', P.dob_fc_pico);
            if (P.dob_atropina) setVal('dob_atropina', P.dob_atropina);
            if (P.dob_ta_pico) setVal('dob_ta_pico', P.dob_ta_pico);
            if (P.dob_motivo_fin) setVal('dob_motivo_fin', P.dob_motivo_fin);
            calcDobutamina();
        }
    }

    // FEy
    if (P.fevi_reposo) setVal('fevi_reposo', P.fevi_reposo);
    if (P.fevi_pico) setVal('fevi_pico', P.fevi_pico);
    if (P.fevi_recup) setVal('fevi_recup', P.fevi_recup);
    calcFEVI();

    // Wall motion
    if (P.wm) setWM(P.wm);

    // Estrés diastólico
    if (P.e_prima_rep) setVal('e_prima_rep', P.e_prima_rep);
    if (P.e_onda_rep) setVal('e_onda_rep', P.e_onda_rep);
    if (P.e_prima_est) setVal('e_prima_est', P.e_prima_est);
    if (P.e_onda_est) setVal('e_onda_est', P.e_onda_est);
    calcDiastolico();

    // Resultado
    if (P.resultado) setVal('resultado_estudio', P.resultado);
    if (P.territorio) setVal('territorio_afectado', P.territorio);
    if (P.extension) setVal('extension_isquemia', P.extension);
    if (P.hallazgos) P.hallazgos.forEach(h => setVal('hal_' + h, true));
    updateResultBanner();

    // MCH fields
    if (P.mch_grad_reposo) setVal('mch_grad_reposo', P.mch_grad_reposo);
    if (P.mch_grad_estres) setVal('mch_grad_estres', P.mch_grad_estres);
    if (P.mch_sam) setVal('mch_sam', P.mch_sam);
    if (P.mch_patologia) setVal('mch_patologia', P.mch_patologia);
    if (P.mch_grad_reposo) calcMCH();

    // EAo fields
    if (P.eao_grad_reposo) setVal('eao_grad_reposo', P.eao_grad_reposo);
    if (P.eao_ava_reposo) setVal('eao_ava_reposo', P.eao_ava_reposo);
    if (P.eao_grad_dob) setVal('eao_grad_dob', P.eao_grad_dob);
    if (P.eao_ava_dob) setVal('eao_ava_dob', P.eao_ava_dob);
    if (P.eao_reserva_flujo) setVal('eao_reserva_flujo', P.eao_reserva_flujo);
    if (P.eao_grad_reposo) calcEAo();

    onEdadChange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const PRESETS = {

    negativo_normal: {
        edad: 52, sexo: 'M', peso: 78, altura: 172, fc_reposo: 72, ta_reposo: '130/80',
        ventana: 'buena', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'dislipemia'],
        protocolo: 'ejercicio',
        ej_modalidad: 'treadmill_bruce', ej_etapa: 'III', ej_duracion: '9:12', ej_mets: '10.1',
        ej_fc_pico: '156', ej_ta_pico: '185/85', ej_motivo_fin: 'fc_maxima',
        fevi_reposo: 62, fevi_pico: 68, fevi_recup: 64,
        e_prima_rep: '9', e_onda_rep: '72', e_prima_est: '12', e_onda_est: '95',
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        resultado: 'negativo', territorio: 'ninguno'
    },

    negativo_submax: {
        edad: 68, sexo: 'F', peso: 65, altura: 158, fc_reposo: 64, ta_reposo: '145/88',
        ventana: 'regular', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'dm', 'betabloq'],
        protocolo: 'ejercicio',
        ej_modalidad: 'treadmill_bruce_mod', ej_etapa: 'II', ej_duracion: '5:40', ej_mets: '5.2',
        ej_fc_pico: '108', ej_ta_pico: '170/92', ej_motivo_fin: 'agotamiento',
        fevi_reposo: 58, fevi_pico: 62,
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        resultado: 'no_concluyente', territorio: 'ninguno'
    },

    isquemia_da: {
        edad: 58, sexo: 'M', peso: 82, altura: 175, fc_reposo: 68, ta_reposo: '138/82',
        ventana: 'buena', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'tabaquismo', 'dislipemia'],
        protocolo: 'ejercicio',
        ej_modalidad: 'treadmill_bruce', ej_etapa: 'II', ej_duracion: '6:30', ej_mets: '7.0',
        ej_fc_pico: '148', ej_ta_pico: '178/88', ej_motivo_fin: 'isquemia',
        fevi_reposo: 58, fevi_pico: 52,
        wm: {
            reposo: allSegments(1),
            estres: { ...allSegments(1), 1:3, 2:3, 7:3, 8:2, 13:3, 14:2, 17:2 }
        },
        resultado: 'positivo', territorio: 'da', extension: 'extensa',
        hallazgos: ['angina', 'st_dep']
    },

    isquemia_cd: {
        edad: 63, sexo: 'M', peso: 88, altura: 170, fc_reposo: 74, ta_reposo: '142/86',
        ventana: 'buena', indicacion: 'diagnostico_isquemia',
        antecedentes: ['hta', 'dm', 'isquemia'],
        protocolo: 'dobutamina',
        dob_dosis_max: '40', dob_fc_pico: '142', dob_atropina: '0.5',
        dob_ta_pico: '168/92', dob_motivo_fin: 'isquemia',
        fevi_reposo: 56, fevi_pico: 50,
        wm: {
            reposo: allSegments(1),
            estres: { ...allSegments(1), 3:2, 4:3, 9:2, 10:3, 15:2 }
        },
        resultado: 'positivo', territorio: 'cd', extension: 'moderada',
        hallazgos: ['st_dep']
    },

    isquemia_multi: {
        edad: 66, sexo: 'M', peso: 90, altura: 168, fc_reposo: 76, ta_reposo: '150/92',
        ventana: 'regular', indicacion: 'estratificacion_riesgo',
        antecedentes: ['hta', 'dm', 'tabaquismo', 'dislipemia', 'isquemia'],
        protocolo: 'dobutamina',
        dob_dosis_max: '30', dob_fc_pico: '136', dob_atropina: '1.0',
        dob_ta_pico: '148/88', dob_motivo_fin: 'isquemia',
        fevi_reposo: 50, fevi_pico: 42,
        wm: {
            reposo: { ...allSegments(1), 4:2, 10:2 },
            estres: { ...allSegments(1), 1:3, 2:2, 4:3, 7:2, 8:2, 10:3, 13:2, 15:2, 17:2 }
        },
        resultado: 'positivo', territorio: 'da_cd', extension: 'extensa',
        hallazgos: ['angina', 'st_dep', 'hipotension']
    },

    viabilidad_bifasica: {
        edad: 60, sexo: 'M', peso: 75, altura: 170, fc_reposo: 80, ta_reposo: '118/72',
        ventana: 'buena', indicacion: 'viabilidad',
        antecedentes: ['isquemia', 'iam', 'crm'],
        protocolo: 'dobutamina',
        dob_dosis_max: '40', dob_fc_pico: '130', dob_atropina: 'no',
        dob_ta_pico: '138/78', dob_motivo_fin: 'fc_target',
        fevi_reposo: 35, fevi_pico: 42, fevi_recup: 38,
        wm: {
            reposo: { ...allSegments(1), 1:4, 2:4, 7:3, 8:3, 13:3, 14:3, 17:3 },
            estres: { ...allSegments(1), 1:2, 2:2, 7:3, 8:3, 13:2, 14:2, 17:2 }
        },
        resultado: 'viabilidad_positiva', territorio: 'da', extension: 'extensa'
    },

    cicatriz: {
        edad: 65, sexo: 'M', peso: 80, altura: 172, fc_reposo: 78, ta_reposo: '122/76',
        ventana: 'buena', indicacion: 'viabilidad',
        antecedentes: ['isquemia', 'iam'],
        protocolo: 'dobutamina',
        dob_dosis_max: '40', dob_fc_pico: '135', dob_atropina: '0.5',
        dob_ta_pico: '142/80', dob_motivo_fin: 'fc_target',
        fevi_reposo: 32, fevi_pico: 34, fevi_recup: 32,
        wm: {
            reposo: { ...allSegments(1), 1:4, 2:4, 7:4, 8:4, 13:4, 14:4, 17:4 },
            estres: { ...allSegments(1), 1:4, 2:4, 7:4, 8:4, 13:4, 14:4, 17:4 }
        },
        resultado: 'viabilidad_negativa', territorio: 'da', extension: 'extensa'
    },

    diastolico_pos: {
        edad: 55, sexo: 'F', peso: 68, altura: 160, fc_reposo: 70, ta_reposo: '140/88',
        ventana: 'buena', indicacion: 'diastolico',
        antecedentes: ['hta'],
        protocolo: 'ejercicio',
        ej_modalidad: 'bicicleta_supina', ej_etapa: 'II', ej_duracion: '7:00', ej_mets: '6.5',
        ej_fc_pico: '145', ej_ta_pico: '195/95', ej_motivo_fin: 'sintomas',
        fevi_reposo: 60, fevi_pico: 65,
        e_prima_rep: '7', e_onda_rep: '65', e_prima_est: '6', e_onda_est: '110',
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        resultado: 'diastolico_positivo', territorio: 'ninguno',
        hallazgos: ['disnea', 'hipertensiva']
    },

    mch_latente: {
        edad: 42, sexo: 'M', peso: 75, altura: 176, fc_reposo: 62, ta_reposo: '120/78',
        ventana: 'buena', indicacion: 'mch',
        protocolo: 'ejercicio',
        ej_modalidad: 'treadmill_bruce', ej_etapa: 'III', ej_duracion: '8:45', ej_mets: '9.5',
        ej_fc_pico: '162', ej_ta_pico: '165/80', ej_motivo_fin: 'sintomas',
        fevi_reposo: 68, fevi_pico: 75,
        wm: { reposo: allSegments(1), estres: allSegments(1) },
        mch_grad_reposo: '18', mch_grad_estres: '72', mch_sam: 'inducido', mch_patologia: 'mch',
        resultado: 'positivo', territorio: 'ninguno',
        hallazgos: ['disnea']
    },

    eao_bajo_flujo: {
        edad: 72, sexo: 'M', peso: 70, altura: 166, fc_reposo: 82, ta_reposo: '110/68',
        ventana: 'regular', indicacion: 'estenosis_ao',
        antecedentes: ['hta', 'isquemia', 'valv'],
        protocolo: 'dobutamina',
        dob_dosis_max: '20', dob_fc_pico: '100', dob_atropina: 'no',
        dob_ta_pico: '125/72', dob_motivo_fin: 'criterio_medico',
        fevi_reposo: 30, fevi_pico: 38,
        wm: {
            reposo: { ...allSegments(2), 5:1, 6:1, 11:1, 12:1, 16:1 },
            estres: { ...allSegments(1), 1:2, 7:2 }
        },
        eao_grad_reposo: '22', eao_ava_reposo: '0.75',
        eao_grad_dob: '45', eao_ava_dob: '0.82', eao_reserva_flujo: 'presente',
        resultado: 'positivo', territorio: 'ninguno'
    }
};

