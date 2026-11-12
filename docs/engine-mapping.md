# Pemetaan halaman template ke itinerary engine

Halaman **itinerary** dan **tours (activities)** pada template dihasilkan dari data engine. Dokumen ini menjelaskan pemetaannya supaya slicing ke data dinamis 1:1.

Sumber kebenaran: `itinerary-engine/src/contracts/itinerary.generated.d.ts` (schema `web-2.1.0`) dan `itinerary-engine/src/render/render.ts` (urutan section). Label EN/ID disalin dari `itinerary-engine/config/web/locales` ke `shared/engine-labels.json`.

## Berkas

| Berkas | Fungsi |
|---|---|
| `scripts/make-engine-sample.mjs` | Membuat `shared/engine-sample.json` (data contoh). |
| `shared/engine-sample.json` | 1 itinerary multi-hari, 4 tur (half/full day), 1 panduan destinasi. Semua konten **lolos `validateDraft` dan `validateForPublish`** engine. |
| `shared/engine-labels.json` | Label resmi engine, EN dan ID. |
| `scripts/build-engine-pages.mjs` | Menulis halaman engine untuk empat template. Sawah dan Batu: mengganti isi `itinerary.html` dan `activities.html`. Segara dan Endek: membuat penuh `itinerary.html`, `activities.html`, `about.html` (head, header, footer diambil dari landing masing-masing). Jalankan: `node scripts/build-engine-pages.mjs [tema] && npm run build`. |

## Halaman itinerary (mengikuti urutan renderer engine)

| Section di halaman | `data-section` | Field engine |
|---|---|---|
| Hero | `hero` | `cover` (+ credit), badge scope (`trip.mode`, jumlah `days`), label mode, `trip.title`, `trip.destination` · `trip.region` · `trip.country`, nama agensi |
| Info perjalanan | `trip-info` | `trip.startDate`, tanggal selesai (dihitung), `trip.startTime`/`endTime` (half/full), `meeting.place/mapsUrl/time/note`, `pickup.area/time/dropoffNote` (jika `pickup.offered`), `guide.name/phone` |
| Gambaran perjalanan | `summary` | `summary` |
| Tahapan rute | `route` | dihitung: full_day = `days[0].activities[].place`, multi_day = `days[].location`; tampil bila ≥ 2 |
| Itinerary | `schedule` | `days[]`: `dayNumber`, tanggal (dihitung dari `startDate`), `title`, `location`, `photo`; `activities[]`: `time`, `kind`, `durationMinutes`, `title`, `place`, `description`, `tip`; `meals` (bukan half_day), `hotel` dan `transferNote` (hanya multi_day) |
| Informasi praktis | `practical` | `included`, `notIncluded`, `whatToBring`, `notSuitableFor`, `notAllowed`, `localTips`, `emergencyContacts` |
| Ketentuan | `policies` | `policies` |
| Penutup | `closing` | `closingNote`, kontak agensi, `disclaimer`, kredit foto, tanggal dibuat |

Halaman ini `noindex`.

## Halaman tours

| Bagian | Sumber |
|---|---|
| Kartu tur | Satu itinerary engine per tur (`half_day` atau `full_day`): `cover`, `trip.title`, `trip.mode`, `trip.destination/region/country`, `summary`, tahapan rute, `trip.startTime–endTime`, `meeting.place`, `pickup.area`, `pickup.dropoffNote` |
| Rencana tur (dapat dibuka) | `days[0].activities[]` (semua field aktivitas), `included`, `notIncluded`, `whatToBring`, `localTips`, `policies` |
| Explore places | Itinerary `destination_guide`: `places[]` dikelompokkan berdasarkan `group`; `name`, `area`, `description`, `suggestedDuration`, `bestTime`, `gettingThere`, `nearby`, `tips`, `photo` |
| Kredit foto | `photo.credit` dari semua foto yang tampil |

## Yang TIDAK ada di engine (data tingkat situs)

Engine tidak menyimpan hal-hal berikut. Template mengambilnya dari data situs (`site.json`, tahap E2/E3 di plan), bukan dari itinerary:

- **Harga tur** (`price`) dan tarif (`rates`: half day, full day, overtime, airport).
- **Slug / kategori tur** (Sunrise, Culture, Coast, Temples) untuk anchor dan chip filter.
- Transfer bandara (layanan, bukan itinerary), rute custom, FAQ, area layanan, rating dan ulasan, kredensial.

Konsekuensi untuk engine: agar halaman tur benar-benar otomatis, perlu ditentukan itinerary mana yang dipublikasikan sebagai "tur" pada situs driver (mis. penanda publik pada itinerary atau tabel `site_tours` yang merujuk id itinerary) dan dari mana harga diambil. Ini keputusan untuk plan E2/E3.

## Catatan format

- Jam di engine berformat 24 jam `HH:MM` (mis. `03:30`). Halaman engine memakai format itu. Teks landing masih memakai `03.30` dan perlu diseragamkan saat slicing.
- ID day/activity/place berupa UUID.
- Untuk `multi_day`, engine menolak `trip.startTime` dan `trip.endTime` (field tidak berlaku).
- Kelompok foto: setiap foto yang tampil wajib punya kredit lengkap (aturan `PHOTO_ATTRIBUTION_REQUIRED`).

## Satu struktur data, desain berbeda

Section dan field engine sama di semua template. Yang berbeda adalah tampilan. Variasi tata letak per template:

| Blok | Sawah | Batu | Segara | Endek |
|---|---|---|---|---|
| Info perjalanan | empat kartu bertumpuk | empat kartu bertumpuk | panel lembut 2 kolom | panel gelap bergaya tabel |
| Kartu tur | foto kiri-kanan bergantian | kartu horizontal | foto lebar di atas + panel fakta | foto penuh dengan teks di atas foto |
| Explore places | grid 3 kolom | grid 3 kolom | kartu lebar (foto di samping) | baris besar bergantian |
| Informasi praktis | kartu | kartu | kartu | kolom bergaris tanpa kartu |
| Hero itinerary | foto penuh, teks kiri | kartu foto + teks | foto penuh, teks tengah | foto penuh gelap, teks kiri |
