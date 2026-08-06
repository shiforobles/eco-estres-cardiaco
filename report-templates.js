/* ================================================
   Plantillas narrativas — Eco estrés con ejercicio
   Cicloergómetro · protocolo post-esfuerzo
   ================================================

   Este archivo es SÓLO texto. Para cambiar cómo se redacta un informe,
   se edita acá y no hace falta tocar app.js.

   Los marcadores {{...}} los completa app.js. Un marcador que quede vacío
   hace desaparecer la frase que lo contiene entre {{#si:...}}...{{/si}}.
   ================================================ */

const NARRATIVA = {

    // ── MÉTODO ────────────────────────────────────────────────────────
    metodo: 'Se realizó ecocardiograma con ejercicio en cicloergómetro con carga escalonada por discos{{carga}}, ' +
            'alcanzando {{fcPico}} lpm ({{pctFCmax}} % de la FC máxima predicha) y un doble producto de {{dobleProducto}}, ' +
            'deteniéndose la prueba por {{causaDetencion}}.',

    // Frase de respuestas hemodinámicas: una sola de estas, según el caso
    respuestaNormal:      'La respuesta tensional fue normotensiva y la respuesta cronotrópica adecuada.',
    respuestaHipertensiva:'Durante el esfuerzo presentó respuesta hipertensiva, con TA pico de {{taPico}} mmHg partiendo de {{taBasal}} mmHg basal.',
    respuestaHipotensiva: 'Durante el esfuerzo presentó descenso tensional, de {{taBasal}} mmHg basales a {{taPico}} mmHg en el pico, motivo por el cual se detuvo la prueba.',
    respuestaFCSubóptima: 'Alcanzó {{fcPico}} lpm, correspondiente al {{pctFCmax}} % de la FC máxima predicha, sin lograr el objetivo del 85 %{{betabloqueante}}.',

    // ── CALIDAD ───────────────────────────────────────────────────────
    calidad:          'La ventana acústica fue {{ventana}}. Las imágenes post-esfuerzo se adquirieron a los {{segImagen}} segundos ' +
                      'del fin del ejercicio, con una FC de {{fcImagen}} lpm ({{pctFCadq}} % de la FC pico){{coletillaAdq}}.',
    coletillaAdqUtil: ', dentro de la ventana útil para la detección de isquemia',
    coletillaAdqTardia: ', por debajo del rango óptimo para la detección de isquemia',
    calidadLimitada:  'La ventana acústica fue limitada, con adecuada visualización de solo {{segEvaluados}} de los 17 segmentos. ' +
                      'Las imágenes post-esfuerzo se adquirieron a los {{segImagen}} segundos, con FC de {{fcImagen}} lpm ' +
                      '({{pctFCadq}} % de la FC pico){{coletillaAdq}}.',

    // ── REPOSO ────────────────────────────────────────────────────────
    reposoNormalLargo: 'En reposo no se observaron alteraciones de la motilidad parietal, con función sistólica del ventrículo izquierdo ' +
                       'conservada (FEy {{fey}} %) y relación E/e\' de {{ee}}, sin datos de aumento de las presiones de llenado.',
    reposoNormalCorto: 'En reposo la motilidad parietal fue normal, con FEy {{fey}} % y relación E/e\' de {{ee}}.',
    reposoSecuela:     'En reposo se observó {{gradoSecuela}} {{deSegmentosSecuela}} ({{territorioSecuelaFrase}}), ' +
                       'en relación con evento previo, con FEy {{fey}} % y relación E/e\' de {{ee}}.',
    reposoDiastolico:  'En reposo la motilidad parietal fue normal, con FEy {{fey}} % conservada, relación E/e\' de {{ee}} y VRT de {{vrt}} m/s, ' +
                       'sin datos concluyentes de aumento de las presiones de llenado.',

    // ── ESFUERZO ──────────────────────────────────────────────────────
    esfuerzoNegativo:  'Con el esfuerzo se objetivó adecuada respuesta hiperdinámica global, sin nuevas alteraciones de la motilidad parietal ' +
                       'en ninguno de los territorios evaluados. No presentó cambios del ST-T ni arritmias hasta el doble producto alcanzado, ' +
                       'ni refirió dolor precordial o equivalentes anginosos.',

    esfuerzoPositivoUnico: 'Con el esfuerzo se objetivó nueva {{grado}} {{deSegmentos}}, con caída del engrosamiento sistólico ' +
                       'respecto del reposo, en {{territorioFrase}}. El WMSI{{aclaracionWMSI}} ascendió de {{wmsiReposo}} en reposo a ' +
                       '{{wmsiEstres}} post-esfuerzo.' +
                       '{{acompanamiento}} El resto de los segmentos mostró adecuada respuesta hiperdinámica.',

    esfuerzoPositivoMulti: 'Con el esfuerzo se objetivaron nuevas alteraciones de la motilidad en los segmentos {{segmentos}}, con compromiso ' +
                       'de más de un territorio coronario ({{territorios}}). El WMSI{{aclaracionWMSI}} ascendió de {{wmsiReposo}} a ' +
                       '{{wmsiEstres}}{{caidaFey}}.' +
                       '{{acompanamiento}} El hallazgo de isquemia extensa y multiterritorial constituye un marcador de alto riesgo.',

    esfuerzoSecuela:   'Con el esfuerzo los segmentos comprometidos no modificaron su motilidad, sin evidencia de reserva contráctil en dicho ' +
                       'territorio. El resto de los segmentos mostró adecuada respuesta hiperdinámica, sin nuevas alteraciones. ' +
                       'No presentó cambios del ST-T ni angina.',

    esfuerzoHipertensiva: 'No se observaron nuevas alteraciones de la motilidad parietal, con adecuada respuesta hiperdinámica global, ' +
                       'sin cambios del ST-T ni angina.',

    esfuerzoFCSuboptima: 'No se observaron nuevas alteraciones de la motilidad parietal ni cambios del ST-T al doble producto alcanzado.',

    esfuerzoNoConcluyente: 'En los segmentos evaluables no se observaron nuevas alteraciones de la motilidad parietal.',

    esfuerzoDiastolico: 'Con el esfuerzo no se observaron nuevas alteraciones de la motilidad parietal. La relación E/e\' promedio ascendió a ' +
                       '{{eeEstres}}, con VRT de {{vrtEstres}} m/s, sin el incremento esperado de e\', hallazgos compatibles con aumento de las ' +
                       'presiones de llenado del ventrículo izquierdo inducido por el ejercicio.',

    esfuerzoHipotensiva: 'Con el esfuerzo se objetivaron {{hallazgos}}, con caída de la FEy de {{feyReposo}} % a {{feyEstres}} %.',

    // ── TRASTORNO DE CONDUCCIÓN ───────────────────────────────────────
    // En BCRI, marcapasos o preexcitación el septum se mueve mal por activación
    // eléctrica anómala, no por isquemia ni necrosis: no se atribuye a un vaso.
    reposoConduccion: 'En reposo se observó {{hallazgoSeptal}}, con asincronía de los segmentos {{segmentosSeptales}}, ' +
                       'atribuible {{alTrastorno}} y no a secuela isquémica. El resto de los segmentos presentó motilidad ' +
                       'conservada, con FEy {{fey}} % y relación E/e\' de {{ee}}.',

    // Cuando además hay secuela real en otro territorio, esta frase se suma al párrafo de reposo
    asincroniaSeptalSuelta: 'Se observó además {{hallazgoSeptal}}, con asincronía de los segmentos {{segmentosSeptales}}, ' +
                       'atribuible {{alTrastorno}} y no a secuela isquémica.',

    esfuerzoConduccion: 'Con el esfuerzo los segmentos no septales mostraron adecuada respuesta hiperdinámica, sin nuevas ' +
                       'alteraciones de la motilidad. La evaluación de los segmentos septales se encuentra limitada por el ' +
                       'trastorno de conducción, que genera alteraciones del movimiento septal no atribuibles a isquemia.',

    // Se suma al párrafo de esfuerzo cuando la rama no es la negativa
    limitacionSeptalEsfuerzo: 'La evaluación de los segmentos septales se encuentra limitada por el trastorno de conducción, ' +
                       'que genera alteraciones del movimiento septal no atribuibles a isquemia.',

    // Párrafo que se agrega cuando hay secuela previa Y además isquemia nueva en otro territorio
    parrafoSecuelaAgregado: '{{segmentosSecuelaArt}} con alteración basal ({{segmentosSecuela}}, {{territorioSecuelaFrase}}) no modificaron su ' +
                       'motilidad con el esfuerzo, sin evidencia de reserva contráctil, en relación con secuela.',

    // ── CONCLUSIONES ──────────────────────────────────────────────────
    conclusiones: {

        negativa: 'Conclusión: prueba de eco estrés con ejercicio clínica y ecocardiográficamente negativa para isquemia miocárdica inducible, ' +
                  'con {{capacidadFuncional}} y adecuada reserva contráctil.',

        // Versión corta, para cuando la conclusión sigue con la limitación de FC subóptima
        negativaCorta: 'Conclusión: prueba de eco estrés con ejercicio negativa para isquemia miocárdica inducible.',

        negativaConduccion: 'Conclusión: prueba negativa para isquemia miocárdica inducible en los territorios evaluables. ' +
                  'La presencia de {{trastorno}} limita la valoración de los segmentos septales y reduce la especificidad del ' +
                  'estudio en territorio de la descendente anterior, además de invalidar el análisis del segmento ST. ' +
                  'De persistir la sospecha clínica en dicho territorio, considerar apremio con dipiridamol o método de perfusión.',

        positivaUnico: 'Conclusión: prueba de eco estrés con ejercicio positiva para isquemia miocárdica inducible en {{territorioFrase}}. ' +
                  'Se sugiere correlación clínica y evaluación por cinecoronariografía.',

        positivaMulti: 'Conclusión: prueba de eco estrés con ejercicio positiva para isquemia miocárdica inducible extensa, con compromiso de ' +
                  'múltiples territorios coronarios, sugestiva de enfermedad de múltiples vasos. Hallazgo de alto riesgo: se sugiere evaluación ' +
                  'por cinecoronariografía a la brevedad.',

        secuela: 'Conclusión: prueba de eco estrés con ejercicio sin isquemia inducible adicional a la alteración segmentaria conocida en ' +
                  '{{territorioSecuelaFrase}}, la cual no mostró reserva contráctil (compatible con secuela).',

        noConcluyente: 'Conclusión: estudio no concluyente por {{motivoNoConcluyente}}. No es posible descartar con seguridad isquemia ' +
                  'miocárdica inducible. Se sugiere {{sugerenciaNoConcluyente}}.',

        hipotensiva: 'Conclusión: prueba de eco estrés con ejercicio positiva para isquemia, con respuesta hipotensiva al esfuerzo. ' +
                  'La caída tensional inducida constituye un marcador de alto riesgo. Se sugiere evaluación por cinecoronariografía a la brevedad.',

        diastolico: 'Conclusión: prueba de eco estrés con ejercicio negativa para isquemia miocárdica inducible, con test diastólico de esfuerzo ' +
                  'positivo, compatible con insuficiencia cardíaca con fracción de eyección preservada. Se sugiere correlación clínica.'
    },

    // ── MODIFICADORES DE LA CONCLUSIÓN ────────────────────────────────
    // Se insertan antes del punto final de la conclusión elegida.
    modificadores: {
        hipertensiva: ', con respuesta hipertensiva al esfuerzo. Se sugiere optimización del control tensional',

        fcSuboptima: ' al doble producto alcanzado, con la limitación de no haberse alcanzado la FC objetivo, lo que reduce la sensibilidad ' +
                     'del estudio. De persistir la sospecha clínica, considerar apremio farmacológico',

        // Esta frase NO está en el Word: la redacté siguiendo el criterio de la versión 9.
        adquisicionTardia: ', con la limitación de una adquisición post-esfuerzo tardía ({{segImagen}} segundos, FC al adquirir ' +
                     '{{pctFCadq}} % de la FC pico), lo que reduce la sensibilidad del estudio',

        caidaFey: '. La caída de la fracción de eyección con el esfuerzo constituye un marcador de alto riesgo',

        // Limitación septal para ramas que NO son la negativa.
        // Versión completa: no se demostró isquemia en la DA, así que su especificidad queda comprometida.
        conduccionSeptal: '. La presencia de {{trastorno}} limita la valoración de los segmentos septales y reduce la ' +
                     'especificidad del estudio en territorio de la descendente anterior, además de invalidar el análisis ' +
                     'del segmento ST. De persistir la sospecha clínica en dicho territorio, considerar apremio con ' +
                     'dipiridamol o método de perfusión',

        // Versión acotada: ya hay isquemia demostrada en la DA por segmentos valorables,
        // así que hablar de especificidad reducida en ese territorio contradiría el hallazgo.
        conduccionSeptalAcotado: '. La presencia de {{trastorno}} limita la valoración de los segmentos septales e ' +
                     'invalida el análisis del segmento ST'
    },

    // ── FRASE DE ACOMPAÑAMIENTO (ST-T y síntomas) ─────────────────────
    // En un positivo por imagen, que el ECG haya sido mudo es información relevante:
    // se dice explícitamente en lugar de omitirse.
    acompanamiento:            ' Se acompañó de {{lista}} al doble producto alcanzado.',
    acompanamientoSinHallazgos:' No presentó cambios del ST-T ni angina.',
    acompanamientoConduccion:  ' Se acompañó de {{lista}} al doble producto alcanzado; el análisis del segmento ST no es ' +
                               'valorable por el trastorno de conducción.',
    acompanamientoConduccionSinHallazgos: ' No presentó angina; el análisis del segmento ST no es valorable por el ' +
                               'trastorno de conducción.',

    // El WMSI es un índice de motilidad: con trastorno de conducción se calcula sin
    // los septales, y el informe deja constancia de cómo se obtuvo el número.
    aclaracionWMSI: ' (calculado sobre los segmentos valorables, excluidos los septales por el trastorno de conducción)',

    categorizacion: 'Categorización: {{categorizacion}}.',

    // La firma NO se versiona: cada operador carga la suya en el campo
    // "Firma del informe" y queda guardada en su propio navegador.
    firma: ''
};

