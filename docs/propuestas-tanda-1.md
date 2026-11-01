# Propuestas para revisión — no implementadas

Esta tanda cambia únicamente la descripción de motilidad por grados. No cambia el
diastólico ni la entrada o las inferencias del Motor C. Tampoco cambia los cortes,
las exclusiones, la evaluabilidad ni el reparto de los cuadros OSECAC.

## Diastólico: textos exactos propuestos

Las reglas numéricas siguen siendo las actuales, identificadas en la app como ASE
2016 pendiente de actualización. Los siguientes textos requieren aprobación antes
de sustituir la salida actual. Una evaluación indeterminada no se transforma en
negativa ni positiva por el cambio de vocabulario.

### No realizado

Identificar ausencia total de mediciones post-esfuerzo, sin una corrección manual
que diga otra cosa. El reposo por sí solo no demuestra que se haya hecho el test.

- Pantalla: **Estudio diastólico de esfuerzo: No realizado.**
- Copiloto, sólo si existe el perfil que actualmente activa la sugerencia:
  **No se registraron mediciones diastólicas post-esfuerzo. Evaluación pendiente de
  realizar o consignar.** A continuación, los fundamentos ya calculados, por
  ejemplo: **E/e' en reposo de 12,5.**
- Informe largo y cuadro Esfuerzo OSECAC:
  **Estudio diastólico de esfuerzo: No realizado.**

### Evaluación incompleta

Hay mediciones post-esfuerzo, pero faltan componentes necesarios. La lista debe
nombrar entradas crudas ausentes, no exigir introducir el cociente calculado.
Ejemplo: se cargaron E y e' post, pero no VRT.

- Pantalla: **Evaluación diastólica de esfuerzo incompleta: falta la VRT
  post-esfuerzo.**
- Copiloto: **Hay mediciones diastólicas post-esfuerzo, pero falta la VRT
  post-esfuerzo para completar la evaluación. No corresponde clasificarla como
  negativa.**
- Ambos informes: **Estudio diastólico de esfuerzo: Evaluación incompleta por falta
  de la VRT post-esfuerzo; no permite una clasificación concluyente.**

Si falta el cociente, especificar si falta onda E o e' post. Si el cálculo actual
devuelve indeterminado por ausencia de una medición basal, mostrar el dato faltante
sin convertir silenciosamente el veredicto. Debe aprobarse en dirección si ese caso
se rotulará incompleto o indeterminado con datos faltantes; no se cambia la regla
de clasificación en esta tanda.

### Indeterminado con mediciones disponibles

Ejemplo del diagnóstico: E/e' basal 12,5, post 8 y VRT post 2,5 m/s. No satisface
los criterios actuales completos de positividad ni los de normalidad.

- Pantalla: **Estudio diastólico de esfuerzo: Indeterminado. Las mediciones no
  cumplen criterios completos de positividad ni de normalidad.**
- Copiloto: **Evaluación diastólica realizada, con resultado indeterminado.
  E/e' basal 12,5; post-esfuerzo 8; VRT post-esfuerzo 2,5 m/s. No es un estudio
  pendiente de medir.**
- Ambos informes: **Estudio diastólico de esfuerzo: Indeterminado; las mediciones
  disponibles no permiten una clasificación concluyente con los criterios
  aplicados.**

### Negativo

- Pantalla: **Estudio diastólico de esfuerzo: Negativo.** Los criterios numéricos
  cumplidos continúan visibles debajo.
- Copiloto: sin aviso de estudio pendiente; no agregar una alerta de normalidad.
- Ambos informes, conservando el texto actual: **Estudio diastólico de esfuerzo:
  Negativo, sin aumento de las presiones de llenado con el esfuerzo.**

### Positivo

- Pantalla: **Estudio diastólico de esfuerzo: Positivo.** Los criterios numéricos
  cumplidos continúan visibles debajo.
- Copiloto: no mostrar evaluación pendiente. Si se decide mostrar el hallazgo:
  **Estudio diastólico de esfuerzo positivo según los criterios aplicados, con
  aumento de las presiones de llenado inducido por el ejercicio.**
- Ambos informes, conservando el texto actual: **Estudio diastólico de esfuerzo:
  Positivo, con aumento de las presiones de llenado inducido por el ejercicio.**

Las conclusiones conservarían el resultado efectivo —manual o calculado— y las
ramas actuales. No deducir ICFEp por añadir un nuevo rótulo. Cualquier revisión de
esa interpretación o actualización a ASE 2025 queda fuera de esta propuesta.

### Correcciones manuales antiguas y procedencia

1. Leer y conservar el valor guardado y `corregidos.diast_resultado`. No borrar la
   bandera ni recalcular encima de una corrección antigua.
2. Separar cálculo actual y resultado efectivo. Proponer metadatos aditivos de
   origen: `calculado`, `manual` o `manual_legacy`, con el valor original. Si no se
   guardó fecha o autor de la corrección, no inventarlos.
3. Mostrar la discrepancia: **Corrección manual conservada del estudio previo:
   «No evaluado». Cálculo actual: negativo. Revisar la diferencia.** Dar una acción
   explícita para conservarla o volver al cálculo, sin selección automática.
