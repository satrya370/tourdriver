// Memeriksa semua <img> pada halaman template: terunduh atau rusak. Contoh: TEMPLATES=endek,segara node preview/check-images.mjs
import { chromium } from 'playwright-core';
const templates = (process.env.TEMPLATES || 'sawah,batu,segara,endek').split(',');
const b = await chromium.launch({ channel: 'msedge' });
for (const t of templates) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(`http://localhost:4173/templates/${t}/index.html`, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } window.scrollTo(0, 0); });
  await p.waitForTimeout(800);
  const imgs = await p.evaluate(() => [...document.images].map((i) => ({ src: i.getAttribute('src').split('/').pop(), ok: i.complete && i.naturalWidth > 0 })));
  const bad = imgs.filter((i) => !i.ok);
  console.log(t, 'images:', imgs.length, 'broken:', bad.length, bad.map((i) => i.src).join(', '));
  await p.close();
}
await b.close();
