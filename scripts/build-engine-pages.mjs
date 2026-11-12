// Menghasilkan isi halaman itinerary.html dan activities.html dari data engine (shared/engine-sample.json).
// Urutan section dan field mengikuti renderer itinerary engine (src/render/render.ts).
// Pakai: node scripts/build-engine-pages.mjs [sawah|batu ...]   lalu: npm run build
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('shared/engine-sample.json', 'utf8'));
const LBL = JSON.parse(fs.readFileSync('shared/engine-labels.json', 'utf8')).en;
const L = (k) => LBL[k] ?? k;
const { site, assets, rates } = data;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const idr = (n) => new Intl.NumberFormat('id-ID').format(n);
const wa = (text) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

const fmtDate = (iso) => (iso ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)) : '');
const addDays = (iso, n) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const fmtDur = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  const u = (v, unit) => new Intl.NumberFormat('en', { style: 'unit', unit, unitDisplay: 'short' }).format(v);
  return [h ? u(h, 'hour') : '', m ? u(m, 'minute') : ''].filter(Boolean).join(' ');
};
const kindLabel = (k) => L('activityType' + k[0].toUpperCase() + k.slice(1));
const modeKey = (m) => m.split('_').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const scopeText = (c) => (c.trip.mode === 'multi_day' ? L('scopeMultiDay').replace('{count}', String(c.days.length)) : L('scope' + modeKey(c.trip.mode)));
const place3 = (c) => [c.trip.destination, c.trip.region, c.trip.country].filter(Boolean).join(' · ');
const routeStops = (c) => {
  let s = [];
  if (c.trip.mode === 'full_day') s = c.days[0]?.activities.map((a) => a.place || a.title) || [];
  else if (c.trip.mode === 'multi_day') s = c.days.map((d) => d.location || d.title);
  return [...new Set(s.filter(Boolean))];
};
const img = (p, size = 'file') => (p ? assets[p.assetId][size] : null);
const creditsOf = (list) => {
  const seen = new Map();
  for (const p of list) if (p?.credit) seen.set(`${p.credit.photographer}|${p.credit.url}`, p.credit);
  return [...seen.values()];
};
const creditHtml = (cr, cls) => (cr.length ? `<p class="${cls}">${esc(L('photoCredits'))}: ${cr.map((c) => `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="underline">${esc(c.photographer)}</a> · ${esc(c.source)}`).join('; ')}</p>` : '');