// ── Nombres de los 17 segmentos en prosa, para el cuerpo del informe ──
const SEG_PROSA = {
    1:  'anterior basal',      2:  'anteroseptal basal',   3:  'inferoseptal basal',
    4:  'inferior basal',      5:  'inferolateral basal',  6:  'anterolateral basal',
    7:  'anterior medio',      8:  'anteroseptal medio',   9:  'inferoseptal medio',
    10: 'inferior medio',      11: 'inferolateral medio',  12: 'anterolateral medio',
    13: 'apical anterior',     14: 'apical septal',        15: 'apical inferior',
    16: 'apical lateral',      17: 'apical'
};

// ── Nombre largo de cada territorio coronario ──
const TERRITORIO_PROSA = {
    DA: 'la arteria descendente anterior',
    CD: 'la arteria coronaria derecha',
    Cx: 'la arteria circunfleja'
};

// ── Trastorno de conducción → cómo se nombra en la prosa ──
// `alTrastorno` ya trae la preposición contraída para que la frase cierre bien.
const CONDUCCION_PROSA = {
    bcri: {
        trastorno:     'bloqueo completo de rama izquierda',
        alTrastorno:   'al bloqueo completo de rama izquierda',
        hallazgoSeptal:'movimiento septal paradójico'
    },
    marcapasos: {
        trastorno:     'ritmo de marcapasos',
        alTrastorno:   'al ritmo de marcapasos',
        hallazgoSeptal:'movimiento septal paradójico por estimulación ventricular derecha'
    },
    preexcitacion: {
        trastorno:     'preexcitación ventricular',
        alTrastorno:   'a la preexcitación ventricular',
        hallazgoSeptal:'alteración del movimiento septal por activación ventricular anómala'
    }
};

// ── Causa de detención → cómo se dice dentro de la frase ──
const CAUSA_PROSA = {
    fc_objetivo:   'haberse alcanzado la FC objetivo',
    fatiga:        'fatiga',
    angina:        'angina',
    st_t:          'cambios del ST-T',
    hipertensiva:  'respuesta hipertensiva',
    hipotension:   'hipotensión',
    arritmia:      'arritmia',
    otro:          'criterio médico'
};

// ── Score de motilidad → palabra usada en la prosa ──
const GRADO_PROSA = {
    2: 'hipoquinesia',
    3: 'hipoquinesia',
    4: 'aquinesia',
    5: 'disquinesia'
};
