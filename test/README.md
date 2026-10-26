# Batería de verificación

Carga `index.html` en jsdom con los cuatro scripts de la app y la ejercita como si
fuera el navegador: completa el formulario, marca el bull's eye, genera el informe y
revisa el texto que sale.

```bash
cd test
npm run setup    # sólo la primera vez
npm test
```

> **jsdom NO se instala acá.** `Documents` está sincronizado con iCloud y los ~2000
> archivos del módulo quedan sujetos a expulsión y re-descarga: medido, `require('jsdom')`
> desde dentro del proyecto tardó **764 segundos**; desde `~/.eco-estres-test`, **2
> milisegundos**. `npm run setup` lo instala ahí. Si lo tenés en otro lado, definí
> `ECO_JSDOM` con la ruta al módulo.

## Qué hay

| Archivo | Qué protege |
|---|---|
| `harness.js` | Carga la app y da los helpers (`casoBase`, `todoNormal`, `informe`, `linea`) |
| `motilidad-reposo.js` | Que la línea de Reposo se lea del bull's eye de reposo y no de la clasificación de respuesta al esfuerzo |
| `medidas-vi.js` | Que una medida implausible del VI no produzca un RWT o una masa con cara de resultado |
| `parrafo-pronostico.js` | Niveles, fusión de extensión, tope y exentos del párrafo pronóstico |
| `barrido.js` | 800 casos al azar contra todas las invariantes a la vez |
| `barra-motilidad.js` | Pincel de grado, grupos por unión, apagado, fase y filtro de vista |
| `drift-grupos.js` | Que `motility-groups.js` no se separe del `motility-model.js` de la app de Doppler |
| `escala-wmsi.js` | Herramienta de medición, no test: compara el WMSI en escala ASE contra la cruda |

## Las invariantes del barrido

Son las que costaron caro. Cada una está porque el bug ya pasó:

- **Coherencia**: el informe no puede afirmar motilidad de reposo normal con segmentos
  anormales cargados, ni decir "sin segmentos comprometidos" con alterados.
- **Viabilidad**: la frase "no cabe esperar recuperación funcional" no puede volver. El
  eco de esfuerzo no es un test de viabilidad.
- **Conducta**: el informe describe el hallazgo y su significado, nunca qué hacer. La
  única fórmula permitida es "Se sugiere correlación clínica". Una indicación escrita y
  firmada deja al médico tratante obligado a justificar por qué no la siguió.
- **Escala del WMSI**: ningún segmento puede pesar más de 4 en el índice.
- **Concordancia**: "El segmento … no modificaron" no puede salir.
- **Estructura**: el bloque de Reposo abre con el método y tiene su párrafo de función
  diastólica.
- **Nada mudo**: un hallazgo informable activo no puede quedarse sin párrafo pronóstico.
- Sin marcadores `{{sin rellenar}}`, sin `undefined`/`NaN` en el texto.

## Nota

El barrido usa puntajes uniformes 0–5, bastante más anormal que la práctica real. Sirve
para encontrar combinaciones que rompen, no para estimar frecuencias clínicas.