// ---------------------------------------------------------------- tema
const themes = {
  sawah: {
    name: 'sawah', stickyTop: 'top-[69px]',
    h2: 'font-display text-3xl font-bold text-navy sm:text-4xl', h3: 'font-display text-2xl font-bold text-navy', h4: 'text-lg font-semibold text-navy',
    eyebrow: 'eyebrow', dt: 'text-xs font-semibold tracking-wide text-copper uppercase', dd: 'mt-1 font-medium', muted: 'text-muted',
    card: 'rounded-2xl border border-navy/15 bg-snow p-7', soft: 'rounded-2xl bg-mist p-7', chip: 'rounded-full bg-mist px-3 py-1 text-sm font-medium',
    chipAccent: 'rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy-deep', tip: 'rounded-lg bg-mist px-3 py-2 text-sm', link: 'font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4',
    btn: 'btn-primary', btnGhost: 'btn-ghost', ol: 'space-y-8 border-l-2 border-gold pl-7', bullet: 'text-copper', priceNum: 'font-display text-3xl font-bold text-navy',
    tab: 'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border border-navy/30 px-4 text-sm font-semibold text-navy aria-[current=true]:border-navy aria-[current=true]:bg-navy aria-[current=true]:text-snow',
    nav: 'sticky z-30 -mx-5 border-y border-navy/10 bg-snow/95 px-5 py-3 backdrop-blur print:hidden', closing: 'bg-navy text-snow', closingAccent: 'text-gold', closingMuted: 'text-snow/80',
    details: 'rounded-2xl border border-navy/15', summary: 'flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 px-6 font-semibold text-navy', plus: 'text-2xl text-copper',
    row(a, kindCls) {
      return `<li class="relative" data-activity-id="${a.id}"><span class="absolute -left-[35px] top-1.5 h-3 w-3 rounded-full bg-gold" aria-hidden="true"></span>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span class="font-semibold text-copper" data-field="activity.time">${esc(a.time)}</span><span class="rounded-full bg-mist px-2.5 py-0.5 text-xs font-medium">${esc(kindLabel(a.kind))}</span>${a.durationMinutes ? `<span class="text-muted">${esc(fmtDur(a.durationMinutes))}</span>` : ''}</p>
        <h4 class="mt-1 text-lg font-semibold text-navy" data-field="activity.title">${esc(a.title)}</h4>
        <p class="mt-1 text-ink/80" data-field="activity.description">${esc(a.description)}</p>
        ${a.place ? `<p class="mt-1 text-sm text-muted" data-field="activity.place">${esc(a.place)}</p>` : ''}
        ${a.tip ? `<p class="mt-3 rounded-lg bg-mist px-3 py-2 text-sm" data-field="activity.tip"><b>${esc(L('localTip'))}</b> · ${esc(a.tip)}</p>` : ''}</li>`;
    },
    hero(c, cover) {
      return `<header data-section="hero" class="relative isolate overflow-hidden text-snow"><img src="${cover}" width="1440" height="983" fetchpriority="high" alt="${esc(L('heroPhoto'))}" class="absolute inset-0 -z-20 h-full w-full object-cover" data-field="cover">
        <div class="absolute inset-0 -z-10 bg-gradient-to-t from-navy-deep via-navy-deep/60 to-navy-deep/25 print:bg-navy-deep/70" aria-hidden="true"></div>
        <div class="mx-auto max-w-3xl px-5 pb-14 pt-24 print:pt-10">
          <div class="mb-8 flex items-center justify-between gap-4 text-xs font-bold tracking-widest uppercase"><span data-field="agency.name">${esc(site.agencyName)}</span><span class="rounded-full border border-snow/50 px-3 py-1">${esc(scopeText(c))}</span></div>
          <p class="mb-2 text-xs font-bold tracking-widest text-gold uppercase">${esc(L('mode' + modeKey(c.trip.mode)))}</p>
          <h1 class="max-w-3xl font-display text-4xl leading-[1.1] font-bold sm:text-6xl" data-field="trip.title">${esc(c.trip.title)}</h1>
          <p class="mt-4 text-lg text-snow/90" data-field="trip.destination">${esc(place3(c))}</p></div></header>`;
    }
  },
  batu: {
    name: 'batu', stickyTop: 'top-[69px]',
    h2: 'text-2xl font-bold sm:text-3xl', h3: 'text-xl font-bold', h4: 'text-base font-semibold',
    eyebrow: 'eyebrow', dt: 'text-xs font-semibold tracking-wide text-slate uppercase', dd: 'mt-1 font-medium', muted: 'text-slate',
    card: 'rounded-3xl bg-snow p-7 shadow-sm ring-1 ring-ink/5', soft: 'rounded-3xl bg-sky p-7', chip: 'rounded-full bg-sky px-3 py-1 text-sm font-medium',
    chipAccent: 'rounded-full bg-coral px-3 py-1 text-xs font-semibold text-snow', tip: 'rounded-xl bg-fog px-3 py-2 text-sm', link: 'font-semibold underline underline-offset-4',
    btn: 'btn-primary', btnGhost: 'btn-outline', ol: 'space-y-3', bullet: 'text-coral', priceNum: 'text-3xl font-bold',
    tab: 'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-xl bg-snow px-4 text-sm font-semibold shadow-sm aria-[current=true]:bg-coral aria-[current=true]:text-snow',
    nav: 'sticky z-30 -mx-5 bg-fog/95 px-5 py-3 backdrop-blur print:hidden', closing: 'bg-ink text-snow', closingAccent: 'text-coral', closingMuted: 'text-snow/75',
    details: 'rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5', summary: 'flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 px-6 font-semibold', plus: 'text-2xl text-coral',
    row(a) {
      return `<li class="flex gap-4 rounded-2xl bg-fog p-4" data-activity-id="${a.id}"><span class="w-14 shrink-0 text-sm font-bold text-coral" data-field="activity.time">${esc(a.time)}</span><div class="min-w-0">
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span class="rounded-full bg-sky px-2.5 py-0.5 font-medium">${esc(kindLabel(a.kind))}</span>${a.durationMinutes ? `<span class="text-slate">${esc(fmtDur(a.durationMinutes))}</span>` : ''}</p>
        <h4 class="mt-1 font-semibold" data-field="activity.title">${esc(a.title)}</h4>
        <p class="mt-1 text-sm text-slate" data-field="activity.description">${esc(a.description)}</p>
        ${a.place ? `<p class="mt-1 text-xs font-medium text-slate" data-field="activity.place">${esc(a.place)}</p>` : ''}
        ${a.tip ? `<p class="mt-2 rounded-xl bg-snow px-3 py-2 text-sm" data-field="activity.tip"><b>${esc(L('localTip'))}</b> · ${esc(a.tip)}</p>` : ''}</div></li>`;
    },
    hero(c, cover) {
      return `<header data-section="hero" class="overflow-hidden rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5"><img src="${cover}" width="1440" height="983" fetchpriority="high" alt="${esc(L('heroPhoto'))}" class="aspect-[16/9] w-full object-cover" data-field="cover">
        <div class="p-7 md:p-9"><div class="mb-4 flex items-center justify-between gap-4 text-xs font-semibold tracking-wide uppercase"><span data-field="agency.name">${esc(site.agencyName)}</span><span class="rounded-full bg-sky px-3 py-1">${esc(scopeText(c))}</span></div>
          <p class="mb-1 text-xs font-semibold tracking-wide text-coral uppercase">${esc(L('mode' + modeKey(c.trip.mode)))}</p>
          <h1 class="text-3xl leading-[1.15] font-bold sm:text-4xl" data-field="trip.title">${esc(c.trip.title)}</h1>
          <p class="mt-3 text-slate" data-field="trip.destination">${esc(place3(c))}</p></div></header>`;
    }
  }
};

