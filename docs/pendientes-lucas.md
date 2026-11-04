# Pendientes de Lucas — lista central

Raíz vigente: `App Eco Estres/`. No usar la subcarpeta histórica. Trabajar por
tandas completas: pruebas, ambos barridos, navegador, commit/push y actualización
de esta lista al cerrar cada tanda. Las consultas clínicas se agrupan con una
propuesta concreta; no bloquean tareas prácticas independientes.

## Terminado antes de estas tandas

- [x] Descripción de motilidad por grados, commit `48717a9`: cada segmento conserva
  su grado basal y post-esfuerzo; agrupación por severidad sin modificar puntajes,
  WMSI, clasificación, territorios ni conclusión diagnóstica.
- [x] Regresiones de grados mixtos y comprobación de invariantes entre motores.

## Tanda 1 — Formulario más ágil

Estado: terminada y verificada. Entrega en el commit de cierre de esta tanda.

- [x] Campo opcional **Aclaración de la indicación**, junto al selector.
- [x] Guardado aditivo en borrador e historial; recuperación compatible con
  registros anteriores sin esa clave. No cambiar DRAFT_VERSION ni descartar datos.
- [x] Mantener la aclaración fuera del informe y de Sheets por ahora. No reutilizar
  `indicacion_libre`, que sigue preservado y tiene dependencias anteriores.
- [x] Antecedentes compactos: mismas etiquetas, casillas, selección y efectos;
  explicaciones extensas en ayuda desplegable accesible.
- [x] Mediciones basales en orden **SIV → PP → DDVI**.
- [x] VTS opcional al final de los volúmenes, tanto basal como post-esfuerzo; mismos
  campos, límites, unidades, cálculos y validaciones.
- [x] Menos explicación hemodinámica permanente; ayuda desplegable para DP/HRR₁,
  etapa/carga y prioridad de METs de ergometría. Resultados, procedencia manual,
  unidades, advertencias e identificación de criterios propios siguen visibles.
- [x] Tabla detallada plegada, accesible mediante **Ver detalle por segmentos**.
  Conservar bull's eye, carga por grupos y motores.
- [x] Panel plegado **Ver completud**, con resumen visible de errores/avisos;
  comprobaciones y bloqueo por causa de detención intactos.
- [x] Cierre: batería completa `npm test` sin fallas, incluidos barridos de 800
  casos propios y 400 con texto Doppler. Regresión nueva de borrador/historial,
  carga de registro antiguo, salida y contrato de Sheets sin cambios.
- [x] Navegador de PC: aclaración recuperada tras recargar, antecedentes, ayudas,
  apertura/cierre de segmentos y completud, carga por grupos y generación de informe.
  Teclado: Enter en ayudas/completud y Tab SIV → PP → DDVI. Sin desborde de página.
- [x] Móvil: comprobación básica de apertura, edición y acceso a desplegables;
  sin desborde de página en la comprobación realizada. Sin rediseño específico.
- [x] Revisión del diff: sin firma/matrícula reales ni datos de pacientes;
  sin cambios de criterios, textos del motor, vendor ni contratos de Sheets.

**Prioridad validada por Lucas:** uso en **PC**, con controles cómodos, buena
legibilidad y navegación rápida. En móvil sólo comprobar acceso básico; no demorar
las tandas por optimizaciones específicas.

Decisiones de esta tanda: ayudas nativas accesibles por teclado; resumen de
completud visible con el contenido plegado; campo nuevo aditivo sin subir
DRAFT_VERSION. Un registro antiguo sin la nueva clave deja la aclaración vacía,
sin modificar ni borrar el registro guardado. La recuperación desde historial y
la exclusión de informe/Sheets se verificaron en la regresión automatizada; en
navegador se comprobó guardado en historial y recuperación del borrador.

Las tandas 2–5 siguen pendientes. No se activaron propuestas clínicas anteriores.

## Tanda 2 — Automatización y diastólico

Estado: **simplificación basal implementada** según actualización de Lucas del
02/11/2026. La conexión del diastólico de esfuerzo y sus textos siguen pendientes.
La propuesta inicial de conservar controles visibles quedó reemplazada por este
pedido explícito; `docs/propuesta-tanda-2.md` conserva el diagnóstico histórico.

- [x] Relevar geometría del VI y trazabilidad; detectado automático obsoleto al borrar una medida.
- [x] Reemplazar selector visible de geometría por panel automático con resultado,
  cifras, criterios y faltantes. Retirar automáticos obsoletos al perder medidas.
- [x] Reemplazar selector visible basal diastólico por panel calculado; sin datos
  suficientes mostrar no clasificable. Conservar los criterios actuales.
- [x] Retirar de la interfaz texto libre basal, presión pulmonar estimada y función
  de VD, sin reubicarlos en desplegables. Los nodos internos y sus valores se
  mantienen sólo por compatibilidad/persistencia, sin acceso por teclado.
