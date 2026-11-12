// Membuat shared/engine-sample.json: data contoh yang mengikuti schema itinerary engine (web-2.1.0).
// Isi: 1 itinerary multi-hari (halaman itinerary), 4 tur (halaman tour), 1 panduan destinasi (Explore places).
// Semua ID adalah UUID deterministik supaya diff stabil. Foto memakai assetId -> file di shared/photos.
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const uuid = (seed) => {
  const h = createHash('sha1').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

// kredit foto dibaca dari shared/photos/CREDITS.md
const creditRows = Object.fromEntries(
  fs.readFileSync('shared/photos/CREDITS.md', 'utf8').split('\n').filter((l) => l.startsWith('| ') && l.includes('.webp'))
    .map((l) => l.split('|').map((c) => c.trim())).map(([, file, title, artist, lic, page]) => [file.replace('.webp', ''), { photographer: artist, url: page, source: `Wikimedia Commons (${lic})` }])
);
const assets = {};
const photo = (key) => {
  const assetId = uuid('asset:' + key);
  assets[assetId] = { file: `../../shared/photos/${key}.webp`, small: `../../shared/photos/${key}-800.webp` };
  return { assetId, credit: creditRows[key] };
};

const guide = { name: 'Wayan Sudiarta', phone: '+62 812-0000-0000' };
const site = { agencyName: 'Sudiarta Bali Drive', agencyContact: '+62 812-0000-0000 · hello@example.com', generatedDate: '2026-11-12', whatsapp: '6281200000000' };
const rates = { half_day: 400000, full_day: 650000, overtime: 60000, airport: 350000 };

let n = 0;
const act = (seed, time, kind, durationMinutes, title, place, description, tip = null) => ({ id: uuid(`${seed}:${n++}`), time, durationMinutes, kind, title, place, description, tip });
const base = (over) => ({
  schemaVersion: 'web-2.1.0', guide, cover: null, summary: '', days: [], places: [],
  included: [], notIncluded: [], notSuitableFor: [], notAllowed: [], whatToBring: [], localTips: [],
  emergencyContacts: [], policies: null, closingNote: null, disclaimer: null, ...over
});
const emergency = [
  { label: 'Wayan Sudiarta (driver)', value: '+62 812-0000-0000' }, { label: 'National emergency', value: '112' },
  { label: 'Police', value: '110' }, { label: 'Ambulance', value: '118' }
];
const policies = 'Cancellation: free up to 24 hours before pickup. Later cancellations are charged half the day rate.\nOvertime: IDR 60.000 per extra hour.\nPayment: bank transfer or cash in IDR at the end of each day.\nChildren: a child seat is available free of charge on request.';
const meetingBase = (place, time, note) => ({ place, mapsUrl: 'https://maps.google.com/?q=Ubud+Bali', time, note });

// ---------- 1. Itinerary multi-hari ----------
const itinerary = base({
  trip: { mode: 'multi_day', title: 'Three days in Bali: the volcano, Ubud and the south coast', destination: 'Bali', country: 'Indonesia', region: 'Kintamani, Ubud and Uluwatu', language: 'en', colorTheme: 'mixed', startDate: '2027-03-12', startTime: null, endTime: null },
  meeting: meetingBase('Hotel lobby, Ubud', '03:30', 'Wayan waits at the entrance with a name card. Day 2 pickup is at 08:00 and Day 3 pickup at 13:30, at the same spot.'),
  pickup: { offered: true, area: 'Hotels in Ubud and Penestanan', time: '03:30', dropoffNote: 'Dropped at your hotel after each day. Day 3 ends around 21:00.' },
  cover: photo('tour-batur-sunrise'),
  summary: 'A slow first trip: early starts for the best light, long lunches in between, and the drive back to Ubud before the afternoon traffic.',
  days: [
    {
      id: uuid('day:1'), dayNumber: 1, title: 'Kintamani sunrise and the terraces', location: 'Kintamani, Penglipuran, Tegallalang', photo: photo('tour-terraces'),
      activities: [
        act('d1', '03:30', 'transport', 60, 'Hotel pickup and drive north', 'Ubud', 'Wayan collects you at the hotel lobby. The road is empty before 04:00, so you can rest in the car.', 'Bring a warm layer. It is about 15 °C at the rim.'),
        act('d1', '05:30', 'sightseeing', 120, 'Mount Batur at sunrise', 'Penelokan viewpoint, Kintamani', 'Find a spot on the crater rim before first light. Mount Batur and the lake come into view as the sky turns orange.', 'Arrive before 05:45 for the best spots.'),
        act('d1', '07:30', 'food', 60, 'Breakfast at the rim', 'Terrace warung, Kintamani', 'Coffee, eggs and fried banana at a family warung with a view of the caldera.'),
        act('d1', '09:00', 'sightseeing', 90, 'Penglipuran bamboo village', 'Penglipuran, Bangli', 'Walk the main lane of the traditional village and see the matching family compounds. The village ticket is paid on site.', 'Ask before taking photos inside family compounds.'),
        act('d1', '11:00', 'food', 75, 'Lunch with a valley view', 'Tegallalang', 'Lunch at a terrace restaurant above the rice paddies. Lunch is not included in the price.'),
        act('d1', '12:30', 'sightseeing', 90, 'Tegallalang rice terraces', 'Tegallalang', 'Walk down into the paddies, not only the top platform. Wayan knows the quieter paths.', 'Wear shoes with grip. The steps are uneven.'),
        act('d1', '14:30', 'transport', 45, 'Return to Ubud', 'Ubud', 'Back at your hotel by about 15:15, in time to rest before dinner.')
      ],
      hotel: { name: 'Ubud guest house', area: 'Penestanan, Ubud', note: 'Same hotel for Day 1 and Day 2.' }, meals: { breakfast: true, lunch: false, dinner: false }, transferNote: null
    },
    {
      id: uuid('day:2'), dayNumber: 2, title: 'Ubud art and temples', location: 'Ubud, Mas and Tirta Empul', photo: null,
      activities: [
        act('d2', '08:00', 'transport', 30, 'Hotel pickup', 'Ubud', 'Breakfast at the hotel first, then Wayan collects you.'),
        act('d2', '09:00', 'sightseeing', 90, 'Mas woodcarving village', 'Mas, Gianyar', 'Watch carvers at work in family studios. There is no pressure to buy.'),
        act('d2', '11:00', 'activity', 90, 'Tirta Empul spring temple', 'Tampaksiring', 'Visit the holy spring where Balinese families come to purify. You can join the ritual or simply watch.', 'Sarong required. Bring a change of clothes and go before 11:00 for a quieter pool.'),
        act('d2', '13:00', 'food', 75, 'Lunch in Tampaksiring', 'Tampaksiring', 'A simple warung lunch. Ask Wayan for his favourite nasi campur.'),
        act('d2', '14:30', 'sightseeing', 75, 'Goa Gajah', 'Bedulu, Gianyar', 'A rock-cut temple cave and bathing pools from the 11th century, on the way back.'),
        act('d2', '16:00', 'free', 60, 'Free time in Ubud town', 'Ubud centre', 'Wayan drops you in the centre for shops and cafes and picks you up again at 17:00.'),
        act('d2', '17:00', 'transport', 30, 'Return to the hotel', 'Ubud', 'Back at your hotel by about 17:30.')
      ],
      hotel: { name: 'Ubud guest house', area: 'Penestanan, Ubud', note: null }, meals: { breakfast: true, lunch: false, dinner: false }, transferNote: null
    },
    {
      id: uuid('day:3'), dayNumber: 3, title: 'South coast and sunset', location: 'Nusa Dua and Uluwatu', photo: photo('tour-uluwatu-sunset'),
      activities: [
        act('d3', '13:30', 'transport', 90, 'Drive to the south coast', 'Ubud to Nusa Dua', 'A relaxed drive south, with a stop for coffee if you like.'),
        act('d3', '15:00', 'free', 120, 'Beach time at Nusa Dua', 'Nusa Dua', 'Two hours on the beach. The car waits in the paid parking lot.', 'Reef-safe sunscreen and a hat help in the afternoon sun.'),
        act('d3', '17:00', 'sightseeing', 90, 'Uluwatu temple at golden hour', 'Uluwatu', 'Walk the cliff path to the sea temple as the light turns gold.', 'Keep sunglasses and phones away from the monkeys.'),
        act('d3', '18:30', 'activity', 60, 'Kecak fire dance', 'Uluwatu temple amphitheatre', 'A traditional dance performed by dozens of men at sunset. Tickets are bought on site.', 'Wear long trousers or a sarong.'),
        act('d3', '19:30', 'transport', 90, 'Drive back to Ubud', 'Uluwatu to Ubud', 'Traffic from Uluwatu can take 60 minutes after the show. Back at your hotel around 21:00.')
      ],
      hotel: null, meals: { breakfast: false, lunch: false, dinner: false }, transferNote: 'Check-out day: if you leave Bali the next morning, Wayan can drive you to the airport (IDR 350.000 from Ubud).'
    }
  ],
  included: ['Private car and driver for three days', 'Petrol and parking', 'Bottled water in the car', 'English and Bahasa Indonesia speaking driver', 'Hotel pickup and drop-off in Ubud'],
  notIncluded: ['Entrance tickets and the kecak dance ticket', 'Meals and drinks', 'Hotel accommodation', 'Tip for the driver (optional)'],
  notSuitableFor: ['Guests who cannot be ready at 03:00 on Day 1', 'Travellers with limited mobility on the Tegallalang steps'],
  notAllowed: ['Smoking in the car', 'Durian in the car', 'Entering temples without a sarong and sash'],
  whatToBring: ['A warm layer for the Kintamani sunrise', 'Comfortable walking shoes', 'Sarong and sash (or rent at the temple)', 'Small IDR notes for tickets and parking', 'Reef-safe sunscreen and a hat'],
  localTips: ['Leave early. Roads in Bali are quieter before 08:00.', 'Small IDR notes are easier than cards at warungs and ticket booths.', 'Carry a rain jacket from November to March.', 'Temples can close for ceremonies. Wayan checks the dates in advance.'],
  emergencyContacts: emergency, policies,
  closingNote: 'Thank you for travelling with Sudiarta Bali Drive. Message Wayan on WhatsApp any time if your plans change.',
  disclaimer: 'Times and prices can change with traffic, weather and temple opening hours.'
});

// ---------- 2. Tur (halaman activities) ----------
const common = (extra) => ({
  included: ['Private car and driver', 'Petrol and parking', 'Bottled water', 'English and Bahasa Indonesia speaking driver'],
  notIncluded: ['Entrance tickets', 'Meals and drinks', 'Tip for the driver (optional)'],
  whatToBring: ['Sarong and sash (or rent at the temple)', 'Small IDR notes for tickets and parking'],
  emergencyContacts: emergency, policies, disclaimer: 'Times can change with traffic, weather and temple opening hours.', ...extra
});
const oneDay = (seed, title, location, photoKey, activities) => [{ id: uuid(`${seed}:day`), dayNumber: 1, title, location, photo: photoKey ? photo(photoKey) : null, activities, hotel: null, meals: null, transferNote: null }];
const tourMeeting = (time, drop) => ({ meeting: meetingBase('Your hotel lobby', time, 'Wayan waits at the entrance with a name card.'), pickup: { offered: true, area: 'Hotels in Ubud and nearby', time, dropoffNote: drop } });

const tours = [
  base(common({
    slug: 'kintamani-sunrise', price: rates.half_day + 350000,
    trip: { mode: 'half_day', title: 'Kintamani Sunrise', destination: 'Kintamani', country: 'Indonesia', region: 'Bangli, Central Bali', language: 'en', colorTheme: 'mountain', startDate: null, startTime: '03:30', endTime: '09:30' },
    ...tourMeeting('03:30', 'Back at your hotel by about 10:30.'),
    cover: photo('tour-batur-sunrise'),
    summary: 'Drive up before dawn to the volcano rim. Coffee at the viewpoint, then the slow road back through villages.',
    days: oneDay('t1', 'Sunrise at the volcano rim', 'Kintamani and Penglipuran', 'tour-batur-sunrise', [
      act('t1', '03:30', 'transport', 105, 'Hotel pickup and drive north', 'Ubud', 'The road is empty before 04:00. Rest in the car.', 'Bring a warm layer. It is about 15 °C at the rim.'),
      act('t1', '05:15', 'sightseeing', 105, 'Mount Batur at sunrise', 'Penelokan viewpoint', 'Mount Batur and the crater lake at first light.', 'Arrive before 05:45 for the best spots.'),
      act('t1', '07:00', 'food', 60, 'Breakfast at the rim', 'Terrace warung', 'Coffee, eggs and fried banana with the view.'),
      act('t1', '08:00', 'sightseeing', 90, 'Penglipuran bamboo village', 'Penglipuran, Bangli', 'Bamboo forest and traditional houses. The village ticket is paid on site.')
    ]),
    localTips: ['Dress in layers. The rim is cold before 06:00.']
  })),
  base(common({
    slug: 'ubud-terraces-and-villages', price: rates.full_day,
    trip: { mode: 'full_day', title: 'Ubud Terraces and Villages', destination: 'Ubud', country: 'Indonesia', region: 'Gianyar, Central Bali', language: 'en', colorTheme: 'nature', startDate: null, startTime: '08:00', endTime: '17:30' },
    ...tourMeeting('08:00', 'Back at your hotel by about 17:30.'),
    cover: photo('tour-terraces'),
    summary: 'A full day of the Ubud highlands: terraces, craft villages and a spring temple, with a long lunch in between.',
    days: oneDay('t2', 'Terraces, craft and temples', 'Tegallalang, Mas, Tirta Empul', 'tour-terraces', [
      act('t2', '08:00', 'transport', 45, 'Hotel pickup', 'Ubud', 'Wayan collects you after breakfast.'),
      act('t2', '08:45', 'sightseeing', 90, 'Tegallalang rice terraces', 'Tegallalang', 'Arrive before 09:00 for empty paths. Walk down into the paddies.', 'Wear shoes with grip.'),
      act('t2', '10:30', 'sightseeing', 60, 'Mas woodcarving village', 'Mas, Gianyar', 'Watch carvers work. There is no pressure to buy.'),
      act('t2', '12:00', 'activity', 90, 'Tirta Empul spring temple', 'Tampaksiring', 'Join the purification ritual or watch from the side.', 'Sarong required. Bring a change of clothes.'),
      act('t2', '13:45', 'food', 75, 'Lunch with a valley view', 'Tampaksiring', 'A warung lunch. Lunch is not included.'),
      act('t2', '15:15', 'sightseeing', 75, 'Goa Gajah', 'Bedulu', 'A rock-cut temple cave and bathing pools.'),
      act('t2', '16:45', 'transport', 45, 'Return to Ubud', 'Ubud', 'Back at your hotel by about 17:30.')
    ]),
    localTips: ['Go to Tegallalang first. The paths are empty before 09:00.']
  })),
  base(common({
    slug: 'uluwatu-sunset', price: rates.half_day,
    trip: { mode: 'half_day', title: 'Uluwatu Sunset', destination: 'Uluwatu', country: 'Indonesia', region: 'Badung, South Bali', language: 'en', colorTheme: 'beach', startDate: null, startTime: '15:00', endTime: '20:00' },
    ...tourMeeting('15:00', 'Back at your hotel by about 21:30.'),
    cover: photo('tour-uluwatu-sunset'),
    summary: 'The cliff temple at golden hour, then the kecak fire dance. Drop-off at your hotel in the evening.',
    days: oneDay('t3', 'Cliff temple and kecak', 'Uluwatu', 'tour-uluwatu-sunset', [
      act('t3', '15:00', 'transport', 75, 'Hotel pickup and drive south', 'Ubud to Uluwatu', 'Leave early to beat the afternoon traffic.'),
      act('t3', '16:15', 'sightseeing', 105, 'Uluwatu temple', 'Uluwatu', 'Walk the cliff path as the light turns gold.', 'Keep sunglasses and phones away from the monkeys.'),
      act('t3', '18:00', 'activity', 60, 'Kecak fire dance', 'Uluwatu temple amphitheatre', 'Tickets are bought on site. The dance starts at sunset.', 'Wear long trousers or a sarong.'),
      act('t3', '19:00', 'food', 60, 'Dinner near the temple (optional)', 'Uluwatu', 'Dinner is on your own. Wayan can suggest places that are quick before the drive back.')
    ]),
    localTips: ['Traffic from Uluwatu can take 60 minutes after the show.']
  })),
  base(common({
    slug: 'bedugul-and-tanah-lot', price: rates.full_day,
    trip: { mode: 'full_day', title: 'Bedugul and Tanah Lot', destination: 'Bedugul', country: 'Indonesia', region: 'Tabanan, West Bali', language: 'en', colorTheme: 'cultural', startDate: null, startTime: '08:00', endTime: '19:30' },
    ...tourMeeting('08:00', 'Back at your hotel by about 19:30.'),
    cover: photo('tour-bedugul-temple'),
    summary: 'The lake temple in the cool highlands in the morning, the sea temple at sunset.',
    days: oneDay('t4', 'Lake temple and sea temple', 'Bedugul and Tanah Lot', 'tour-bedugul-temple', [
      act('t4', '08:00', 'transport', 105, 'Hotel pickup and drive to Bedugul', 'Ubud to Bedugul', 'A scenic drive up to the highland lakes.'),
      act('t4', '09:45', 'sightseeing', 75, 'Ulun Danu Beratan temple', 'Bedugul', 'The lake temple. Best before 10:00, before the tour buses arrive.'),
      act('t4', '11:15', 'food', 75, 'Lunch near the lake', 'Bedugul', 'Lunch is not included.'),
      act('t4', '12:45', 'transport', 75, 'Drive to the west coast', 'Bedugul to Tanah Lot', 'Down from the highlands to the coast.'),
      act('t4', '14:00', 'free', 120, 'Coffee and rest near Tanah Lot', 'Tanah Lot area', 'Rest before the sunset crowds arrive.'),
      act('t4', '16:00', 'sightseeing', 120, 'Tanah Lot at sunset', 'Tanah Lot', 'The sea temple on its rock. The temple is reachable at low tide only.', 'Wayan checks the tide for your date.'),
      act('t4', '18:00', 'transport', 90, 'Return to Ubud', 'Ubud', 'Back at your hotel by about 19:30.')
    ]),
    localTips: ['Bedugul is cool. Bring a light jacket.']
  }))
];

// ---------- 3. Panduan destinasi (Explore places) ----------
const place = (seed, group, name, area, description, extra) => ({ id: uuid('place:' + seed), group, name, area, description, tips: [], gettingThere: null, suggestedDuration: null, bestTime: null, nearby: null, photo: null, ...extra });
const placesGuide = base({
  trip: { mode: 'destination_guide', title: 'Places worth the drive around Ubud', destination: 'Bali', country: 'Indonesia', region: 'Central and south Bali', language: 'en', colorTheme: 'mixed', startDate: null, startTime: null, endTime: null },
  meeting: { place: null, mapsUrl: null, time: null, note: null }, pickup: { offered: false, area: null, time: null, dropoffNote: null },
  cover: photo('hero-terraces-green'),
  summary: 'Seven places Wayan drives guests to most often, with how long to stay, when to go and how to get there.',
  places: [
    place('tegallalang', 'Ubud and around', 'Tegallalang rice terraces', 'Tegallalang, Gianyar', 'Terraced rice fields on a steep valley wall, with paths down into the paddies.', { tips: ['Arrive before 09:00 for empty paths.', 'Wear shoes with grip.'], gettingThere: 'About 25 minutes by car from Ubud centre.', suggestedDuration: '1 to 1,5 hours', bestTime: 'Early morning, before 09:00', nearby: 'Swing and coffee plantations along the same road', photo: photo('tour-terraces') }),
    place('tirta', 'Ubud and around', 'Tirta Empul', 'Tampaksiring, Gianyar', 'A holy spring temple where Balinese families come to purify in the pools.', { tips: ['Sarong required, rent one at the gate.', 'Bring a change of clothes to join the ritual.'], gettingThere: 'About 40 minutes by car from Ubud.', suggestedDuration: '1,5 hours', bestTime: 'Before 11:00', nearby: 'Gunung Kawi, Tampaksiring palace' }),
    place('gajah', 'Ubud and around', 'Goa Gajah', 'Bedulu, Gianyar', 'A rock-cut temple cave and bathing pools from the 11th century.', { tips: ['Cover shoulders and knees.'], gettingThere: 'About 15 minutes by car from Ubud.', suggestedDuration: '1 hour', bestTime: 'Afternoon', nearby: 'Yeh Pulu relief' }),
    place('batur', 'Highlands and volcano', 'Mount Batur and the Kintamani rim', 'Kintamani, Bangli', 'A volcano and crater lake seen from the rim road. Sunrise is the main reason to go.', { tips: ['Dress in layers. It is about 15 °C before 06:00.', 'Book breakfast with a view at a rim warung.'], gettingThere: 'About 1 hour 15 minutes by car from Ubud.', suggestedDuration: '3 to 4 hours with breakfast', bestTime: 'Sunrise, April to October', nearby: 'Penglipuran village, Tegenungan', photo: photo('tour-batur-sunrise') }),
    place('beratan', 'Highlands and volcano', 'Ulun Danu Beratan', 'Bedugul, Tabanan', 'A temple complex on the shore of a highland lake.', { tips: ['Go before 10:00 to avoid tour buses.', 'Bring a light jacket.'], gettingThere: 'About 1 hour 45 minutes by car from Ubud.', suggestedDuration: '1 to 1,5 hours', bestTime: 'Early morning', nearby: 'Handara gate, Jatiluwih terraces', photo: photo('tour-bedugul-temple') }),
    place('uluwatu', 'Coast', 'Uluwatu temple', 'Uluwatu, Badung', 'A sea temple on a cliff, famous for sunset and the kecak dance.', { tips: ['Keep sunglasses and phones away from the monkeys.', 'Wear long trousers or a sarong.'], gettingThere: 'About 1 hour 45 minutes by car from Ubud.', suggestedDuration: '2 to 3 hours with the dance', bestTime: 'Late afternoon to sunset', nearby: 'Padang Padang, Jimbaran', photo: photo('tour-uluwatu-sunset') }),
    place('tanahlot', 'Coast', 'Tanah Lot', 'Beraban, Tabanan', 'A sea temple on a rock, reachable on foot at low tide.', { tips: ['Check the tide before you go.', 'Arrive before 16:00 to avoid the sunset crowd.'], gettingThere: 'About 1 hour 15 minutes by car from Ubud.', suggestedDuration: '1,5 to 2 hours', bestTime: 'Late afternoon', nearby: 'Pererenan beach', photo: photo('tour-tanah-lot') })
  ],
  emergencyContacts: emergency, closingNote: 'Ask Wayan to turn any of these places into a day plan.', disclaimer: 'Travel times are estimates and change with traffic.'
});

fs.writeFileSync('shared/engine-sample.json', JSON.stringify({ _note: 'Contoh data mengikuti itinerary engine web-2.1.0. Dihasilkan oleh scripts/make-engine-sample.mjs.', site, rates, assets, itinerary, tours, placesGuide }, null, 2) + '\n');
console.log('written', Object.keys(assets).length, 'assets');