// ---------------------------------------------------------------- blok yang dipakai bersama
const dl = (t, items) => `<dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2">${items.map(([k, v, extra]) => `<div${extra || ''}><dt class="${t.dt}">${esc(k)}</dt><dd class="${t.dd}">${v}</dd></div>`).join('')}</dl>`;

function tripInfo(t, c) {
  const trip = [];
  if (c.trip.startDate) {
    trip.push([L('startDate'), esc(fmtDate(c.trip.startDate))]);
    if (c.trip.mode === 'multi_day') trip.push([L('endDate'), esc(fmtDate(addDays(c.trip.startDate, c.days.length - 1)))]);
  }
  if (c.trip.startTime || c.trip.endTime) trip.push([L('startTime'), esc(c.trip.endTime ? `${c.trip.startTime}–${c.trip.endTime}` : c.trip.startTime)]);
  const meet = [];
  if (c.meeting.place) meet.push([L('meetingPoint'), esc(c.meeting.place)]);
  if (c.meeting.mapsUrl) meet.push([L('mapsLink'), `<a href="${esc(c.meeting.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="${t.link}">${esc(L('mapsLink'))}</a>`]);
  if (c.meeting.time) meet.push([L('meetingTime'), esc(c.meeting.time)]);
  if (c.meeting.note) meet.push([L('meetingNote'), esc(c.meeting.note), ' class="sm:col-span-2"']);
  const pick = [];
  if (c.pickup.offered) {
    if (c.pickup.area) pick.push([L('pickup'), esc(c.pickup.area)]);
    if (c.pickup.time) pick.push([L('pickupTime'), esc(c.pickup.time)]);
    if (c.pickup.dropoffNote) pick.push([L('dropoffNote'), esc(c.pickup.dropoffNote), ' class="sm:col-span-2"']);
  }
  const g = [];
  if (c.guide.name) g.push([L('guideName'), esc(c.guide.name)]);
  if (c.guide.phone) g.push([L('guidePhone'), `<a href="${wa('Hello ' + c.guide.name + ', question about my itinerary')}" class="${t.link}">${esc(c.guide.phone)}</a>`]);
  const groups = [['When', trip], ['Where we meet', meet], ['Pickup and drop-off', pick], ['Your guide', g]].filter(([, i]) => i.length);
  return `<section data-section="trip-info" class="mt-10"><div class="grid gap-5">${groups.map(([title, items]) => `<div class="${t.card} !p-8"><h3 class="${t.h4} mb-6">${esc(title)}</h3>${dl(t, items)}</div>`).join('')}</div></section>`;
}

