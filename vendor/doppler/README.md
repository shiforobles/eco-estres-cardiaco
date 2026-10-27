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
