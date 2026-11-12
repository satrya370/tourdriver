const UA = 'driver-sites-template-preview/0.1 (local dev; contact: satrya.pudja77@gmail.com)';
const queries = {
  hero: 'Tegallalang Rice Terrace Bali',
  sunrise: 'Mount Batur sunrise Bali',
  uluwatu: 'Uluwatu Temple Bali sunset',
  tirta: 'Tirta Empul temple Bali',
  beratan: 'Pura Ulun Danu Beratan Bedugul',
  sidemen: 'Sidemen rice terrace Karangasem Bali',
  tanahlot: 'Tanah Lot temple Bali'
};
const okLicense = (l) => /^(CC0|Public domain|PD|CC BY(?!-NC)(?!-ND)|CC BY-SA)/i.test(l || '') && !/NC|ND/i.test(l || '');
const rank = (l) => (/^(CC0|Public domain|PD)/i.test(l) ? 0 : /^CC BY(?!-SA)/i.test(l) ? 1 : 2);
const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const out = {};
for (const [key, q] of Object.entries(queries)) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: q + ' filetype:bitmap', gsrnamespace: '6', gsrlimit: '30',
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '1600'
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const json = await res.json();
  const pages = Object.values(json.query?.pages || {}).sort((a, b) => a.index - b.index);
  const c = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0]; if (!ii) continue;
    const m = ii.extmetadata || {};
    const lic = m.LicenseShortName?.value;
    const ratio = ii.width / ii.height;
    if (ii.mime !== 'image/jpeg' || ii.width < 2000 || ratio < 1.35 || ratio > 1.9) continue;
    if (!okLicense(lic) || /map|logo|diagram|flag|stamp/i.test(p.title)) continue;
    c.push({ key, title: p.title, w: ii.width, h: ii.height, lic, rank: rank(lic), artist: strip(m.Artist?.value), page: ii.descriptionurl, thumb: ii.thumburl });
  }
  c.sort((a, b) => a.rank - b.rank);
  out[key] = c.slice(0, 4);
  console.log(key, 'candidates:', c.length);
}
import fs from 'node:fs';
fs.writeFileSync('research/photos/candidates.json', JSON.stringify(out, null, 1));
