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

Estado: pendiente. No implementar por implicación de la tanda 1.

- [ ] Revisar geometría del VI automática y trazabilidad del criterio aplicado.
- [ ] Revisar diastología automática de reposo y esfuerzo y sus dependencias.
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
- [ ] Resolver controles de presión pulmonar/VD tras comprobar dependencias; no
  agregar por rutina TAPSE, S' o FAC ni modificar criterios en esta tanda visual.

Textos propuestos y migración pendiente: `docs/propuestas-tanda-1.md`.

## Tanda 3 — Indicaciones y módulos

Estado: pendiente.

- [ ] Agrupar las indicaciones por protocolo.
- [ ] Desplegar las herramientas pertinentes al motivo del estudio.
- [ ] Reubicar los controles de valvulopatías, sin duplicar sus datos.
- [ ] Orientar los módulos al protocolo de ejercicio y separar dobutamina.
- [ ] Mantener la identificación de gradiente/PSAP post-esfuerzo y el tiempo de
  adquisición; no confundirlos con datos medidos durante el pedaleo.
- [ ] Revisar texto libre basal y sus dependencias junto con las tandas 2–4;
  conservar lo persistido y evitar doble redacción o pérdida de datos.

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
- [ ] Verificar el comportamiento del texto libre basal al reorganizar los bloques.

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

## Límites y conservación

- No borrar estudios, borradores, campos heredados ni correcciones manuales.
- No editar `vendor/doppler/`. No cambiar contratos de Sheets sin una tarea explícita.
- Las tandas no autorizan por sí solas cambios de cortes ni de qué hallazgos van al
  informe. Presentar esas decisiones agrupadas al chat de dirección.
- Conservar las reglas de AGENTS.md: una mención por hallazgo, descripción y
  significado sin conducta terapéutica, cierre permitido y protección de firma/HC.