function practical(t, c) {
  const groups = [['included', c.included], ['notIncluded', c.notIncluded], ['whatToBring', c.whatToBring], ['notSuitableFor', c.notSuitableFor], ['notAllowed', c.notAllowed],
    ...(c.localTips.length ? [['localTip', c.localTips]] : []), ...(c.emergencyContacts.length ? [['emergencyContact', c.emergencyContacts.map((e) => `${e.label}: ${e.value}`)]] : [])].filter(([, v]) => v.length);
  if (!groups.length) return '';
  return `<section class="mt-16" id="practical" data-section="practical"><h2 class="${t.h2}">${esc(L('practicalInfo'))}</h2><div class="mt-8 grid gap-5 md:grid-cols-2">${groups.map(([k, v]) => `<article class="${t.card}"><h3 class="${t.h4}">${esc(L(k))}</h3><ul class="mt-3 space-y-2 text-sm">${v.map((x) => `<li class="flex gap-2"><span class="${t.bullet}" aria-hidden="true">•</span><span>${esc(x)}</span></li>`).join('')}</ul></article>`).join('')}</div></section>`;
}

function day(t, c, d, i) {
  const multi = c.trip.mode === 'multi_day';
  const date = multi && c.trip.startDate ? fmtDate(addDays(c.trip.startDate, i)) : null;
  const meals = c.trip.mode !== 'half_day' && d.meals && (d.meals.breakfast || d.meals.lunch || d.meals.dinner) ? `<p class="mt-5 text-sm"><b>${esc(L('meals'))}:</b> ${[d.meals.breakfast && L('breakfast'), d.meals.lunch && L('lunch'), d.meals.dinner && L('dinner')].filter(Boolean).join(' · ')}</p>` : '';
  const hotelDetail = d.hotel ? [d.hotel.area, d.hotel.note].filter(Boolean).join(' · ') : '';
  const hotel = multi && d.hotel ? `<div class="${t.soft} mt-5 !p-5"><p><b>${esc(L('hotel'))}:</b> <span data-field="day.hotel.name">${esc(d.hotel.name)}</span></p>${hotelDetail ? `<p class="mt-1 text-sm ${t.muted}">${esc(hotelDetail)}</p>` : ''}</div>` : '';
  const transfer = multi && d.transferNote ? `<p class="mt-4 text-sm"><b>${esc(L('transferNote'))}:</b> ${esc(d.transferNote)}</p>` : '';
  const head = multi
    ? `<header class="mb-6"><p class="${t.dt}">${esc(L('dayLabel'))} ${d.dayNumber}${date ? ` · ${esc(date)}` : ''}</p><h3 class="mt-1 ${t.h3}" data-field="day.title">${esc(d.title)}</h3>${d.location ? `<p class="mt-1 text-sm ${t.muted}" data-field="day.location">${esc(d.location)}</p>` : ''}</header>`
    : `<header class="mb-6"><h3 class="${t.h3}" data-field="day.title">${esc(d.title)}</h3>${d.location ? `<p class="mt-1 text-sm ${t.muted}" data-field="day.location">${esc(d.location)}</p>` : ''}</header>`;
  const photo = d.photo ? `<img src="${img(d.photo, 'small')}" width="800" height="533" loading="lazy" alt="${esc(L('regionPhoto'))}" class="mb-6 aspect-[16/7] w-full rounded-xl object-cover" data-field="day.photo">` : '';
  return `<article data-component="day" data-day-id="${d.id}"${multi ? ` data-day id="day-${d.dayNumber}"` : ''} class="${multi ? 'pt-10 print:block' : ''}">${head}${photo}<ol class="${t.ol}" data-repeat="activities">${d.activities.map((a) => t.row(a)).join('')}</ol>${meals}${hotel}${transfer}</article>`;
}

