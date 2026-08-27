// Servidor estático mínimo para previsualizar la app (solo para desarrollo).
const http = require('http');
const fs = require('fs');
const path = require('path');

// La raíz es la carpeta del proyecto, resuelta desde este archivo:
// así el servidor sigue funcionando si el proyecto se mueve de lugar.
const ROOT = path.resolve(__dirname, '..');
const PORT = 8753;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
      // Sin esto el navegador puede servir una mezcla de archivos viejos y nuevos,
      // y los botones fallan en silencio.
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.end(data);
  });
}).listen(PORT, () => console.log('Preview en http://localhost:' + PORT));
