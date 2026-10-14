# Eco Estrés — continuidad del proyecto

Actualizado: 14 de octubre de 2026.
Repositorio: https://github.com/shiforobles/eco-estres-cardiaco

## Versión y publicación
La base de esta documentación es el commit 304648e2d0c1610e5204641a5934128c91485a80, respaldado en backup/eco-estres-20261011-074819. main remoto estaba en 9202a6bc437a6a42cd4020c58f02318e8c63eade al verificar la migración. El commit adicional reorganiza método, hemodinamia y función diastólica del informe. GitHub Pages publica desde main; no subir ni fusionar cambios allí sin autorización.
La rama docs/continuidad-agentes conserva estas notas, además de esa base respaldada. Para recuperar esta etapa seleccionar esa rama y leer AGENTS.md. No confundirla con la versión publicada.

## Migración y pruebas realizadas
Se copió el proyecto a la ubicación principal elegida por el propietario, conservando la copia anterior. Los 146 archivos, incluido .git, se compararon mediante SHA-256. Git fsck no detectó corrupción; dos commits sin referencias preexistentes se conservaron.
Pasaron las comprobaciones de sintaxis de los cuatro JavaScript principales. En navegador aislado, bloqueando conexiones externas, se generaron informes con los ejemplos negativo_normal e isquemia_da sin errores JavaScript. Se comprobó carga a tamaño móvil, sin auditoría visual exhaustiva.
No se validaron clínicamente los cálculos ni se probaron envíos a Google Sheets. Los datos y ajustes del navegador dependen del perfil y de la dirección/puerto utilizados; no se migraron mediante la copia del repositorio.

## Configuración entre agentes
- Claude Code: las dos referencias configurables de edición y escritura se actualizaron en los ajustes locales de la nueva copia. Se mantuvieron los demás permisos. launch.json y serve.js ya usan rutas relativas. Los ajustes privados no forman parte de esta documentación pública.
- Antigravity: se abrió y verificó la nueva carpeta como espacio de trabajo. El agente requiere iniciar sesión; no se cambiaron credenciales ni se ejecutaron tareas del agente.
- Work: el registro del proyecto todavía apunta a la copia anterior. Pendiente seleccionar la carpeta principal en la interfaz; el control automatizado de esa interfaz no está disponible.
- Los historiales antiguos de las herramientas se conservan; para nuevo trabajo abrir la copia principal y leer estas notas. No se trasladan sesiones de forma implícita.

## Pendientes
Completar la selección de carpeta en Work y el inicio de sesión de Antigravity. Antes de cada tarea, comprobar que todas las herramientas trabajan en la misma raíz y evitar ediciones simultáneas.
Validar las integraciones externas y los cálculos clínicos en una etapa específica. No se configuraron automatizaciones. El manual general permanece en versión 3, pendiente de actualización cuando se cierre la configuración.