// ---------------------------------------------------------------- halaman itinerary
function itineraryMain(t) {
  const c = data.itinerary;
  const cover = img(c.cover);
  const stops = routeStops(c);
  const credits = creditsOf([c.cover, ...c.days.map((d) => d.photo)]);
  const tabs = c.days.map((d) => `<li><a href="#day-${d.dayNumber}" data-day-link class="${t.tab}">${esc(L('dayLabel'))} ${d.dayNumber} · ${esc((d.location || d.title).split(',')[0])}</a></li>`).join('');
  const wrapHero = t.name === 'batu' ? `<div class="mx-auto max-w-3xl px-5 pt-6">${t.hero(c, cover)}</div>` : t.hero(c, cover);
  const closingTone = t.name === 'batu' ? 'rounded-3xl' : '';
  const closing = `<footer data-section="closing" class="mt-16 ${t.closing} ${closingTone} p-8 sm:p-10"><h2 class="font-display text-3xl font-bold ${t.name === 'batu' ? '!font-sans' : ''}">${esc(L('closingHeading'))}</h2>${c.closingNote ? `<p class="mt-3">${esc(c.closingNote)}</p>` : ''}<p class="mt-3 font-semibold">${esc(site.agencyContact)}</p><a href="${wa('Hello ' + c.guide.name + ', question about my itinerary')}" class="${t.btn} mt-5 print:hidden">WhatsApp ${esc(c.guide.name.split(' ')[0])}</a>${c.disclaimer ? `<p class="mt-6 text-sm ${t.closingMuted}">${esc(c.disclaimer)}</p>` : ''}${creditHtml(credits, `mt-4 border-t border-snow/20 pt-4 text-xs ${t.closingMuted}`)}<p class="mt-3 text-xs ${t.closingMuted}">${esc(L('generatedDate'))}: ${esc(fmtDate(site.generatedDate))}</p></footer>`;
  return `<main id="main" data-engine="itinerary">
${wrapHero}
<div class="mx-auto max-w-3xl px-5 pb-16">
${tripInfo(t, c)}
<section class="mt-12" id="summary" data-section="summary"><h2 class="${t.h2}">${esc(L('tripOverview'))}</h2><p class="mt-4 max-w-3xl text-lg leading-relaxed" data-field="summary">${esc(c.summary)}</p></section>
${stops.length >= 2 ? `<section class="mt-8" id="route" data-section="route"><p class="mb-3 font-semibold">${esc(L('routeSummary'))}</p><ul class="flex flex-wrap gap-2" data-repeat="route">${stops.map((s) => `<li class="${t.chip}">${esc(s)}</li>`).join('')}</ul></section>` : ''}
<section class="mt-16" id="schedule" data-section="schedule"><h2 class="${t.h2}">${esc(L('itinerary'))}</h2>
<nav data-component="day-nav" aria-label="${esc(L('itinerary'))}" class="${t.nav} ${t.stickyTop} mt-6"><ul class="flex gap-2 overflow-x-auto" data-repeat="days">${tabs}</ul></nav>
${c.days.map((d, i) => day(t, c, d, i)).join('\n')}
</section>
${practical(t, c)}
${c.policies ? `<section class="mt-16" id="policies" data-section="policies"><h2 class="${t.h2}">${esc(L('policies'))}</h2><p class="mt-4 max-w-3xl whitespace-pre-line leading-relaxed" data-field="policies">${esc(c.policies)}</p></section>` : ''}
${closing}
</div>
</main>`;
}