4. El antiguo «No evaluado» es ambiguo: no migrarlo automáticamente a «No
   realizado». Hasta resolverlo, proponer en ambos informes: **Estudio diastólico
   de esfuerzo: «No evaluado», según corrección manual conservada del registro
   previo; su significado requiere revisión.**
5. Una corrección no debe decir «según el algoritmo». Guardar la procedencia en
   borrador e historial y respetarla en las dos salidas. No cambiar DRAFT_VERSION
   para descartar estudios: una eventual migración debe ser aditiva y compatible.
6. Antes de modificar valores exportados, acordar compatibilidad con Sheets y
   dashboard. Esta tanda no modifica ninguno.

## Motor C: conversión propuesta, sin aplicar

El adaptador de estrés entrega actualmente sus puntajes 1–5 directamente al Motor
C, que interpreta la escala Doppler 1–4. Motor A5 sí tiene su adaptación de nombres
y severidad. La conversión debe aplicarse sólo a la copia de datos de entrada al C:

| Puntaje de estrés | Significado | Entrada propuesta al C |
|---|---|---:|
| 0 | No evaluado | 1, como hace hoy el adaptador; conservar su condición de no evaluado fuera del C |
| 1 | Normal | 1 |
| 2 | Hipoquinesia leve | 2 |
| 3 | Hipoquinesia moderada | 2 |
| 4 | Aquinesia | 3 |
| 5 | Disquinesia | 4 |

El 0 no pasa a ser clínicamente normal por esa compatibilidad textual. Revisar su
semántica es otro trabajo: no cambiar aquí evaluabilidad ni exclusiones. El ápex
17 continúa fuera del C; las exclusiones vigentes se aplican antes. No mutar WM ni
la copia 1–5 que recibe A5. No editar `vendor/doppler/`.

Los casos preparados están en `test/fixtures/motor-c-escala-pendiente.json`. Son
especificación para revisión, no pruebas activadas: el caso que hoy produce la
atribución falsa debe seguir denunciándose hasta que se apruebe la corrección.

### Frases que puede agregar el C y qué las activa hoy

Todo sale por `textoDopplerReposo()`, sólo al elegir el motor Doppler y salvo la
supresión de territorio en patrón apical propio. No gobierna la conclusión de
isquemia ni la comparación de fases.

| Frase/patrón | Activación en el motor vendorizado |
|---|---|
| «distribución compatible con miocardiopatía chagásica (aneurisma apical con compromiso inferobasal)» | Segmento 13 con score Doppler 4, alguno de 4/5 alterado, al menos dos arterias y como máximo dos medios alterados. Tiene prioridad sobre los otros patrones. Hoy recibe erróneamente el 4 de aquinesia de estrés. |
| «compromiso global, compatible con miocardiopatía dilatada» | Todos los alterados dentro de 1–16 y cobertura ≥90 % de ese conjunto. |
| «patrón apical con bases respetadas, compatible con miocardiopatía por estrés (Takotsubo)» | Todos los alterados dentro de 7–16 y cobertura ≥90 % de esos diez segmentos. |
| «compromiso septal, compatible con disincronía (BCRI, estimulación por marcapasos o post-quirúrgica)» | Todos los alterados dentro de 2/3/8/9/14 y cobertura ≥90 % de ese conjunto. Las exclusiones de estrés pueden impedir que llegue ese patrón al C. |
| «compatible con territorio de la descendente anterior distal» | Sin patrón anterior reconocido; al menos dos segmentos DA alterados, extensión fuera de DA exclusivamente apical y conteo DA no inferior a la extensión. |
| «distribución compatible con territorio DA/CD/Cx» | Alterados en una arteria, o dominante cuyos territorios menores no superan el filtro. |
| «distribución compatible con territorio X con extensión a territorio Y…» | Dominante estrictamente >1,5 veces el segundo; los menores admitidos cumplen ≥2 segmentos y ≥30 % del total. Con total ≤4 se admiten menores sin ese filtro. |
| «distribución compatible con territorios X y Y» | Dos territorios admitidos sin dominancia suficiente. |
| «compromiso multiterritorial» | No hay dominancia clara y hay tres territorios admitidos según el conteo/filtro del C. |

Cuando varios patrones coinciden, se prioriza cobertura y luego el conjunto más
específico. No se modifican estas condiciones ahora. Aprobar desde dirección si el
C debe añadir etiología o limitarse a territorio: corregir la conversión puede
quitar falsos patrones y habilitar otros que antes se omitían. Ninguno de esos
cambios se activa con esta tanda.

## Decisiones de la corrección implementada

- El motor propio agrupa por puntaje exacto, de mayor a menor severidad, y enumera
  los segmentos de cada grupo. Distingue leve/moderada, como A5 ya hacía.
- La vista previa y el reposo usan la misma descripción. Las ramas de isquemia
  única, multiterritorial e hipotensiva conservan la correspondencia grado/segmento.
- Se reutilizan las piezas existentes de informe. No cambia el orden del informe
  largo ni el reparto OSECAC; sus textos compartidos reciben la corrección de
  grados.
- Sólo se actualizan los identificadores de caché de los dos scripts cambiados;
  no se modifican claves, versiones ni contenido del almacenamiento de estudios.