- [x] Conservar banderas y valores manuales; mostrar resultado calculado separado
  del utilizado en el informe, con advertencia específica de discrepancia.
- [x] No descartar borradores ni subir DRAFT_VERSION. Conservar los informes
  editados y campos históricos; avisar en pantalla cuando hay datos retirados
  que siguen alimentando informe/módulos.
- [x] Relevar motores basales/de esfuerzo, dependencias y texto libre basal.
- [x] Reproducir Indeterminado → No evaluado y aviso incorrecto; propuesta conjunta y textos preparados.
- [ ] Implementar conexión y textos aprobados, conservando los criterios actuales.
- [ ] Resolver la pérdida de **Indeterminado → No evaluado** entre cálculo,
  selector oculto, informe largo y OSECAC.
- [ ] Distinguir no realizado, evaluación incompleta con mediciones faltantes,
  indeterminado, negativo y positivo, conservando los umbrales actuales hasta
  aprobación explícita de cambios clínicos.
- [ ] Si falta una medición basal, mantener el resultado actual y explicitar qué
  falta; no reinterpretarlo silenciosamente.
- [ ] Corregir el aviso persistente de evaluación pendiente cuando ya hubo
  mediciones y el resultado fue indeterminado.
- [ ] Conservar correcciones manuales antiguas y su procedencia; mostrarlas para
  revisión sin borrarlas ni ignorarlas. Resultado efectivo coherente en pantalla,
  copiloto, informes e historial.
- [x] Revisar dependencias de PP/VD: retirar controles, conservar lógica interna.
  No agregar TAPSE, S' ni FAC. Pendiente clínico: resolver los supuestos de PP y
  cómo cargar información excepcional de VD sin reintroducir campos de rutina.

Propuesta vigente de esta tanda: `docs/propuesta-tanda-2.md`; antecedente de
textos/motores: `docs/propuestas-tanda-1.md`. Cinco decisiones agrupadas, sin
activar cambios clínicos de esfuerzo. PP/VD y texto libre se conservan como datos
internos, **no como controles visibles**. No borrar valores para simplificar UI.

Pruebas de cierre: `basales-automaticos.js` cubre cuatro geometrías/ambos sexos,
normal/I/II/III/indeterminada/incompleta basal, borrado de medidas, plausibilidad,
correcciones, borrador, historial e informe editado. Comparación contra `acf6a82`
de ambos informes y fila Sheets: idénticos para caso completo automático y caso
con datos/correcciones heredados. Navegador PC: cinco controles sin representación
visual, resultados calculados y actualización al borrar datos; sin desborde.
No se modificaron plantillas ni criterios de esfuerzo. Batería completa `cd test && npm test` terminó con código 0: sin fallas,
incluidos 800 casos propios y 400 con texto Doppler. Entrega en el commit de
simplificación basal; no equivale a cerrar el diastólico de esfuerzo.

### Dependencias conservadas tras retirar controles

- `pp_reposo`: `psapSugerida()`/`autocompletarInterpretacion()` siguen estimando
  con VRT basal y PAD asumida de 5, tal como antes. Informe, `datosEAoEjercicio()`
  y módulos siguen leyendo el dato interno. No se agregó ni cambió ese supuesto.
  Sin VRT ni valor heredado, no se crea una presión; ya no hay entrada manual
  de rutina para una medición independiente. Su futura carga excepcional queda pendiente.
- `vd_funcion`: sólo disponía de selección manual; no existe motor que deduzca
  la función de VD. Para nuevos estudios queda sin evaluación, sin inventar
  normalidad ni introducir mediciones. Valores históricos siguen en informe/Sheets.
- `reposo_libre`: el dato histórico sigue sustituyendo `piezas.reposoEco` y llega
  a ambos informes; conservarlo evita cambios de contenido por retirar el control.
  Su presencia se avisa en pantalla. No hay editor basal libre nuevo ni desplegable.
- Los manuales se reconocen por `corregidos`; no se inventa autor/fecha ni se
  atribuye al algoritmo una corrección. Las plantillas actuales, incluyendo su
  forma de describir diastología sin grado, quedan para revisión de informe.
- Corregir la pérdida de indeterminado de esfuerzo y sus avisos **no está incluido
  en este commit**; tampoco se aprobó la actualización ASE 2025.

## Tanda 3 — Indicaciones y módulos

Estado: pendiente.

- [ ] Agrupar las indicaciones por protocolo.
- [ ] Desplegar las herramientas pertinentes al motivo del estudio.
- [ ] Reubicar los controles de valvulopatías, sin duplicar sus datos.
- [ ] Orientar los módulos al protocolo de ejercicio y separar dobutamina.
- [ ] Mantener la identificación de gradiente/PSAP post-esfuerzo y el tiempo de
  adquisición; no confundirlos con datos medidos durante el pedaleo.
- [x] Texto libre basal retirado de la interfaz en tanda 2; conservar sus datos.
- [ ] Revisar la doble redacción histórica en tanda 4 sin pérdida de datos.

## Tanda 4 — Informe OSECAC