// ---------------------------------------------------------------- halaman activities
const tourIds = { 'kintamani-sunrise': 'sunrise', 'ubud-terraces-and-villages': 'culture', 'uluwatu-sunset': 'coast', 'bedugul-and-tanah-lot': 'temples' };
const chipLabel = { sunrise: 'Sunrise', culture: 'Culture', coast: 'Coast', temples: 'Temples' };

function plan(t, c, open) {
  const d = c.days[0];
  const mini = [['included', c.included], ['notIncluded', c.notIncluded], ['whatToBring', c.whatToBring], ['localTip', c.localTips]].filter(([, v]) => v.length);
  return `<details class="${t.details} group mt-8 md:col-span-12"${open ? ' open' : ''}><summary class="${t.summary}">${esc(L('itinerary'))}: ${esc(d.title)} <span class="${t.plus} transition group-open:rotate-45" aria-hidden="true">+</span></summary>
    <div class="px-6 pb-7" data-section="schedule">
      <ol class="${t.ol} mt-2" data-repeat="activities">${d.activities.map((a) => t.row(a)).join('')}</ol>
      <div class="mt-8 grid gap-5 sm:grid-cols-2" data-section="practical">${mini.map(([k, v]) => `<div><h4 class="${t.h4}">${esc(L(k))}</h4><ul class="mt-2 space-y-1.5 text-sm">${v.map((x) => `<li class="flex gap-2"><span class="${t.bullet}" aria-hidden="true">•</span><span>${esc(x)}</span></li>`).join('')}</ul></div>`).join('')}</div>
      ${c.policies ? `<p class="mt-8 text-sm ${t.muted}"><b>${esc(L('policies'))}:</b> ${esc(c.policies.split('\n')[0])} <a href="itinerary.html#policies" class="${t.link}">All policies</a></p>` : ''}
    </div></details>`;
}

function tourCard(t, c, i) {
  const id = tourIds[c.slug];
  const stops = routeStops(c);
  const time = c.trip.endTime ? `${c.trip.startTime}–${c.trip.endTime}` : c.trip.startTime;
  const flip = i % 2 === 1;
  const facts = [[L('startTime'), esc(time)], [L('meetingPoint'), esc(c.meeting.place)], [L('pickup'), esc(c.pickup.area)], [L('dropoffNote'), esc(c.pickup.dropoffNote)]];
  return `<article data-component="tour-card" data-repeat-item${i ? ' data-repeat-clone' : ''} id="${id}" class="grid scroll-mt-28 gap-8 md:grid-cols-12" data-slug="${c.slug}">
    <img src="${img(c.cover, 'small')}" width="800" height="533" loading="lazy" alt="${esc(c.trip.title)}" class="aspect-[4/3] w-full rounded-2xl object-cover md:col-span-5 ${flip ? 'md:order-2' : ''}" data-field="cover">
    <div class="md:col-span-7 ${flip ? 'md:order-1' : ''}">
      <p class="flex flex-wrap items-center gap-2"><span class="${t.chipAccent}" data-field="trip.mode">${esc(scopeText(c))}</span><span class="${t.chip}">${esc(chipLabel[id])}</span></p>
      <h2 class="mt-3 ${t.h2}" data-field="trip.title">${esc(c.trip.title)}</h2>
      <p class="mt-1 text-sm ${t.muted}" data-field="trip.destination">${esc(place3(c))}</p>
      <p class="mt-4 text-lg" data-field="summary">${esc(c.summary)}</p>
      ${stops.length >= 2 ? `<p class="mt-4 flex flex-wrap items-center gap-2 text-sm"><b>${esc(L('routeSummary'))}:</b>${stops.slice(0, 5).map((s) => `<span class="${t.chip} !text-xs">${esc(s)}</span>`).join('')}</p>` : ''}
      <div class="mt-5">${dl(t, facts)}</div>
      <div class="mt-6 flex flex-wrap items-center gap-4">
        <p class="text-sm ${t.muted}">From <span class="${t.priceNum}">IDR <span data-field="site.price">${idr(c.price)}</span></span></p>
        <a href="${wa('Hello Wayan, I would like ' + c.trip.title)}" class="${t.btn}">Book on WhatsApp</a>
        <a href="itinerary.html" class="${t.link}">See a sample itinerary</a>
      </div>
    </div>
    ${plan(t, c, i === 0)}
  </article>`;
}

