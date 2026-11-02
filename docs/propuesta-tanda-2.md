# Tanda 2 — diagnóstico y propuesta conjunta

Estado: **para decidir; sin implementación**. Código revisado en `728fbfd`.
Los criterios descritos son los que ejecuta la app, no una validación nueva de guía.
No se actualiza a ASE 2025, no se cambia Motor C ni el segundo formato.

## 1. Geometría ventricular

Circuito: `app.js`, `medidasVI()` → `calcGeometria()` → `sugerir()` →
`geometria_vi` → `recolectarHallazgos()` → `bloqueReposo()` y salida OSECAC.

Datos: DDVI, SIV y PP en **mm**; peso/altura para superficie corporal de Du Bois;
sexo para el corte de masa. Fórmula actual de masa en cm:
`0,8 × 1,04 × [(DDVI + SIV + PP)^3 − DDVI^3] + 0,6`.
RWT = 2 × PP/DDVI. Masa indexada = masa/superficie.
Cortes actuales: IMVI >115 varón o >95 mujer; RWT >0,42. Cuatro combinaciones:
normal, remodelado concéntrico, HVI concéntrica, HVI excéntrica. Se conservan
rangos de plausibilidad y protección por confusión cm/mm de `problemasMedidasVI()`.

El selector ya se autocompleta; cambiarlo marca `corregidos.geometria_vi` y frena
la escritura automática. Los números y criterios se siguen calculando.
**Falla adicional reproducida:** tras obtener geometría normal, borrar DDVI deja
`imvi=null` pero el selector sigue normal: `sugerir(undefined)` sólo cambia la nota.
Un automático previo no debe presentarse como vigente con mediciones incompletas.

Propuesta: panel con **resultado calculado**, cifras, cortes y faltantes; acción
secundaria **Corregir interpretación** que despliega el selector existente. Si hay
corrección, mostrar además **Resultado utilizado: … — corrección manual** y
**Volver al cálculo**. No quitar el ID ni cambiar valores persistidos. Si faltan
medidas, cálculo = no clasificable por datos incompletos; sólo retirar el resultado
automático obsoleto, conservando y señalando cualquier corrección manual.
Ejemplo: «Geometría calculada: remodelado concéntrico. IMVI 90 g/m² ≤115;
RWT 0,45 >0,42». Con corrección: «Resultado utilizado: HVI concéntrica
(corrección manual). El cálculo propone remodelado concéntrico».

## 2. Diastología basal

Circuito: `datosDiastolicos()` → `clasificarDiastolica()` →
`autocompletarDiastolicaReposo()` → `diast_grado` →
`bloqueDiastolicaReposo()`. `calcDiastolico()` actualiza cocientes y criterios.
Entradas: E, A, e' septal/lateral, VRT, volumen AI, peso, altura y FEy.
E/e' usa promedio con ambos e'; con uno usa ese. LAVi usa Du Bois.

Reglas actuales, a conservar:
- FEy <50% entra directamente en graduación; de lo contrario evalúa e' reducido
  (septal <7 o lateral <10), E/e' >14, VRT >2,8 y LAVi >34.
- Menos de 3 criterios disponibles: grado null. Menos de la mitad positivos:
  normal; exactamente mitad: indeterminada; más de mitad: graduación.
- Graduación: E/A ≤0,8 y E ≤50 → I; E/A ≥2 → III.
  Zona intermedia: presión de llenado por los tres criterios; menos de dos
  disponibles o empate de dos → indeterminada; ≥2 positivos → II; resto → I.
- Sin E/A: null con FEy reducida, indeterminada en la otra vía de graduación.

Estados: no clasificable por datos insuficientes (null), normal, I, II, III,
indeterminada; esta última puede incluir faltantes o empate. No exigir todos los
campos para las vías que el motor ya puede resolver. FEy ausente hoy entra por la
vía no reducida: no reinterpretarlo como prueba de FEy conservada.

Problemas de conexión/presentación: el mismo `sugerir(undefined)` permite conservar
un grado automático previo tras perder datos. El informe sólo nombra explícitamente
I–III; el rótulo indeterminado no se expone de forma equivalente. Proponer panel
calculado/efectivo y corrección secundaria igual a geometría. El informe debe
nombrar el estado efectivo con su origen; esos nuevos textos requieren aprobación.
Ejemplos: «Función diastólica en reposo: indeterminada con los criterios aplicados»;
«Función diastólica en reposo: no clasificable por datos insuficientes; falta la
onda A» (sólo cuando esa entrada impide la vía actual).

### Texto libre basal: conservar

`reposo_libre` llega a `H.reposoLibre`; `construirNarrativa()` lo usa como
`piezas.reposoEco` en lugar de `bloqueReposo()`. Sustituye redacción, no datos.
Puede contener prótesis, cavidades derechas, morfología, hallazgos Doppler y
contexto que el motor no calcula. No es reemplazable por geometría/diastología.
Hoy se siguen agregando aparte volúmenes y diastología; OSECAC agrega también
medidas, valvulopatía y PSAP. Puede haber duplicaciones o contradicción con texto
pegado. Recomiendo conservarlo y advertir en pantalla que el cálculo permanece
activo; no recortar ni reinterpretar automáticamente el texto. La reconciliación
del informe corresponde a tanda 4, con ejemplo aprobado.

