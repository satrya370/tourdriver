// Memeriksa tautan internal: file tujuan ada, dan #anchor ada di file tujuan. Contoh: TEMPLATES=sawah,batu node preview/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';
const templates = (process.env.TEMPLATES || 'sawah,batu,segara,endek').split(',');
let problems = 0;
for (const t of templates) {
  const dir = path.join('templates', t);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url) || url.startsWith('//')) continue;
      const [file, hash] = url.split('#');
      const target = file ? path.join(dir, file) : path.join(dir, f);
      if (!fs.existsSync(target)) { console.log(`MISSING  ${t}/${f} -> ${url}`); problems++; continue; }
      if (hash && target.endsWith('.html')) {
        const th = fs.readFileSync(target, 'utf8');
        if (!th.includes(`id="${hash}"`)) { console.log(`NO ANCHOR ${t}/${f} -> ${url}`); problems++; }
      }
    }
  }
}
console.log(problems ? `${problems} problem(s)` : 'all internal links ok');
