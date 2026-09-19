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

    // ══════════════════════════════════════════════════════════════════
    //  CUERPO DEL INFORME — ESQUELETO FIJO
    //  Antes el cuerpo eran párrafos cuya redacción cambiaba según qué campos
    //  estuvieran cargados y según datos de OTRO bloque: la oración de motilidad se
    //  elegía por la tensión arterial, el párrafo de reposo era largo o corto según
    //  cómo había salido el esfuerzo, y las oraciones sin datos desaparecían. Eso
    //  obligaba a releer y corregir cada informe.
    //
    //  Ahora son líneas rotuladas, siempre las mismas y en el mismo orden. Lo que
    //  falta se dice "no consignado" en vez de hacer desaparecer la línea: la ausencia
    //  se ve, y el panel de completitud la señala.
    // ══════════════════════════════════════════════════════════════════
    sinDato: 'no consignado',
    sinDatoF: 'no consignada',

    lineaIndicacion:   'Indicación: {{contenido}}',
    lineaAntecedentes: 'Antecedentes: {{contenido}}',
    lineaProtocolo:    'Protocolo: {{contenido}}',
    lineaHemodinamia:  'Hemodinamia: {{contenido}}',
    lineaCalidad:      'Calidad del estudio: {{contenido}}',
    lineaReposo:       'Reposo: {{contenido}}',
    lineaEsfuerzo:     'Esfuerzo: {{contenido}}',
    lineaMotilidad:    'Motilidad: {{contenido}}',
    lineaViabilidad:   'Viabilidad: {{contenido}}',
    lineaValvular:     'Estenosis aórtica: {{contenido}}',

    sinAntecedentes:   'sin antecedentes cardiovasculares consignados',

    // Motilidad en reposo: una frase por situación, sin mezclarse con FEy ni llenado,
    // que ahora se informan siempre por separado y con sus números.
    reposoMotilidadNormal:  'motilidad parietal normal',
    reposoMotilidadSecuela: '{{gradoSecuela}} {{deSegmentosSecuela}} ({{territorioSecuelaFrase}}), en relación con evento previo',
    reposoMotilidadGlobal:  'hipoquinesia global, sin distribución en territorio coronario',

    antecedentesATC:   'angioplastia a {{vasos}}{{anio}}',
    antecedentesCRM:   'cirugía de revascularización miocárdica{{anio}}',
    antecedentesBB:    'Bajo tratamiento betabloqueante.',

    // ── PREÁMBULO DE LA CONCLUSIÓN ────────────────────────────────────
    // Encabeza SIEMPRE la conclusión, antes del veredicto del Word.
    preambulo: 'Test de Eco estrés {{suficiencia}} ({{pctFCmax}} % de la FCMT{{betabloqueo}}){{etapa}} por {{causaDetencion}}.',
    preambuloBetabloqueo: ', realizado bajo tratamiento con Beta Bloqueante',
    preambuloEtapa: ', detenido en etapa {{etapa}}',
    preambuloSinEtapa: ', detenido',

    // Segunda oración: sólo afirma ausencia de isquemia cuando efectivamente no la hubo
    preambuloSinIsquemia: ' Sin evidencia de isquemia hasta el DP alcanzado ({{dobleProducto}}){{mets}}.',
    preambuloConIsquemia: ' DP alcanzado {{dobleProducto}}{{mets}}.',
    preambuloMETs: '; {{mets}} METs',

    // ── BLOQUE ECG ────────────────────────────────────────────────────
    // Va en líneas propias, fuera del párrafo de motilidad.
    ecgReposo: 'ECG reposo: {{contenido}}',
    ecgPostEsfuerzo: 'ECG post-esfuerzo: {{contenido}}',
    ecgSinCambios: 'Sin cambios del ST-T ni arritmias.',

    // ── ESTUDIO DIASTÓLICO ────────────────────────────────────────────
    diastolicoNegativo:  'Estudio diastólico de esfuerzo: Negativo, sin aumento de las presiones de llenado con el esfuerzo.',
    diastolicoPositivo:  'Estudio diastólico de esfuerzo: Positivo, con aumento de las presiones de llenado inducido por el ejercicio.',
    diastolicoNoEvaluado:'Estudio diastólico de esfuerzo: No evaluado.',

    // ── MÉTODO ────────────────────────────────────────────────────────

    // Frase de respuestas hemodinámicas: una sola de estas, según el caso
    // Si el basal ya era hipertensivo, el dato es del paciente y no sólo de la prueba

    // ── CALIDAD ───────────────────────────────────────────────────────
    // Sin los datos de adquisición cargados, la frase se omite entera:
    // un informe con rayitas se lee como algo a medio hacer.
    // Si igual se pudieron evaluar los 17, "solo 17 de los 17" se contradice solo


    // ── REPOSO ────────────────────────────────────────────────────────

    // Se agrega al bloque de reposo SÓLO cuando hay disfunción diastólica real: el
    // grado normal ya está dicho en las plantillas de arriba.
    diastolicaGrado:   'La función diastólica en reposo corresponde a {{grado}}, según el algoritmo de la ASE.',
    // Corregido a mano: el criterio es del operador y no se le atribuye al algoritmo.
    diastolicaGradoManual: 'La función diastólica en reposo corresponde a {{grado}}.',

    // Ídem: sólo cuando la geometría NO es normal.
    geometriaVI:       'El ventrículo izquierdo presenta {{geometria}} (masa indexada {{imvi}} g/m², espesor relativo {{rwt}}).',
    // Sin los números: corregida a mano pueden contradecir la clasificación elegida.
    geometriaVIManual: 'El ventrículo izquierdo presenta {{geometria}}.',

    // ── VIABILIDAD MIOCÁRDICA ─────────────────────────────────────────
    // Cierra con la implicancia, que es lo que decide si conviene revascularizar.
    viabEncabezado:      'Evaluación de viabilidad miocárdica con dobutamina a baja dosis.',
    viabDisfuncion:      'Se identificaron {{n}} {{plural}} con disfunción contráctil en reposo.',
    viabRespuesta:       'La respuesta al apremio fue {{respuesta}}.',
    viabGrosorPreservado:'El grosor parietal telediastólico de {{mm}} mm está preservado, compatible con miocardio viable.',
    viabGrosorFino:      'El grosor parietal telediastólico de {{mm}} mm muestra adelgazamiento, que sugiere cicatriz transmural.',

    viabImplicaBifasica:  ' La respuesta bifásica es el patrón de mayor valor predictivo de recuperación funcional ' +
                 'tras la revascularización; se sugiere evaluar la anatomía coronaria del territorio comprometido.',
    viabImplicaSostenida: ' La mejoría sostenida indica miocardio hibernado con reserva contráctil conservada, ' +
                 'con probabilidad de recuperación funcional si se revasculariza.',
    viabImplicaCicatriz:  ' La ausencia de reserva contráctil hace improbable la recuperación funcional del ' +
                 'territorio comprometido tras la revascularización.',

    // ── EAo SEVERA ASINTOMÁTICA CON EJERCICIO ─────────────────────────
    // Párrafo propio: es la pregunta que se fue a responder, no un accesorio.
    eaoEjBloque: 'Evaluación de estenosis aórtica severa asintomática con ejercicio.{{severidadBasal}} ' +
                 '{{gradiente}}{{psap}} {{sintomas}} {{tension}}{{capacidad}}',

    eaoEjSeveridad:  ' Área valvular en reposo de {{ava}} cm².',
    eaoEjGradiente:  'El gradiente medio pasó de {{gradRep}} mmHg en reposo a {{gradPost}} mmHg en el ' +
                     'post-esfuerzo inmediato{{segundos}} ({{delta}} mmHg).',
    eaoEjGradienteSolo: 'El gradiente medio en reposo fue de {{gradRep}} mmHg.',
    eaoEjSegundos:   ', medido a los {{seg}} segundos de finalizado el ejercicio',
    eaoEjPsap:       ' La presión sistólica pulmonar estimada pasó de {{psapRep}} a {{psapPost}} mmHg.',
    eaoEjPsapPost:   ' La presión sistólica pulmonar estimada post-esfuerzo fue de {{psapPost}} mmHg.',

    eaoEjSintomas:      'Durante el esfuerzo presentó {{sintomas}}{{momento}}.',
    eaoEjSinSintomas:   'No refirió síntomas durante el esfuerzo.',
    eaoEjCapacidad:     ' La capacidad funcional alcanzada fue {{capacidad}}.',

    // ── Conclusión del módulo: lo que cambia la conducta ──
    // Va como oración propia al final: un paciente que se hace sintomático o tiene
    // respuesta tensional anormal deja de ser asintomático, y eso mueve la indicación
    // quirúrgica. Decirlo a medias no sirve de nada.
    eaoEjNoAsintomatico: ' La prueba de esfuerzo desenmascaró {{motivos}}, por lo que el paciente ' +
                 'deja de considerarse asintomático: el hallazgo modifica la indicación quirúrgica y ' +
                 'amerita evaluación por el equipo de válvulas.',
    eaoEjAsintomatico:   ' El paciente completó el esfuerzo sin síntomas y con respuesta tensional normal, ' +
                 'confirmándose la condición de asintomático.',
    // Cuando el operador sostiene "asintomático" pese a haber criterios cargados: se
    // informa su criterio sin afirmar lo que los datos contradicen.
    eaoEjAsintomaticoPeseA: ' Pese a los hallazgos descritos, se interpreta que el paciente mantiene su ' +
                 'condición de asintomático.',
    eaoEjMotivoSintomas: 'síntomas hasta entonces no referidos ({{sintomas}})',
    eaoEjMotivoTension:  'una respuesta tensional anormal ({{detalle}})',
    // Cuando la conclusión ya abrió con la caída tensional (rama hipotensiva), se la
    // referencia en vez de repetirla en el mismo párrafo.
    eaoEjNoAsintomaticoTaYaDicha: ' La respuesta tensional descrita hace además que el paciente deje de ' +
                 'considerarse asintomático: el hallazgo modifica la indicación quirúrgica y amerita ' +
                 'evaluación por el equipo de válvulas.',

    // Coletilla de presiones de llenado. Antes era una afirmación fija dentro de la
    // plantilla ("sin datos de aumento") y contradecía al grado diastólico cuando el
    // algoritmo detectaba presiones elevadas. Ahora la elige el grado.
    presionesNormales:       ', sin datos de aumento de las presiones de llenado',
    presionesElevadas:       ', con aumento de las presiones de llenado en reposo',
    presionesNoClasificable: ', sin poder clasificar la función diastólica por discordancia entre los parámetros',

    // ── ESFUERZO ──────────────────────────────────────────────────────
    // Sólo motilidad y respuesta contráctil: el ST-T tiene sus propias líneas y lo
    // hemodinámico la suya. Antes esta frase los repetía y cambiaba de forma según la TA.
    esfuerzoNegativo:  'Adecuada respuesta hiperdinámica global, sin nuevas alteraciones de la motilidad parietal ' +
                       'en ninguno de los territorios evaluados.',

    esfuerzoPositivoUnico: 'Nueva {{grado}} {{deSegmentos}}, con caída del engrosamiento sistólico ' +
                       'respecto del reposo, en {{territorioFrase}}. El WMSI{{aclaracionWMSI}} ascendió de {{wmsiReposo}} en reposo a ' +
                       '{{wmsiEstres}} post-esfuerzo.' +
                       '{{acompanamiento}} El resto de los segmentos mostró adecuada respuesta hiperdinámica.',

    esfuerzoPositivoMulti: 'Nuevas alteraciones de la motilidad en los segmentos {{segmentos}}, con compromiso ' +
                       'de más de un territorio coronario ({{territorios}}). El WMSI{{aclaracionWMSI}} ascendió de {{wmsiReposo}} a ' +
                       '{{wmsiEstres}}{{caidaFey}}.' +
                       '{{acompanamiento}} El hallazgo de isquemia extensa y multiterritorial constituye un marcador de alto riesgo.',

    esfuerzoSecuela:   'Los segmentos comprometidos no modificaron su motilidad, sin reserva contráctil regional ' +
                       'en dicho territorio. El resto de los segmentos mostró adecuada respuesta hiperdinámica, sin nuevas ' +
                       'alteraciones.{{reservaGlobal}}{{acompanamiento}}',

    // Reserva contráctil GLOBAL: es el ΔFEy, y es un dato pronóstico propio que no
    // se puede dar por perdido porque la respuesta regional haya sido nula.
    reservaGlobalConservada: ' La función sistólica global mostró incremento adecuado con el esfuerzo (FEy {{feyReposo}} % → ' +
                       '{{feyEstres}} %, Δ +{{deltaFey}} puntos), lo que traduce reserva contráctil global conservada.',
    reservaGlobalAusente: ' La función sistólica global no mostró incremento significativo (FEy {{feyReposo}} % → {{feyEstres}} %, ' +
                       'Δ {{deltaFey}} puntos), sin reserva contráctil global.',

    // ── LÍNEA CUANTITATIVA DE MOTILIDAD ───────────────────────────────



    esfuerzoNoConcluyente: 'En los segmentos evaluables no se observaron nuevas alteraciones de la motilidad parietal.',

    esfuerzoDiastolico: 'Sin nuevas alteraciones de la motilidad parietal. La relación E/e\' promedio ascendió a ' +
                       '{{eeEstres}}, con VRT de {{vrtEstres}} m/s, sin el incremento esperado de e\', hallazgos compatibles con aumento de las ' +
                       'presiones de llenado del ventrículo izquierdo inducido por el ejercicio.',

    esfuerzoHipotensiva: 'Se objetivaron {{hallazgos}}, con caída de la FEy de {{feyReposo}} % a {{feyEstres}} %.',

    // ── DISCORDANCIA ELÉCTRICO-ECOGRÁFICA ─────────────────────────────
    // ECG positivo con eco negativo. La conclusión no puede negar la isquemia
    // a secas cuando el bloque de ECG describe cambios isquémicos.
    esfuerzoDiscordancia: 'Adecuada respuesta hiperdinámica global, sin nuevas alteraciones ' +
                       'de la motilidad parietal en ninguno de los territorios evaluados, pese a los cambios eléctricos ' +
                       'descritos.{{acompanamiento}}',

    // ── HIPOQUINESIA GLOBAL / MIOCARDIOPATÍA DILATADA ─────────────────
    // Patrón no coronario: NO se enumeran segmentos ni se atribuyen territorios,
    // y no existe "el resto de los segmentos" del que hablar.
    reposoDilatada:   'En reposo se observó hipoquinesia global del ventrículo izquierdo, sin distribución en territorio ' +
                      'coronario, con función sistólica {{gradoFey}} (FEy {{fey}} %){{vd}} y relación E/e\' de {{ee}}.',

    esfuerzoDilatada: 'No se objetivó incremento significativo de la motilidad parietal ni de la función ' +
                      'sistólica global, sin evidencia de reserva contráctil.{{acompanamiento}}',

    // ── TRASTORNO DE CONDUCCIÓN ───────────────────────────────────────
    // En BCRI, marcapasos o preexcitación el septum se mueve mal por activación
    // eléctrica anómala, no por isquemia ni necrosis: no se atribuye a un vaso.
    reposoConduccion: 'En reposo se observó {{hallazgoSeptal}}, con asincronía de los segmentos {{segmentosSeptales}}, ' +
                       'atribuible {{alTrastorno}} y no a secuela isquémica. El resto de los segmentos presentó motilidad ' +
                       'conservada, con FEy {{fey}} % y relación E/e\' de {{ee}}.',

    // Cuando además hay secuela real en otro territorio, esta frase se suma al párrafo de reposo
    asincroniaSeptalSuelta: 'Se observó además {{hallazgoSeptal}}, con asincronía de los segmentos {{segmentosSeptales}}, ' +
                       'atribuible {{alTrastorno}} y no a secuela isquémica.',

    esfuerzoConduccion: 'Los segmentos no septales mostraron adecuada respuesta hiperdinámica, sin nuevas ' +
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

        // La cola se arma según qué se informa abajo: lo que se va al párrafo pronóstico
        // con su implicancia no se nombra también acá, y sobre todo no se afirma lo
        // contrario. Antes el veredicto decía "adecuada reserva contráctil" y el párrafo
        // siguiente decía que no la hubo.
        negativa: 'Conclusión: prueba de eco estrés con ejercicio clínica y ecocardiográficamente negativa para isquemia miocárdica inducible{{colaNegativa}}.',
        colaNegativaAmbas:   ', con {{capacidadFuncional}} y adecuada reserva contráctil',
        colaNegativaSoloCF:  ', con {{capacidadFuncional}}',
        colaNegativaSoloRes: ', con adecuada reserva contráctil',

        // Versión corta, para cuando la conclusión sigue con la limitación de FC subóptima
        negativaCorta: 'Conclusión: prueba de eco estrés con ejercicio negativa para isquemia miocárdica inducible.',

        dilatada: 'Conclusión: prueba de eco estrés con ejercicio sin isquemia inducible, en un ventrículo izquierdo con ' +
                  'hipoquinesia global y función sistólica {{gradoFey}}, sin reserva contráctil con el esfuerzo. El patrón ' +
                  'de compromiso no sigue una distribución coronaria, en relación con miocardiopatía dilatada{{vdConcl}}.' +
                  '{{capacidadDilatada}}',

        discordancia: 'Conclusión: prueba de eco estrés con ejercicio con respuesta eléctrica positiva ({{descripcionST}}) y ' +
                  'respuesta contráctil negativa, sin nuevas alteraciones de la motilidad parietal. Se trata de una ' +
                  'discordancia eléctrico-ecográfica: la respuesta contráctil tiene mayor especificidad para isquemia ' +
                  'miocárdica que el análisis del segmento ST. Se sugiere correlación clínica.',

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
        fcSuboptima:' al doble producto alcanzado, con la limitación de no haberse alcanzado la FC objetivo, lo que reduce la sensibilidad ' +
                     'del estudio. De persistir la sospecha clínica, considerar apremio farmacológico',

        // Versión oración, para engancharse después de un núcleo que ya cerró con punto
        // (secuela, diastólico). Un estudio sin isquemia y con FC insuficiente no es
        // un negativo pleno, cualquiera sea la rama por la que haya salido.
        fcSuboptimaOracion: ' El estudio se realizó con la limitación de no haberse alcanzado la FC objetivo, ' +
                     'lo que reduce su sensibilidad; de persistir la sospecha clínica, considerar apremio farmacológico.',

        // La adquisición tardía y la caída de la FEy salían acá como coletillas sueltas.
        // Ahora: la adquisición tardía es control de calidad del operador y se queda en
        // pantalla (el párrafo de calidad ya informa los segundos y la FC de adquisición),
        // y la caída de la FEy pasó al bloque `pronostico`, junto con el resto de lo que
        // le cambia la conducta al clínico que lee el informe.

        // Discordancia sobre una rama que ya dice otra cosa (secuela, dilatada)
        discordancia: '. Presentó además cambios isquémicos del segmento ST ({{descripcionST}}) sin correlato en la ' +
                     'motilidad parietal, discordancia en la que la respuesta contráctil tiene mayor especificidad',

        // Un test diastólico positivo es un hallazgo con peso propio: no puede quedarse
        // sólo en la línea descriptiva del bloque post-esfuerzo.
        diastolicoPositivo: '. El estudio diastólico de esfuerzo resultó positivo, con aumento de las presiones de llenado ' +
                     'inducido por el ejercicio',

        // La arritmia relevante también se mudó a `pronostico`: es de las cosas que le
        // cambian la conducta al que lee, y ahí sale junto al resto en una sola oración.

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

    // ── EL ANTECEDENTE CAMBIA LA LECTURA DEL HALLAZGO ─────────────────
    // Isquemia en un vaso ya tratado no es una lesión nueva: es reestenosis o
    // progresión hasta que se demuestre lo contrario, y eso cambia la conducta.
    // Por eso el vaso de la angioplastia se carga como dato y no como texto libre.
    reestenosis: ' El territorio comprometido ({{territorio}}) tiene angioplastia previa{{anio}}: el hallazgo ' +
                 'sugiere reestenosis o progresión de la lesión tratada hasta que se demuestre lo contrario; ' +
                 'se sugiere evaluación de la anatomía coronaria.',
    isquemiaOtroVaso: ' El territorio comprometido ({{territorio}}) no es el tratado en la angioplastia previa' +
                 '{{anio}}, lo que sugiere progresión de la enfermedad en otro vaso.',
    injertos:    ' En un paciente con cirugía de revascularización previa{{anio}}, la isquemia inducible obliga ' +
                 'a evaluar la permeabilidad de los injertos.',

    // Texto libre del operador: va al final, después de todo lo deducido.
    conclusionLibre: '\n\n{{texto}}',

    // ── HALLAZGOS DE VALOR PRONÓSTICO ─────────────────────────────────
    // El que pide el estudio no ve la pantalla del operador, y estos datos le cambian
    // la conducta. Cada uno viene con QUÉ se encontró, QUÉ implica y, cuando
    // corresponde, QUÉ hacer. Las sugerencias van acá y no en el cuerpo descriptivo.
    //
    // Cada ítem es una PROPOSICIÓN en minúscula ("la capacidad funcional fue…"), para
    // que sirva en los dos formatos: con un solo hallazgo se integra tras "Merece
    // señalarse que…"; con dos o más se capitaliza y arma un párrafo aparte.
    //
    // El control de calidad de la adquisición —imagen tardía, doble producto en el
    // borde, WMSI inflado por conducción— NO entra: es del operador.
    pronostico: {
        // Un solo hallazgo: integrado en la conclusión
        integrada: ' Merece señalarse que {{hallazgo}}.',

        // Dos o más: párrafo propio, encabezado por una bisagra que impide que el
        // lector apurado se quede con el veredicto y no lea lo que lo matiza.
        bisagraNegativa: 'Ese buen pronóstico coronario convive, sin embargo, con {{n}} hallazgos que lo modifican.',
        bisagraGeneral:  'Merecen señalarse además {{n}} hallazgos con valor pronóstico propio, independiente del resultado del estudio.',

        // El negativo afirma algo, no sólo niega
        negativoBajoRiesgo: ' La ausencia de isquemia con un estímulo suficiente se asocia a bajo riesgo de ' +
                     'eventos coronarios, menor al 1 % anual.',

        // ── Los hallazgos, ordenados por cuánto cambian la conducta ──
        hipotension: 'la respuesta hipotensiva al esfuerzo constituye un marcador de alto riesgo, que sugiere ' +
                     'isquemia extensa o disfunción ventricular; se sugiere evaluación de la anatomía coronaria sin demora',

        caidaFey:    'la fracción de eyección cayó de {{feyReposo}} % a {{feyEstres}} % con el esfuerzo, marcador ' +
                     'de isquemia extensa; se sugiere evaluación de la anatomía coronaria',

        umbralBajo:  'la isquemia apareció con un doble producto de {{dp}}, umbral isquémico bajo que sugiere ' +
                     'lesión severa o enfermedad de múltiples vasos; se sugiere evaluación coronaria a la brevedad',

        sinReserva:  'no hubo reserva contráctil global con el esfuerzo (FEy {{feyReposo}} % → {{feyEstres}} %), ' +
                     'hallazgo que se asocia a peor pronóstico',

        arritmia:    'se constató {{arritmias}}{{momento}}{{sintomas}}, hallazgo de significación pronóstica; ' +
                     'se sugiere monitoreo ambulatorio para definir su carga',

        mets:        'la capacidad funcional fue {{grado}} ({{mets}} METs{{pct}}), predictor independiente de ' +
                     'mortalidad más allá del resultado del estudio; se sugiere rehabilitación cardiovascular supervisada',
        // Detenida por un límite muscular u ortopédico: el número no describe riesgo
        // cardiovascular y la sugerencia cambia de sentido.
        metsLimiteNoCV: 'la capacidad funcional fue {{grado}} ({{mets}} METs{{pct}}), con la prueba detenida por ' +
                     '{{causa}}: conviene definir si el límite fue cardiovascular antes de atribuirle valor pronóstico',
        metsPct:     ', {{pct}} % del predicho para edad y sexo',

        hrr1:        'la recuperación de la frecuencia cardíaca al primer minuto fue de {{hrr1}} lpm, {{matiz}}, ' +
                     'marcador de disfunción autonómica asociado a mayor mortalidad',
        hrr1Limite:  'en el límite inferior',
        hrr1Bajo:    'por debajo de los 12 lpm esperados',
        hrr1MuyBajo: 'muy por debajo de los 12 lpm esperados',

        // Un joven con 6 METs está mal aunque supere el corte absoluto de 5: se
        // menciona como capacidad reducida para su edad y sexo, sin mover la categoría.
        capacidadPct: 'la capacidad funcional alcanzada ({{mets}} METs) representa el {{pct}} % del predicho ' +
                     'para edad y sexo, por debajo de lo esperable; se sugiere actividad física programada',

        // La implicancia depende de la basal y del antecedente. Con basal normal,
        // "control tensional subóptimo" es una afirmación que los datos no sostienen:
        // lo anormal ahí es la respuesta, no el control en reposo.
        hipertensionBasalAlta: 'la tensión arterial alcanzó {{taPico}} mmHg partiendo de cifras basales ya ' +
                     'elevadas ({{taBasal}} mmHg), lo que sugiere control tensional subóptimo; se sugiere ' +
                     'ajuste del tratamiento antihipertensivo',
        hipertensionBasalNormalConHta: 'la tensión arterial alcanzó {{taPico}} mmHg partiendo de cifras basales ' +
                     'normales ({{taBasal}} mmHg): el control en reposo es adecuado pero la respuesta al esfuerzo ' +
                     'es exagerada; se sugiere monitoreo ambulatorio de la presión arterial para evaluar el ' +
                     'control fuera del consultorio',
        hipertensionBasalNormalSinHta: 'la tensión arterial alcanzó {{taPico}} mmHg partiendo de cifras basales ' +
                     'normales ({{taBasal}} mmHg), respuesta exagerada que se asocia a mayor riesgo de desarrollar ' +
                     'hipertensión arterial; se sugiere monitoreo ambulatorio de la presión arterial'
    },

    // ── FRASE DE ACOMPAÑAMIENTO (ST-T y síntomas) ─────────────────────
    // En un positivo por imagen, que el ECG haya sido mudo es información relevante:
    // se dice explícitamente en lugar de omitirse.
    acompanamiento:            ' Se acompañó de {{lista}} al doble producto alcanzado.',
    acompanamientoSinHallazgos:' No refirió angina ni equivalentes anginosos.',

    // El WMSI es un índice de motilidad: con trastorno de conducción se calcula sin
    // los septales, y el informe deja constancia de cómo se obtuvo el número.
    aclaracionWMSI: ' (calculado sobre los segmentos valorables, excluidos los septales por el trastorno de conducción)',

    categorizacion: 'Categorización: {{categorizacion}}.',

    // La firma NO se versiona: cada operador carga la suya en el campo
    // "Firma del informe" y queda guardada en su propio navegador.
    firma: ''
};

// Grado de deterioro de la FEy, en las palabras del informe
const FEY_PROSA = [
    { max: 30, txt: 'severamente deprimida' },
    { max: 40, txt: 'moderadamente deprimida' },
    { max: 52, txt: 'levemente deprimida' },
    { max: 100, txt: 'conservada' }
];

// Función del ventrículo derecho
const VD_PROSA = {
    normal:   'con función del ventrículo derecho conservada',
    leve:     'con disfunción leve del ventrículo derecho',
    moderada: 'con disfunción moderada del ventrículo derecho',
    severa:   'con disfunción severa del ventrículo derecho'
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

// Cómo se nombra cada trastorno en la línea "ECG reposo:" (sigla, como se escribe a mano)
const CONDUCCION_SIGLA = {
    bcri: 'BCRI',
    marcapasos: 'ritmo de marcapasos',
    preexcitacion: 'preexcitación ventricular',
    bcrd: 'BCRD',
    hbai: 'HBAI',
    hbpi: 'HBPI',
    bcrd_hbai: 'BCRD + HBAI'
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
