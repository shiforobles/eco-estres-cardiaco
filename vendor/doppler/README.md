# vendor/doppler

Copia **sin modificar** de tres archivos de `App Calculadora Ecodoppler Cardiaco/js/`:

| Archivo | Qué es |
|---|---|
| `motility-model.js` | Anatomía: segmentos, paredes, columnas, vistas, vecinos |
| `motility-engine.js` | **Motor A** — redacción anatómica de la motilidad |
| `territory-engine.js` | **Motor C** — atribución de territorio coronario |

Son funciones puras: reciben `{segmentId: score}` y devuelven texto. No tocan el DOM.

## Por qué copiados y no importados

Las dos apps son estáticas, sin build ni paquetes: no hay forma de importar entre
carpetas. `test/drift-motores.js` compara byte a byte contra los originales y falla si
divergen; si la app de Doppler no está en la computadora, se saltea.

**No editar nada de acá.** Todo lo propio de eco estrés —los cinco grados, el ápex, la
fase— vive en `motility-estres.js`, que hereda de estos motores sin modificarlos.

## Actualizar

Copiar los tres archivos de nuevo y correr `npm run drift` para confirmar que quedaron
idénticos. Después `npm test`, porque un cambio de redacción en el Motor A cambia el
texto del informe.

## Pendientes para la app de Doppler

Se arreglan **allá**, que es la fuente, y después se recopia acá. No se parchean en
`motility-estres.js`: eso haría que las dos apps redacten distinto.

### Motor A enumera en los casos extensos en vez de agrupar por pared

Con pocos segmentos agrupa muy bien —"de las paredes anterior y anteroseptal, a nivel
basal y medio"— pero a partir de cierta extensión se rinde y enumera. Con 12 segmentos
aquinéticos anteriores, septales, inferiores y apicales devuelve:

> Aquinesia de predominio apical con extensión de los segmentos anterior basal,
> anteroseptal basal, inferoseptal basal, inferior basal, anterior medio, anteroseptal
> medio, inferoseptal medio e inferior medio, con aquinesia del ápex.

Lo que debería leerse:

> Aquinesia de las paredes anterior, anteroseptal, inferoseptal e inferior a nivel basal
> y medio, y de la totalidad del casquete apical.

Dos cosas: la enumeración de ocho segmentos donde hay cuatro paredes completas, y lo
apical dicho dos veces ("predominio apical" y después el ápex).

**Mientras tanto**, en eco estrés el selector por estudio lo cubre: texto de Doppler
para los casos de pocos segmentos, texto propio para los extensos.

### Diferencia de criterio en el patrón apical puro

Motor C lo atribuye a la descendente anterior distal. Eco estrés **no le asigna vaso**:
un ápex comprometido puede ser Takotsubo, miocardiopatía hipertrófica apical o DA
envolvente, y es coherente con excluir el 17 del territorio y del WMSI.

No es un bug de Doppler —su atribución está hedgeada— sino una decisión distinta. En
eco estrés manda la propia, con cualquiera de los dos motores; está implementado en
`textoDopplerReposo()`.
