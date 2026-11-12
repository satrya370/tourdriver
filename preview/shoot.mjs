// Screenshot template pages. Contoh: TEMPLATE=batu PAGES=index node preview/shoot.mjs
import { chromium } from 'playwright-core';
const tpl = process.env.TEMPLATE || 'sawah';
const pages = (process.env.PAGES || 'index,activities,about,itinerary').split(',');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, name] of [[390, 'm'], [1280, 'd']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const pg of pages) {
    await p.goto(`http://localhost:4173/templates/${tpl}/${pg}.html`, { waitUntil: 'networkidle' });
    await p.screenshot({ path: `preview/${tpl}-${pg}-${name}.png`, fullPage: true });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(tpl, pg, name, 'horizontal overflow px:', overflow);
  }
}
await b.close();