function filterChips(t) {
  const items = [...Object.values(tourIds).map((id) => [id, chipLabel[id]]), ['places', 'Places'], ['airport', 'Airport'], ['custom', 'Custom']];
  const cls = t.name === 'batu' ? 'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-fog px-5 text-sm font-medium hover:bg-ink hover:text-snow' : 'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-snow px-5 text-sm font-semibold hover:bg-navy hover:text-snow';
  const bar = t.name === 'batu' ? 'border-b border-ink/10 bg-snow' : 'border-b border-navy/10 bg-mist';
  return `<!-- component:filter-chips -->
<nav data-component="filter-chips" aria-label="Tour categories" class="${bar}"><ul class="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3" data-repeat="categories">${items.map(([id, name]) => `<li><a href="#${id}" class="${cls}">${esc(name)}</a></li>`).join('')}</ul></nav>
<!-- /component:filter-chips -->`;
}

function airport(t) {
  const box = t.name === 'batu' ? 'rounded-3xl bg-sky p-8' : 'rounded-2xl border border-navy/15 p-8';
  return `<article data-component="tour-card" data-repeat-item data-repeat-clone id="airport" class="scroll-mt-28 ${box}"><p class="${t.chip} inline-block">Airport · about 1,5 hours</p><h2 class="mt-3 ${t.h2}">Airport Transfer, Ngurah Rai to Ubud</h2><p class="mt-3 max-w-2xl">Wayan waits at arrivals with your name on a card. Up to 4 large bags. Flight delays are not charged. Fixed price, no meter.</p><div class="mt-6 flex flex-wrap items-center gap-4"><p class="text-sm ${t.muted}">Fixed price <span class="${t.priceNum}">IDR ${idr(rates.airport)}</span></p><a href="${wa('Hello Wayan, airport transfer')}" class="${t.btn}">Book this transfer</a></div></article>`;
}

