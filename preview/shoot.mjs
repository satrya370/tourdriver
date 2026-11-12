// Screenshot template pages. Contoh: TEMPLATE=batu PAGES=index node preview/shoot.mjs
import { chromium } from 'playwright-core';
const tpl = process.env.TEMPLATE || 'sawah';
const pages = (process.env.PAGES || 'index,activities,about,itinerary').split(',');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, name] of [[390, 'm'], [1280, 'd']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const pg of pages) {
    await p.goto(`http://localhost:4173/templates/${tpl}/${pg}.html`, { waitUntil: 'networkidle' });
    // gulir sampai bawah supaya gambar lazy-load ikut termuat
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await p.waitForTimeout(600);
    await p.screenshot({ path: `preview/${tpl}-${pg}-${name}.png`, fullPage: true });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(tpl, pg, name, 'horizontal overflow px:', overflow);
  }
}
await b.close();
