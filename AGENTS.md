# Eco Estrés Cardíaco

App web de ecocardiograma de estrés. HTML/CSS/JS puro, sin frameworks ni build.

## Forma de trabajo

Cuando Lucas pide algo, se hace **completo de punta a punta**, sin pedir aprobación
del plan ni hacer preguntas en el medio. Si aparece una decisión, se toma **la opción
más conservadora clínicamente** y se sigue.

Al terminar, siempre:

1. Correr la batería y el barrido (`cd test && npm test`).
2. Verificar en el navegador.
3. Commit y push a `main`.
4. Un resumen corto con: **qué se hizo**, **qué decisiones se tomaron por cuenta
   propia** —para que Lucas las revise— y **qué tiene que probar él**.

### Cuándo sí frenar y preguntar

Sólo dos casos:

- Algo que pueda **borrar datos o estudios guardados**.
- Algo que cambie un **criterio clínico ya validado**: cortes, umbrales, o qué va y
  qué no va al informe.

## Reglas del informe

Estas no se cambian sin consultar. Cada una está porque el error ya pasó.

- **El informe describe el hallazgo y su significado, nunca la conducta.** Una
  indicación escrita y firmada deja al médico tratante obligado a justificar por qué
  no la siguió, y el que trata es él. La única fórmula de cierre permitida es
  "Se sugiere correlación clínica".
- **"No evaluado" no es "normal".** Sin territorios evaluables no hay rama negativa
  ni cifra pronóstica.
- **El eco de esfuerzo no evalúa viabilidad.** La ausencia de mejoría con el esfuerzo
  no descarta miocardio hibernado.
- **La motilidad de reposo se lee de los puntajes de reposo**, nunca de la
  clasificación de respuesta al esfuerzo.
- **Una mención por hallazgo.** Si el veredicto ya lo dijo, el párrafo pronóstico no
  lo repite.
- **El tono es "se sugiere", nunca directivo**: el clínico que deriva es quien
  prescribe.
- **Los criterios propios se declaran como tales** en pantalla: DP <20.000, HRR₁ ≤6
  y el umbral de segmentos sin par por territorio no son cortes de guía.

## Datos del paciente

- La firma (nombre y matrícula) **nunca** se versiona ni se commitea.
- A la planilla va **sólo el identificador de HC**, nunca el nombre.

## Contratos que no pueden separarse

- `sheets-storage.js` ↔ `apps-script-unificado.gs`: mismo listado de columnas.
  Lo vigila `test/contrato-planilla.js`.
- `vendor/doppler/` es copia byte a byte de la app de eco Doppler. **No se edita**:
  lo propio va en `motility-estres.js`. Lo vigila `test/drift-motores.js`.
- `motility-groups.js` deriva del modelo de Doppler con dos excepciones
  documentadas. Lo vigila `test/drift-grupos.js`.

## Tests

```bash
cd test
npm run setup   # sólo la primera vez
npm test
```

`jsdom` se instala **fuera** del proyecto: `Documents` está sincronizado con iCloud y
el módulo queda inutilizable adentro (medido: `require` de 764 segundos contra 2
milisegundos). Ver `test/README.md`.