function placesBlock(t) {
  const g = data.placesGuide;
  const runs = [];
  g.places.forEach((p, i) => { const last = runs[runs.length - 1]; if (last && last.group === (p.group || '')) last.items.push([p, i]); else runs.push({ group: p.group || '', items: [[p, i]] }); });
  const credits = creditsOf([...data.tours.flatMap((c) => [c.cover, ...c.days.map((d) => d.photo)]), ...g.places.map((p) => p.photo)]);
  const card = (p, i) => {
    const facts = [[L('suggestedDuration'), p.suggestedDuration], [L('bestTime'), p.bestTime], [L('gettingThere'), p.gettingThere], [L('nearby'), p.nearby]].filter(([, v]) => v);
    return `<article data-component="place-card" data-repeat-item data-place-id="${p.id}" class="${t.card} flex flex-col !p-0 overflow-hidden">${p.photo ? `<img src="${img(p.photo, 'small')}" width="800" height="533" loading="lazy" alt="${esc(p.name)}" class="aspect-[16/9] w-full object-cover" data-field="place.photo">` : ''}
      <div class="flex flex-1 flex-col p-7"><p class="${t.dt}">${String(i + 1).padStart(2, '0')}</p><h4 class="mt-1 ${t.h3}" data-field="place.name">${esc(p.name)}</h4><p class="text-sm font-semibold ${t.muted}" data-field="place.area">${esc(p.area)}</p>
      <p class="mt-3" data-field="place.description">${esc(p.description)}</p>
      ${facts.length ? `<dl class="mt-5 grid gap-4 text-sm">${facts.map(([k, v]) => `<div><dt class="${t.dt}">${esc(k)}</dt><dd class="mt-1">${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${p.tips.length ? `<p class="mt-5 ${t.tip}" data-field="place.tips"><b>${esc(L('localTip'))}</b> · ${p.tips.map(esc).join(' · ')}</p>` : ''}</div></article>`;
  };
  return `<!-- component:places -->
<section data-component="places" id="places" data-section="guide" class="${t.name === 'batu' ? 'bg-fog' : 'bg-mist'} scroll-mt-28"><div class="mx-auto max-w-6xl px-5 py-20">
  <p class="${t.eyebrow}">${esc(L('exploreDestinations'))}</p><h2 class="${t.h2}" data-field="trip.title">${esc(g.trip.title)}</h2><p class="mt-3 max-w-2xl text-lg" data-field="summary">${esc(g.summary)}</p>
  ${runs.map((r) => `<section class="mt-12">${r.group ? `<h3 class="${t.h3} mb-5" data-field="place.group">${esc(r.group)}</h3>` : ''}<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-repeat="places">${r.items.map(([p, i]) => card(p, i)).join('')}</div></section>`).join('')}
  <div class="mt-12 text-sm ${t.muted}">${esc(g.disclaimer)}</div>
  ${creditHtml(credits, `mt-4 text-xs ${t.muted}`)}
</div></section>
<!-- /component:places -->`;
}

function tourGrid(t) {
  return `<!-- component:tour-grid -->
<section data-component="tour-grid" class="mx-auto max-w-6xl px-5 py-16"><div class="space-y-20" data-repeat="tours">
${data.tours.map((c, i) => tourCard(t, c, i)).join('\n')}
${airport(t)}
</div></section>
<!-- /component:tour-grid -->`;
}

// ---------------------------------------------------------------- tulis ke file
function block(html, name) { const a = html.indexOf(`<!-- component:${name} -->`), tag = `<!-- /component:${name} -->`, b = html.indexOf(tag); return a < 0 || b < 0 ? null : [a, b + tag.length]; }
function replaceBlock(html, name, repl) { const r = block(html, name); if (!r) throw new Error('block not found: ' + name); return html.slice(0, r[0]) + repl + html.slice(r[1]); }
function ldTours() {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'ItemList', name: 'Private driver tours from Ubud', itemListElement: data.tours.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristTrip', name: c.trip.title, description: c.summary, offers: { '@type': 'Offer', price: String(c.price), priceCurrency: 'IDR' } } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.example.com/' }, { '@type': 'ListItem', position: 2, name: 'Tours', item: 'https://www.example.com/activities.html' }] }] }, null, 2).replace(/^/gm, '  ');
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['sawah', 'batu'];
for (const name of targets) {
  const t = themes[name];
  // itinerary
  let f = `templates/${name}/itinerary.html`;
  let html = fs.readFileSync(f, 'utf8');
  const a = html.indexOf('<main id="main"'), b = html.indexOf('</main>');
  if (a < 0 || b < 0) throw new Error('main not found in ' + f);
  html = html.slice(0, a) + itineraryMain(t) + html.slice(b + '</main>'.length);
  fs.writeFileSync(f, html);
  // activities
  f = `templates/${name}/activities.html`;
  html = fs.readFileSync(f, 'utf8');
  html = replaceBlock(html, 'filter-chips', filterChips(t));
  html = replaceBlock(html, 'tour-grid', tourGrid(t));
  if (block(html, 'places')) html = replaceBlock(html, 'places', placesBlock(t));
  else { const r = block(html, 'tour-grid'); html = html.slice(0, r[1]) + '\n\n' + placesBlock(t) + html.slice(r[1]); }
  const s = html.indexOf('<script type="application/ld+json">'), e = html.indexOf('</script>', s);
  html = html.slice(0, s) + '<script type="application/ld+json">\n' + ldTours() + '\n  ' + html.slice(e);
  fs.writeFileSync(f, html);
  console.log('built', name);
}
