// Mengunduh foto contoh berlisensi bebas (Wikimedia Commons) dan mengubahnya ke WebP.
import { execFileSync } from 'node:child_process';
// Hanya untuk preview template. Foto asli driver menggantikan ini.
import fs from 'node:fs';
import sharp from 'sharp';
const UA = 'driver-sites-template-preview/0.1 (local dev; contact: satrya.pudja77@gmail.com)';
const c = JSON.parse(fs.readFileSync('research/photos/candidates.json', 'utf8'));
const picks = [
  ['hero-terraces', 'hero', 1], ['hero-terraces-green', 'hero', 3], ['tour-terraces', 'hero', 2],
  ['tour-batur-sunrise', 'sunrise', 2], ['tour-uluwatu-sunset', 'uluwatu', 3],
  ['tour-bedugul-temple', 'beratan', 0], ['tour-tanah-lot', 'tanahlot', 2]
];
const credits = ['# Kredit foto contoh', '', 'Foto contoh untuk preview template, dari Wikimedia Commons. Ganti dengan foto asli driver sebelum dipakai klien.', '', '| File | Judul | Fotografer | Lisensi | Sumber |', '|---|---|---|---|---|'];
for (const [name, key, idx] of picks) {
  const x = c[key][idx];
  const buf = execFileSync("curl", ["-sSL", "--max-time", "60", "-A", UA, x.thumb], { maxBuffer: 64 * 1024 * 1024 });
  for (const [suffix, width, q] of [['', 1440, 55], ['-800', 800, 70]]) {
    const out = await sharp(buf).resize({ width }).webp({ quality: q }).toBuffer();
    fs.writeFileSync(`shared/photos/${name}${suffix}.webp`, out);
    console.log(name + suffix, Math.round(out.length / 1024) + ' KB');
  }
  credits.push(`| ${name}.webp | ${x.title.replace('File:', '')} | ${x.artist || 'n/a'} | ${x.lic} | ${x.page} |`);
  await new Promise((r) => setTimeout(r, 800));
}
fs.writeFileSync('shared/photos/CREDITS.md', credits.join('\n') + '\n');