Estado: pendiente. Requiere un ejemplo aprobado antes de cambiar contenido clínico.

- [ ] Reposo centrado en hallazgos.
- [ ] Separación interna del bloque de esfuerzo para facilitar lectura y copiado.
- [ ] Tratamiento de mala ventana y limitaciones.
- [ ] Territorio comprometido en la conclusión.
- [ ] Separar información médica interna de la salida que se copia al formulario.
- [ ] Definir e incorporar **Aclaración de la indicación** al informe, sólo después
  de aprobación. Definir aparte si debe viajar a Sheets y cómo conservar su contrato.
- [ ] Resolver interpretación/resultado tras comprobar sus dependencias; no ocultar
  ni eliminar ahora los campos persistidos.
- [ ] Conciliar textos libres basales históricos con los bloques; su control ya fue retirado en tanda 2.

El **segundo formato/informe largo y su reordenamiento quedan postergados**. En
esta tanda visual no se mueve la hemodinamia que hoy aparece bajo Reposo.

## Tanda 5 — Revisión clínica y motores

Estado: pendiente de investigación/propuestas y validación clínica de Lucas.

- [ ] METs y ecuaciones aplicables al cicloergómetro; aclarar la referencia a “bici
  supina” frente al setup real: pedaleo semisentado con respaldo reclinable y
  adquisición basal/post-esfuerzo, nunca durante el pedaleo.
- [ ] Actualización de diastología a ASE 2025, sin activar cambios antes de aprobar
  algoritmo, cortes, condiciones de uso y textos.
- [ ] Motor C: validar alcance descriptivo/territorial y la propuesta de excluir
  atribuciones automáticas a Chagas, Takotsubo u otras etiologías. Sigue pendiente
  de confirmación clínica; la propuesta del chat de dirección no es implementación.
- [ ] Corregir la conversión de escala del C cuando se apruebe su alcance:
  estrés 1/2/3/4/5 → Doppler 1/2/2/3/4. Casos preparados, no activados:
  `test/fixtures/motor-c-escala-pendiente.json`.
- [ ] Revisar riesgo, cifras pronósticas y criterios propios, identificándolos como
  propios: DP <20.000, HRR₁ ≤6 y segmentos sin par por territorio.
- [ ] Resolver dudas sobre hipoquinesia/FEy baja, reserva global frente a respuesta
  regional y coherencia entre motores. No cambiar exclusiones/evaluabilidad de forma
  incidental.

## Tanda estética v2.3 — botonera y orden de eco Doppler

Estado: terminada el 03/11/2026 (Claude, chat de coordinación). Sólo presentación:
informes idénticos antes y después en los 10 presets (comparación por hash del
informe largo y de los tres cuadros de OSECAC). Sin cambios de criterios,
plantillas, `vendor/`, contrato de Sheets ni DRAFT_VERSION.

- [x] Botonera anclada abajo, la misma de eco Doppler: BORRAR TODO, GENERAR
  INFORME, COPIAR INFORME, GUARDAR ESTUDIO, HISTORIAL, SINCRONIZAR.
- [x] GUARDAR ESTUDIO = historial + planilla si está configurada; la edición a mano
  se pregunta una sola vez.
- [x] BORRAR TODO sin confirmación, con Deshacer de 15 s que devuelve el estudio
  entero. Deja la motilidad en verde y sin leer, como al abrir la app.
- [x] Historial y casuística en un panel; planilla, firma, imprimir y planilla de
  datos en ⚙ Sincronizar. Presets y checklist fuera de la pantalla, en el documento.
- [x] Perlas clínicas fuera del flujo: panel 📚 en el encabezado, por tema.
- [x] Motilidad antes del eco post-esfuerzo; bloque 4 "Post-esfuerzo".
- [x] Situaciones especiales plegadas, con "EAo con ejercicio" primero; se abren
  solas con indicación de EAo o válvula bicúspide.
- [x] Barra de secciones fija; cada chip deja el cursor en el primer campo vacío.
- [x] Paleta, tarjetas y campos de eco Doppler v18.7; calculados sin caja.
  Contraste medido: 0 textos bajo 4,5:1 en claro, oscuro y teléfono.

Pendiente de Lucas: confirmar si la frase del recuadro "Estrés diastólico"
("Criterio positivo: E/e' >14 + PSAP >50 mmHg o e' <7") se actualiza al criterio
ASE 2016 que la app ya aplica. Es texto clínico: no se tocó.

## Límites y conservación

- No borrar estudios, borradores, campos heredados ni correcciones manuales.
- No editar `vendor/doppler/`. No cambiar contratos de Sheets sin una tarea explícita.
- Las tandas no autorizan por sí solas cambios de cortes ni de qué hallazgos van al
  informe. Presentar esas decisiones agrupadas al chat de dirección.
- Conservar las reglas de AGENTS.md: una mención por hallazgo, descripción y
  significado sin conducta terapéutica, cierre permitido y protección de firma/HC.
