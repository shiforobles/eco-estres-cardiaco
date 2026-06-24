/* ================================================
   Perlas Clínicas — Curso SIAC 20 Clases
   Eco Estrés Cardíaco
   ================================================ */

const PEARLS_DATA = {

    ejercicio: {
        professor: 'Dr. Gabriel Scattini',
        course: 'Eco Estrés-Ejercicio',
        pearls: [
            { icon: '🔑', text: '<strong>Post-treadmill:</strong> adquirir las 4 vistas en ≤60-90 segundos — la isquemia se resuelve rápidamente tras cesar el ejercicio.' },
            { icon: '💡', text: '<strong>Bicicleta supina</strong> permite imagen DURANTE el esfuerzo → mayor sensibilidad que treadmill para detectar isquemia.' },
            { icon: '⚠️', text: 'Un estudio "negativo" con <strong>FC &lt;85% de la máxima predicha</strong> es NO CONCLUYENTE, no negativo.' },
            { icon: '🔑', text: 'La <strong>respuesta hipotensora</strong> (caída >10 mmHg de sistólica) durante ejercicio sugiere isquemia extensa o disfunción VI severa.' },
            { icon: '💡', text: 'Capacidad funcional <strong>&lt;5 METs</strong> es factor pronóstico independiente de mortalidad, aun sin isquemia.' },
            { icon: '💡', text: 'El <strong>doble producto</strong> (FC × TAS) >25.000 indica adecuada carga hemodinámica al miocardio.' },
            { icon: '⚠️', text: 'La isquemia que aparece a <strong>baja carga</strong> (etapa I-II Bruce, &lt;6 METs) implica peor pronóstico que la de alta carga.' }
        ]
    },

    dobutamina: {
        professor: 'Dr. Martín Munín',
        course: 'Eco-Estrés Dobutamina',
        pearls: [
            { icon: '🔑', text: '<strong>Protocolo 3-3-3:</strong> cada etapa dura 3 minutos. Escalonamiento: 5 → 10 → 20 → 30 → 40 mcg/kg/min.' },
            { icon: '💡', text: 'A <strong>dosis baja</strong> (5-10): efecto inotrópico > cronotrópico → útil para evaluar viabilidad.' },
            { icon: '💡', text: 'A <strong>dosis alta</strong> (30-40): predomina cronotropismo → taquicardia → isquemia por aumento de demanda.' },
            { icon: '🔑', text: 'La <strong>respuesta bifásica</strong> (mejora a baja dosis + deterioro a alta dosis) es el MEJOR predictor de recuperación funcional post-revascularización.' },
            { icon: '⚠️', text: '<strong>NUNCA</strong> administrar atropina sin haber alcanzado al menos 20 mcg/kg/min de dobutamina primero.' },
            { icon: '⚠️', text: 'Antídoto: <strong>metoprolol 1-5 mg EV</strong> o esmolol. Tener SIEMPRE preparado antes de iniciar el protocolo.' },
            { icon: '💡', text: 'Complicación seria más frecuente: TV/FV (&lt;1:1000). Efecto adverso más común: palpitaciones y náuseas.' }
        ]
    },

    dipiridamol: {
        professor: 'Dr. Jorge Lowenstein',
        course: 'Eco-Estrés Dipiridamol',
        pearls: [
            { icon: '🔑', text: '<strong>Mecanismo:</strong> inhibe recaptación de adenosina → vasodilatación arteriolar → "robo coronario" de territorios enfermos.' },
            { icon: '💡', text: 'La isquemia NO es por aumento de demanda (como ejercicio/dobutamina) sino por <strong>redistribución de flujo</strong>.' },
            { icon: '💡', text: 'No produce taquicardia significativa → ideal cuando la FC no puede aumentar (betabloqueantes, limitación física).' },
            { icon: '⚠️', text: '<strong>CONTRAINDICACIÓN ABSOLUTA:</strong> asma / EPOC activo (riesgo de broncoespasmo severo por adenosina).' },
            { icon: '⚠️', text: 'Suspender <strong>cafeína y teofilina 24h antes</strong> — bloquean receptores de adenosina y anulan el efecto del estudio.' },
            { icon: '🔑', text: '<strong>Protocolo alto</strong> (0.84 mg/kg): mayor sensibilidad. Se agrega fase 2 de 0.28 mg/kg si no hay isquemia con dosis estándar.' },
            { icon: '💡', text: 'Aminofilina 125-250 mg EV revierte el efecto en 30-60 seg. Tener siempre cargada. La hipotensión leve es esperable.' }
        ]
    },

    noconvencional: {
        professor: 'Dr. Salvador Spina',
        course: 'Apremios No Convencionales',
        pearls: [
            { icon: '🔑', text: '<strong>Pacing transesofágico:</strong> alternativa cuando ejercicio y fármacos están contraindicados. Permite control preciso de la FC.' },
            { icon: '💡', text: '<strong>Adenosina/Regadenoson:</strong> vasodilatadores directos. Regadenoson tiene vida media más corta y mejor tolerancia.' },
            { icon: '⚠️', text: 'En <strong>BCRI:</strong> usar vasodilatadores (dipiridamol/adenosina), NO dobutamina ni ejercicio → generan falsos positivos septales.' },
            { icon: '💡', text: '<strong>Handgrip:</strong> ejercicio isométrico que aumenta postcarga. Útil para desenmascarar IM dinámica o gradiente TSVI en MCH.' },
            { icon: '💡', text: '<strong>Nitroglicerina baja dosis:</strong> puede usarse como test de viabilidad alternativo en pacientes que no toleran dobutamina.' }
        ]
    },

    motilidad: {
        professor: 'Prof. Dr. Daniel Piñeiro',
        course: 'Fisiopatología del Eco Estrés (Clases 1 y 2)',
        pearls: [
            { icon: '🔑', text: '<strong>Cascada isquémica:</strong> disfunción diastólica → alteración motilidad → cambios ECG → angina. El eco estrés detecta el 2° escalón, ANTES del ECG.' },
            { icon: '💡', text: 'La sensibilidad del eco estrés <strong>supera al ECG de esfuerzo</strong> porque detecta isquemia más precozmente en la cascada.' },
            { icon: '💡', text: 'El territorio de la <strong>DA compromete ~40-50%</strong> del miocardio VI — por eso la isquemia de DA tiene peor pronóstico.' },
            { icon: '🔑', text: 'Un segmento puede tener alteración de motilidad sin cambios ECG — esto es <strong>isquemia "silente"</strong>.' },
            { icon: '⚠️', text: 'Diferencia entre <strong>hipoquinesia y aquinesia</strong>: la aquinesia sugiere mayor extensión transmural de la isquemia/necrosis.' },
            { icon: '💡', text: 'La <strong>respuesta normal al estrés</strong> es hipercinesia generalizada. Si un segmento no "mejora" mientras otros sí → sospecha de isquemia relativa.' }
        ]
    },

    interpretacion: {
        professor: 'Dra. Kudrle / Dr. Shehadeh / Dra. Fernández',
        course: 'Ejercicios de Interpretación I y II',
        pearls: [
            { icon: '🔑', text: '<strong>Comparar siempre</strong> basal vs. pico en el mismo plano. Nunca comparar vistas diferentes entre sí.' },
            { icon: '💡', text: 'El <strong>engrosamiento parietal</strong> es más confiable que el movimiento endocárdico para evaluar motilidad segmentaria.' },
            { icon: '⚠️', text: 'Cuidado con el <strong>movimiento de traslación</strong> ("tethering"): un segmento puede moverse pasivamente arrastrado por segmentos vecinos normales.' },
            { icon: '🔑', text: '<strong>Isquemia inducible:</strong> segmento normal en reposo que se deteriora con estrés. Es la respuesta más importante a detectar.' },
            { icon: '💡', text: '<strong>Viabilidad:</strong> segmento aquinético en reposo que mejora a baja dosis. Indica miocardio hibernado recuperable.' },
            { icon: '⚠️', text: 'La isquemia de <strong>aparición precoz</strong> (baja dosis de dobutamina o baja carga de ejercicio) implica enfermedad más severa.' }
        ]
    },

    diastolico: {
        professor: 'Dr. Pablo Merlo',
        course: 'Eco Estrés Diastólico',
        pearls: [
            { icon: '🔑', text: '<strong>Indicación principal:</strong> disnea de esfuerzo inexplicada con FEy preservada y eco basal normal o indeterminado.' },
            { icon: '🔑', text: '<strong>Criterio positivo (ASE 2016):</strong> E/e\' >14 + velocidad IT >2.8 m/s (PSAP >50 mmHg) con esfuerzo.' },
            { icon: '💡', text: 'En sujetos normales, <strong>e\' AUMENTA</strong> con ejercicio. En disfunción diastólica, e\' NO aumenta o disminuye.' },
            { icon: '⚠️', text: 'Medir E/e\' <strong>inmediatamente post-ejercicio</strong> (&lt;60-90 seg): la onda E persiste elevada pero e\' cae rápidamente.' },
            { icon: '⚠️', text: 'La <strong>fusión E-A</strong> a FC altas dificulta la medición → preferir recuperación inmediata con FC ~100-110 lpm.' },
            { icon: '💡', text: 'Si e\' septal no mejora a <strong>>7 cm/s con ejercicio</strong>, sugiere disfunción diastólica inducible.' },
            { icon: '🔑', text: 'Correlación directa con <strong>IC con FEy preservada (HFpEF)</strong> — el eco estrés diastólico es clave para este diagnóstico.' }
        ]
    },

    errores: {
        professor: 'Dr. Miguel Bustamante Labarta',
        course: 'Errores en Eco Estrés',
        pearls: [
            { icon: '❌', text: '<strong>Error #1:</strong> No alcanzar FC target y reportar como "negativo". Es NO CONCLUYENTE.' },
            { icon: '❌', text: '<strong>Error #2:</strong> Confundir movimiento de traslación con anomalía segmentaria real.' },
            { icon: '❌', text: '<strong>Error #3:</strong> No considerar el contexto clínico al interpretar (probabilidad pre-test).' },
            { icon: '❌', text: '<strong>Error #4:</strong> Malinterpretar septum en BCRI como isquemia — el septum paradojal es eléctrico, no isquémico.' },
            { icon: '❌', text: '<strong>Error #5:</strong> No adquirir todas las vistas a tiempo post-ejercicio (&gt;90 seg = se pierde isquemia).' },
            { icon: '⚠️', text: '<strong>Error #6:</strong> Reportar "isquemia" sin especificar territorio, extensión ni momento de aparición (precoz vs. tardío).' },
            { icon: '✅', text: '<strong>Buena práctica:</strong> siempre reportar FC alcanzada, % de FC máxima, y si el estudio fue adecuado o no.' }
        ]
    },

    viabilidad: {
        professor: 'Dr. Jorge Lax',
        course: 'Viabilidad Miocárdica',
        pearls: [
            { icon: '🔑', text: 'Dobutamina a <strong>dosis BAJA</strong> (2.5-5-10 mcg/kg/min) para viabilidad. NO es necesario llegar a dosis altas.' },
            { icon: '🔑', text: '<strong>Respuesta bifásica</strong> = MEJOR predictor: mejora a baja dosis → deterioro a alta dosis = miocardio hibernado + isquemia.' },
            { icon: '💡', text: '<strong>Mejora sostenida</strong> (sin deterioro posterior) = hibernación SIN isquemia significativa residual.' },
            { icon: '💡', text: 'Sin cambio o empeoramiento = <strong>necrosis / cicatriz transmural</strong> → no se beneficia de revascularización.' },
            { icon: '⚠️', text: 'Grosor parietal telediastólico <strong>&lt;6 mm = cicatriz</strong> transmural casi segura → no esperar recuperación.' },
            { icon: '🔑', text: 'Se necesitan <strong>≥4 segmentos viables</strong> para que la revascularización mejore la función global del VI.' }
        ]
    },

    estenosis_ao: {
        professor: 'Dr. Salvador Spina / Dra. Rosina Arbucci',
        course: 'Estrés en Estenosis Aórtica',
        pearls: [
            { icon: '🔑', text: 'Solo con <strong>dobutamina baja dosis</strong> (5-20 mcg/kg/min). NO superar 20 mcg — riesgo en EAo severa.' },
            { icon: '🔑', text: '<strong>EAo verdadera:</strong> gradiente ↑ ≥40 mmHg, AVA no cambia (&lt;1 cm²). El gradiente "desenmascara" la severidad.' },
            { icon: '💡', text: '<strong>Pseudoestenosis:</strong> AVA ↑ >1 cm², gradiente no alcanza 40 mmHg. Las valvas en realidad abren más con mayor flujo.' },
            { icon: '⚠️', text: 'Sin <strong>reserva de flujo</strong> (VTI TSVI no ↑ >20%): mal pronóstico independientemente de si es verdadera o pseudo.' },
            { icon: '💡', text: 'La <strong>reserva contráctil</strong> (aumento del volumen sistólico >20%) es el mejor predictor de supervivencia post-CVM.' },
            { icon: '⚠️', text: 'Indicación estricta: EAo con <strong>bajo flujo/bajo gradiente</strong> (GM &lt;40, AVA &lt;1.0, FEy &lt;50%). No usar en EAo severa clásica.' }
        ]
    },

    cfr: {
        professor: 'Dr. Jorge Lowenstein',
        course: 'Reserva Coronaria (Clases 1 y 2)',
        pearls: [
            { icon: '🔑', text: '<strong>CFR = velocidad diastólica pico / basal</strong> en DA distal con Doppler pulsado. Técnica no invasiva para evaluar microcirculación.' },
            { icon: '💡', text: '<strong>CFR ≥2.0 = normal.</strong> CFR 1.5-1.99 = limítrofe. CFR &lt;1.5 = reducida (estenosis epicárdica o disfunción microvascular).' },
            { icon: '⚠️', text: 'Limitación: habitualmente solo evalúa <strong>territorio DA</strong>. No descarta enfermedad en CD o Cx.' },
            { icon: '💡', text: '<strong>Ángulo de insonación &lt;20°</strong> con el flujo coronario para mediciones confiables.' },
            { icon: '🔑', text: 'CFR reducida con <strong>coronarias normales</strong> en cinecoronariografía = disfunción microvascular (angina microvascular).' },
            { icon: '💡', text: 'Usar con <strong>vasodilatadores</strong> (adenosina/dipiridamol) para provocar hiperemia máxima.' }
        ]
    },

    strain: {
        professor: 'Dra. Rosina Arbucci',
        course: 'Strain y Estrés en Diferentes Escenarios',
        pearls: [
            { icon: '🔑', text: '<strong>GLS basal ≤ −20% = normal.</strong> Valores menos negativos (ej: −15%) indican disfunción subclínica.' },
            { icon: '🔑', text: '<strong>Reserva de strain: ΔGLS ≥2%</strong> (aumento del valor absoluto) = contractilidad preservada.' },
            { icon: '💡', text: 'El strain detecta isquemia <strong>más precozmente</strong> que el análisis visual de motilidad segmentaria.' },
            { icon: '💡', text: 'Especialmente útil en: <strong>MCH, cardiotoxicidad por quimioterapia, isquemia sutil</strong> difícil de ver visualmente.' },
            { icon: '⚠️', text: 'El <strong>deterioro del GLS</strong> con estrés (valor menos negativo que en reposo) sugiere isquemia inducible o disfunción contráctil.' },
            { icon: '💡', text: 'El <strong>bull\'s eye de strain</strong> permite visualizar la distribución territorial de la disfunción.' }
        ]
    },

    mch: {
        professor: 'Dr. Rodrigo Ibáñez / Dr. Miguel Amor',
        course: 'MCH / Chagas',
        pearls: [
            { icon: '🔑', text: '<strong>MCH:</strong> buscar obstrucción latente — gradiente TSVI >30 mmHg con estrés que no estaba en reposo.' },
            { icon: '💡', text: '<strong>SAM inducible</strong> con estrés = obstrucción dinámica. Puede explicar síncope o disnea de esfuerzo.' },
            { icon: '⚠️', text: 'Gradiente TSVI <strong>>50 mmHg con estrés</strong> se asocia a mayor riesgo de muerte súbita en MCH.' },
            { icon: '🔑', text: '<strong>Chagas:</strong> alteraciones típicas en segmentos apicales e inferiores (aneurisma apical clásico).' },
            { icon: '💡', text: 'En Chagas: evaluar <strong>reserva contráctil e isquemia</strong> — la enfermedad afecta microcirculación además de producir fibrosis.' },
            { icon: '💡', text: 'Usar <strong>ejercicio o dobutamina</strong> en MCH (NO dipiridamol — no evalúa obstrucción dinámica adecuadamente).' }
        ]
    },

    contraste: {
        professor: 'Dr. Guillermo Rodríguez',
        course: 'Uso de Contraste en Eco Estrés',
        pearls: [
            { icon: '🔑', text: '<strong>Indicación:</strong> mala ventana acústica con ≥2 segmentos no visualizados adecuadamente.' },
            { icon: '💡', text: 'Mejora significativamente la <strong>definición de bordes endocárdicos</strong>, especialmente en segmentos apicales.' },
            { icon: '💡', text: 'Aumenta la <strong>concordancia inter-observador</strong> y la confianza diagnóstica del estudio.' },
            { icon: '⚠️', text: '<strong>No usar</strong> en shunts derecha-izquierda conocidos ni en hipertensión pulmonar severa.' },
            { icon: '💡', text: 'El contraste convierte un estudio "no concluyente" por mala ventana en un estudio <strong>diagnóstico</strong>.' }
        ]
    },

    especiales: {
        professor: 'Dr. Ariel Saad',
        course: 'Estrés en Situaciones Especiales (Clases 1 y 2)',
        pearls: [
            { icon: '💡', text: '<strong>Mujeres:</strong> menor especificidad del eco estrés. Mayor tasa de falsos positivos vs. hombres.' },
            { icon: '⚠️', text: '<strong>Ancianos:</strong> limitar FC target. Mayor riesgo de complicaciones. Preferir protocolos modificados.' },
            { icon: '🔑', text: '<strong>Post-transplante:</strong> corazón denervado — usar dobutamina (no responde a ejercicio como test de isquemia).' },
            { icon: '🔑', text: '<strong>BCRI:</strong> usar vasodilatadores (dipiridamol/adenosina). Ejercicio y dobutamina generan falsos positivos septales.' },
            { icon: '💡', text: '<strong>Insuficiencia renal:</strong> mayor prevalencia de enfermedad coronaria. El eco estrés es preferible a pruebas con contraste iodado.' },
            { icon: '💡', text: '<strong>Preoperatorio no cardíaco:</strong> eco estrés indicado si riesgo quirúrgico intermedio-alto y capacidad funcional &lt;4 METs.' }
        ]
    },

    coronarias_normales: {
        professor: 'Dr. Jorge Lowenstein',
        course: 'Estrés en Coronarias Normales',
        pearls: [
            { icon: '🔑', text: '<strong>Angina microvascular:</strong> coronarias epicárdicas normales + eco estrés positivo para isquemia.' },
            { icon: '💡', text: '<strong>CFR reducida</strong> con coronarias normales = disfunción microvascular confirmada.' },
            { icon: '💡', text: '<strong>Síndrome X cardíaco:</strong> angina + ECG positivo + coronarias normales. El eco estrés ayuda a evaluar repercusión.' },
            { icon: '⚠️', text: 'Considerar <strong>espasmo coronario</strong> si isquemia transitoria sin enfermedad epicárdica — puede requerir test de provocación.' },
            { icon: '💡', text: 'La disfunción microvascular tiene <strong>implicancia pronóstica</strong> — no es benigna. Requiere tratamiento.' }
        ]
    },

    dolor_mcd: {
        professor: 'Dra. Jessica Gantesti / Dr. Michael Salamé',
        course: 'Eco Estrés en Unidad de Dolor / MCD',
        pearls: [
            { icon: '🔑', text: '<strong>Unidad de Dolor:</strong> eco estrés precoz (>6h post-dolor) es seguro y tiene alto valor predictivo negativo.' },
            { icon: '💡', text: 'Un eco estrés <strong>negativo</strong> en unidad de dolor permite el <strong>alta segura</strong> del paciente.' },
            { icon: '🔑', text: '<strong>MCD:</strong> el eco estrés diferencia etiología isquémica (territorial) vs. no isquémica (difusa).' },
            { icon: '💡', text: 'La <strong>reserva contráctil</strong> en MCD (mejora FEy con dobutamina) predice respuesta al tratamiento médico óptimo.' },
            { icon: '⚠️', text: 'En MCD con <strong>FEy muy deprimida (&lt;25%)</strong>: mayor riesgo de arritmias con dobutamina — monitoreo estricto.' }
        ]
    }
};

// ── PEARL RENDERING ─────────────────────────────

function togglePearl(key) {
    const panel = document.getElementById('pearl-panel-' + key);
    const btn = document.getElementById('pearl-btn-' + key);
    if (!panel || !btn) return;

    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    btn.classList.toggle('open', !isVisible);
}

function renderPearlPanel(key) {
    const data = PEARLS_DATA[key];
    if (!data) return '';

    const items = data.pearls.map(p =>
        `<li data-icon="${p.icon}">${p.text}</li>`
    ).join('');

    return `<button class="pearl-btn" id="pearl-btn-${key}" onclick="togglePearl('${key}')">
        💡 Perlas Clínicas — ${data.professor}
    </button>
    <div id="pearl-panel-${key}" class="pearl-panel" style="display:none">
        <div class="pearl-header">
            <span class="pearl-professor">📚 ${data.professor}</span>
            <span class="pearl-course">${data.course}</span>
        </div>
        <ul class="pearl-list">${items}</ul>
    </div>`;
}

function initPearls() {
    document.querySelectorAll('.pearl-container').forEach(el => {
        const key = el.dataset.pearl;
        if (key) el.innerHTML = renderPearlPanel(key);
    });
}

document.addEventListener('DOMContentLoaded', initPearls);