## 3. Diastólico de esfuerzo

Motor: `evaluarDiastolicoEsfuerzo()`; conexión: `pintarDiastolicoEsfuerzo()` →
`autocompletarDiastolico()` → selector oculto `diast_resultado` (`index.html`).
El motor devuelve insuficiente, indeterminado, negativo o positivo.
Positivo actual exige conjuntamente E/e' post promedio >14 (alternativa aislada
>15), VRT post >2,8 y e' septal basal <7. Negativo exige E/e' basal y post <10
más VRT post <2,8. Resto indeterminado; sin E/e' post o VRT, insuficiente.

**Reproducido en arnés y navegador:** E basal 100, e' septal/lateral 8/8;
E post 80, e' post 10/10; VRT post 2,5. Calculado/pantalla: indeterminado.
Campo oculto: no_evaluado. Informe: «No evaluado». Copiloto: estudio sin evaluar.
Causa: conversión explícita en `pintarDiastolicoEsfuerzo()`; además el selector
sólo admite no_evaluado/negativo/positivo. No alcanza con quitar el ternario.
`construirNarrativa()` sólo reconoce negativo/positivo y usa No evaluado como
fallback. `evaluarAvisosClinicos()` se guía por ese campo degradado. OSECAC comparte
la pieza; `sheets-storage.js` exporta el texto de ese selector.

Propuesta: separar **cálculo**, **completitud** y **resultado efectivo/origen** en
una única resolución compartida. No realizado/incompleto son estados de registro,
no nuevos umbrales clínicos. Falta basal que impide una conclusión: conservar
indeterminado del motor y explicitar la medición ausente. No exigir un dato basal
si la rama negativa vigente no lo necesita. No inventar una normalidad.

### Textos exactos propuestos (pendientes)

| Estado | Pantalla | Informe largo y Esfuerzo OSECAC |
|---|---|---|
| Sin mediciones post registradas | Estudio diastólico de esfuerzo: No realizado/consignado. | Estudio diastólico de esfuerzo: Sin mediciones post-esfuerzo registradas; no permite evaluación. |
| Datos post parciales | Evaluación diastólica de esfuerzo incompleta: falta la VRT post-esfuerzo. | Estudio diastólico de esfuerzo: Evaluación incompleta por falta de la VRT post-esfuerzo; no permite una clasificación concluyente. |
| Indeterminado | Estudio diastólico de esfuerzo: Indeterminado. | Estudio diastólico de esfuerzo: Indeterminado; las mediciones disponibles no permiten una clasificación concluyente con los criterios aplicados. |
| Negativo | Estudio diastólico de esfuerzo: Negativo. | Estudio diastólico de esfuerzo: Negativo, sin aumento de las presiones de llenado con el esfuerzo. |
| Positivo | Estudio diastólico de esfuerzo: Positivo. | Estudio diastólico de esfuerzo: Positivo, con aumento de las presiones de llenado inducido por el ejercicio. |

Sin mediciones no demuestra que no se haya realizado; por eso propongo «sin
mediciones registradas» en el informe, en vez de afirmar categóricamente No realizado.
Faltantes se expresan en entradas crudas: onda E, e' tisular, VRT y fase; no pedir
cargar manualmente un E/e' calculado. Si falta una basal impeditiva, añadir:
«Falta e' septal basal para completar los criterios aplicados», manteniendo el
resultado indeterminado. La lista es dinámica, no una frase fija para todos.

Copiloto:
- Sin mediciones: mantener el perfil disparador actual; «Sin mediciones diastólicas
  post-esfuerzo registradas, con E/e' basal de 12,5. Revisar si se realizaron y
  falta consignarlas». Sin alerta si el perfil actual no la activa.
- Incompleto: «Evaluación iniciada; falta la VRT post-esfuerzo para completar la
  clasificación». Una sola alerta específica, sin llamarlo estudio sin realizar.
- Indeterminado: «Evaluación realizada con resultado indeterminado: E/e' basal
  12,5; post 8; VRT post 2,5 m/s. No cumple criterios completos de positividad
  ni de normalidad». Panel explicativo, no aviso de pendiente.
- Negativo/positivo: sin aviso de pendiente; positivo conserva su hallazgo actual
  y las ramas existentes. No cambiar riesgo, diagnóstico de ICFEp ni conclusión
  etiológica en esta corrección de conexión.

## 4. Datos antiguos y procedencia

`captureFields()`, `saveDraft()`, captura de historial y `aplicarEstudio()` conservan
valores + `corregidos`; la bandera se restaura antes del recálculo.
**La corrección manual g2 sobrevivió a guardar/recuperar en el arnés.**
No hay fecha/autor ni copia separada del valor original de una corrección.

Propuesta aditiva, sin subir DRAFT_VERSION ni borrar registros:
1. Conservar IDs/valores y banderas; guardar por separado origen, valor heredado y
   decisión posterior. No fabricar autor/fecha histórica.
