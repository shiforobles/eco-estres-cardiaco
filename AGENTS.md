# Eco Estrés — instrucciones de continuidad

Leer ESTADO_DEL_PROYECTO.md antes de trabajar. Trabajar en la raíz de la copia elegida como principal. Conservar las copias anteriores y no trabajar en varias a la vez.

## Ejecución
Aplicación estática sin instalación ni compilación. Desde la raíz: `node .claude/serve.js` y abrir http://localhost:8753. Detener el servidor al terminar; si el puerto está ocupado, no detener procesos ajenos. Alternativa limitada a este equipo: `python3 -m http.server 8754 --bind 127.0.0.1`.

## Límites
- Revisar rama, cambios locales y estado remoto antes de editar; conservar trabajo ajeno.
- No modificar funcionalidades médicas sin un pedido específico y validación apropiada.
- No subir a main, fusionar ni publicar sin autorización explícita: GitHub Pages publica desde main.
- No incluir credenciales, ajustes privados ni datos de pacientes en commits o documentación pública.
- No eliminar la copia anterior ni modificar otras aplicaciones.
- Trabajar desde rutas relativas a esta raíz; no asumir acceso a chats o documentos privados.

## Comprobaciones
`node --check app.js`, `node --check report-templates.js`, `node --check pearls.js` y `node --check sheets-storage.js`. Abrir una vista previa en un perfil limpio y probar ejemplos incorporados sin pacientes reales ni envíos a Google Sheets. No se encontró una suite de pruebas automatizadas en este repositorio. Una prueba de carga y generación no certifica exactitud clínica.

Claude Code, Antigravity y Work deben abrir esta misma carpeta y leer estas instrucciones y el estado. No asumir que todos cargan AGENTS.md automáticamente. Un solo agente modifica archivos a la vez.

## Continuidad entre herramientas
Abrir esta misma raíz en Claude Code, Antigravity y Work. Claude dispone de CLAUDE.md como entrada; en otras herramientas pedir explícitamente que lean AGENTS.md y ESTADO_DEL_PROYECTO.md. No crear instrucciones duplicadas por herramienta.
La documentación de esta etapa se respalda en `docs/continuidad-agentes`. Verificar la rama activa antes de trabajar y no fusionar con main sin autorización. Los historiales de chat, sesiones, autenticación y permisos no se transfieren con estos documentos.
