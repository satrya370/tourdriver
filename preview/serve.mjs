// Server statis untuk preview template. Tanpa dependensi.
// Jalankan: npm run preview  →  buka http://localhost:4173/
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8'
};

async function listing() {
  const out = [];
  for (const name of await readdir(join(root, 'templates'))) {
    const files = (await readdir(join(root, 'templates', name))).filter((f) => f.endsWith('.html')).sort();
    out.push(`<h2>${name}</h2><ul>${files.map((f) => `<li><a href="/templates/${name}/${f}">${f}</a></li>`).join('')}</ul>`);
  }
  return `<!doctype html><meta charset="utf-8"><title>Preview</title><body style="font-family:system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem"><h1>Template preview</h1>${out.join('')}</body>`;
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') { res.writeHead(200, { 'content-type': types['.html'] }).end(await listing()); return; }
    path = path.replace(/\.+$/, (m) => (path.endsWith('.html.') ? '' : m)); // tahan titik di akhir URL hasil salin
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return; }
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
}).listen(port, () => console.log(`Preview: http://localhost:${port}/`));
