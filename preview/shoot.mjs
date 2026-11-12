import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, name] of [[390, 'm'], [1280, 'd']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const pg of ['index', 'activities', 'about', 'itinerary']) {
    await p.goto(`http://localhost:4173/templates/sawah/${pg}.html`, { waitUntil: 'networkidle' });
    await p.screenshot({ path: `d:/.agents/Micro Saas/driver-sites/preview/sawah-${pg}-${name}.png`, fullPage: true });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(pg, name, 'horizontal overflow px:', overflow);
  }
}
await b.close();
