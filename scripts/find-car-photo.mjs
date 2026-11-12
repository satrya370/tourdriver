// Mencari foto mobil (Toyota Innova/Kijang) berlisensi bebas di Wikimedia Commons. Hasil ke research/photos/car.json
import fs from 'node:fs';
const UA = 'driver-sites-template-preview/0.1 (local dev; contact: satrya.pudja77@gmail.com)';
const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
  action: 'query', format: 'json', generator: 'search', gsrsearch: 'Toyota Kijang Innova filetype:bitmap', gsrnamespace: '6', gsrlimit: '40',
  prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '1600'
});
const json = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const out = [];
for (const p of Object.values(json.query?.pages || {})) {
  const ii = p.imageinfo?.[0]; if (!ii || ii.mime !== 'image/jpeg' || ii.width < 1200) continue;
  const lic = ii.extmetadata?.LicenseShortName?.value || '';
  if (!/^(CC0|Public domain|CC BY)/i.test(lic) || /NC|ND/i.test(lic)) continue;
  if (!/innova|kijang/i.test(p.title)) continue;
  out.push({ title: p.title, w: ii.width, h: ii.height, lic, artist: strip(ii.extmetadata?.Artist?.value), page: ii.descriptionurl, thumb: ii.thumburl });
}
fs.mkdirSync('research/photos', { recursive: true });
fs.writeFileSync('research/photos/car.json', JSON.stringify(out, null, 1));
console.log(out.length, 'candidates');
out.slice(0, 10).forEach((x, i) => console.log(i, x.lic, x.w + 'x' + x.h, x.title.slice(5, 80)));