2. Si hay bandera, el resultado efectivo sigue siendo el manual, también si falta
   soporte numérico. Mostrar cálculo actual por separado, nunca atribuir el manual
   al algoritmo. Conservar corrección/Volver al cálculo son acciones explícitas.
3. «No evaluado» manual antiguo: conservar literal y señalar ambigüedad. Pantalla:
   «Corrección manual conservada: No evaluado. Cálculo actual: indeterminado.
   Revisar significado». Informe propuesto: «Estudio diastólico de esfuerzo:
   No evaluado, según corrección manual conservada del estudio previo».
4. Sin bandera no se puede probar intención manual: guardar el valor heredado
   antes de recalcular, mostrar diferencias y ofrecer recuperar ese valor como
   corrección. No perderlo silenciosamente ni atribuirle origen conocido.
5. Informes ya guardados/editados permanecen intactos; nada de regeneración masiva.
   Si hay corrección manual incompatible con el cálculo, el aviso dice discrepancia,
   no estudio pendiente. Nuevos informes usan el resultado efectivo y su origen.

## 5. Conexión frente a criterio clínico

**Corrección técnica propuesta:** conservar indeterminado, evitar fallback genérico,
resolver calculado/efectivo en un lugar, avisos por estado real, retirar automáticos
obsoletos sin borrar manuales, preservar procedencia y paneles automáticos.
**Contenido a aprobar:** textos de la tabla y basal, manejo visible de legacy manual,
valores efectivos en informe y valor textual nuevo en la columna diastólica existente.
Sheets: no añadir/reordenar columnas; revisar contrato y consumidores antes de admitir
nuevos valores en esa columna. Script y dashboard no se modifican en esta etapa.

**Fuera de alcance clínico, registrar para tanda 5:** el motor de esfuerzo trata el
e' lateral aislado como si fuera septal para corte/etiqueta; FEy ausente no bloquea
la vía basal no reducida; la ayuda introductoria visible de esfuerzo menciona
PSAP >50/e' de ejercicio y no describe los tres criterios que realmente ejecuta el
motor. No cambiar cortes ni indicar ASE 2025 resuelto por corregir estas conexiones.

Presión pulmonar/VD: `psapSugerida()` usa 4 × VRT basal² + PAD asumida de 5;
`pp_reposo` admite corrección manual y alimenta informe/EAo. No retirarlo sin
reemplazo; VD conserva selector/texto e informe, sin agregar TAPSE/S'/FAC. Resolver
su presentación aparte, sin alterar supuestos en esta implementación.

## 6. Única lista de decisiones para Lucas

1. **Paneles automáticos de geometría y diastología basal**, con criterios visibles
   y corrección secundaria que manda. Recomiendo sí, incluyendo retirar sólo el
   automático obsoleto cuando se pierden mediciones necesarias.
2. **Cinco estados de registro/salida de esfuerzo** con los textos exactos anteriores;
   falta basal impeditiva mantiene indeterminado con explicación. Recomiendo sí;
   conservar todos los cortes actuales y usar «sin mediciones registradas».
3. **Correcciones antiguas visibles y preservadas**, incluso No evaluado ambiguo;
   conservar cálculo y efectivo separados. Recomiendo sí; sin migración destructiva
   ni regeneración de informes históricos.
4. **Conservar texto libre basal** y controles PP/VD, sin expansión ni recorte.
   Recomiendo sí; su conciliación narrativa queda para tanda 4.
5. **Propagar estados a ambas salidas y columna diastólica existente de Sheets**, sin
   cambiar columnas, y mantener el resto de diagnóstico/riesgo. Recomiendo sí tras
   probar consumidores; nuevo vocabulario requiere aprobación junto a los textos.

## 7. Implementación posterior y pruebas necesarias

Archivos previstos: `app.js`, `index.html`, `styles.css`, `report-templates.js`;
regresiones nuevas en `test/` y lista central. Revisar lectura de la columna en
`sheets-storage.js` y contrato, sin editar vendor ni motores de motilidad.
Casos: cada geometría y ambos sexos; borrar una medida tras clasificar; valor
implausible; basal normal/I/II/III/empate/incompleto; esfuerzo sin datos/parcial/
indeterminado/negativo/positivo, límites exactos y basal faltante; promedio/aislado;
manual antiguo positivo/negativo/No evaluado y sin bandera; borrador/historial;
texto libre presente sin modificar hallazgos; coherencia pantalla/copiloto/ambos
informes/Sheets; preservación de informes editados y diagnósticos no relacionados.
Al implementar: batería completa, ambos barridos y navegador PC.

Verificación del diagnóstico: reproducción con datos ficticios en arnés y navegador
PC (pantalla Indeterminado/campo no_evaluado); comprobación de geometría obsoleta
y recuperación de corrección basal en arnés. `cd test && npm test` terminó con
código 0: batería sin fallas y barridos 800/400 sin fallas. La batería actual pasa
sin cubrir la pérdida de indeterminado; se necesita la regresión específica al
implementar. Este commit sólo añade/actualiza documentación.
