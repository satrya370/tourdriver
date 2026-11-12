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
    name: 'batu', tourStyle: 'card', stickyTop: 'top-[69px]',
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
  ,
  segara: {
    name: 'segara', tourStyle: 'stack', generatePages: true, stickyTop: 'top-[69px]', skip: 'focus:bg-teal focus:text-snow', tripStyle: 'grid', placesStyle: 'wide', practicalStyle: 'cards',
    h2: 'font-display text-3xl font-semibold sm:text-4xl', h3: 'font-display text-2xl font-semibold', h4: 'font-display text-lg font-semibold',
    eyebrow: 'eyebrow', dt: 'text-xs font-bold tracking-wide text-teal uppercase', dd: 'mt-1 font-semibold', muted: 'text-slate',
    card: 'rounded-3xl bg-snow p-7 shadow-sm ring-1 ring-ink/5', soft: 'rounded-3xl bg-haze p-7', chip: 'rounded-full bg-haze px-3 py-1 text-sm font-semibold',
    chipAccent: 'rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink', tip: 'rounded-xl bg-haze px-3 py-2 text-sm', link: 'font-bold text-teal underline decoration-sun decoration-2 underline-offset-4',
    btn: 'btn-primary', btnGhost: 'btn-outline', closeBtn: 'btn-light', ol: 'space-y-8 border-l-2 border-teal/30 pl-7', bullet: 'text-teal', priceNum: 'font-display text-3xl font-bold text-ink',
    tab: 'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border-2 border-teal/30 px-4 text-sm font-bold text-teal aria-[current=true]:border-teal aria-[current=true]:bg-teal aria-[current=true]:text-snow',
    nav: 'sticky z-30 -mx-5 border-y border-ink/10 bg-snow/95 px-5 py-3 backdrop-blur print:hidden', closing: 'bg-teal text-snow', closingAccent: 'text-sun', closingMuted: 'text-snow/85',
    details: 'rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5', summary: 'flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 px-6 font-bold text-teal-deep', plus: 'text-2xl text-teal',
    minHeader: '<header data-component="header" class="sticky top-0 z-40 border-b border-ink/10 bg-snow/95 backdrop-blur print:hidden"><div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3"><a href="index.html" class="font-display text-xl font-bold text-teal-deep" data-field="business.name">Sudiarta Bali Drive</a><button type="button" onclick="window.print()" class="inline-flex min-h-[44px] items-center rounded-full border-2 border-teal/30 px-4 text-sm font-bold text-teal">Print / PDF</button></div></header>',
    minFooter: '<footer data-component="footer" class="bg-ink px-5 py-8 text-center text-xs text-snow/70 print:hidden"><p>Sample itinerary · Sudiarta Bali Drive</p></footer>',
    pg: { heroSection: 'bg-haze', heroInner: 'text-center', center: true, heroTitle: 'font-display text-4xl font-semibold sm:text-5xl', heroIntro: 'text-slate', crumbs: 'text-slate', heroGhost: 'btn-outline', band: 'bg-haze', dark: 'bg-teal-deep text-snow', darkEyebrow: '!text-sun', cta: 'bg-teal text-snow', ctaBtn: 'btn-light', customBg: 'bg-teal text-snow', customBtn: 'btn-light', faqItem: 'group rounded-3xl bg-snow p-6 shadow-sm ring-1 ring-ink/5', faqSum: 'flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-bold', faqPlus: 'text-2xl text-teal', valueCard: 'rounded-3xl bg-snow/10 p-7' },
    row(a) {
      return `<li class="relative" data-activity-id="${a.id}"><span class="absolute -left-[35px] top-1.5 h-3 w-3 rounded-full bg-teal" aria-hidden="true"></span>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span class="font-bold text-teal" data-field="activity.time">${esc(a.time)}</span><span class="rounded-full bg-haze px-2.5 py-0.5 text-xs font-semibold">${esc(kindLabel(a.kind))}</span>${a.durationMinutes ? `<span class="text-slate">${esc(fmtDur(a.durationMinutes))}</span>` : ''}</p>
        <h4 class="mt-1 font-display text-lg font-semibold" data-field="activity.title">${esc(a.title)}</h4>
        <p class="mt-1 text-ink/80" data-field="activity.description">${esc(a.description)}</p>
        ${a.place ? `<p class="mt-1 text-sm text-slate" data-field="activity.place">${esc(a.place)}</p>` : ''}
        ${a.tip ? `<p class="mt-3 rounded-xl bg-haze px-3 py-2 text-sm" data-field="activity.tip"><b>${esc(L('localTip'))}</b> · ${esc(a.tip)}</p>` : ''}</li>`;
    },
    hero(c, cover) {
      return `<header data-section="hero" class="relative isolate overflow-hidden text-snow"><img src="${cover}" width="1440" height="983" fetchpriority="high" alt="${esc(L('heroPhoto'))}" class="absolute inset-0 -z-20 h-full w-full object-cover" data-field="cover">
        <div class="absolute inset-0 -z-10 bg-ink/55 print:bg-ink/70" aria-hidden="true"></div>
        <div class="mx-auto max-w-3xl px-5 py-24 text-center print:py-10">
          <div class="mb-6 flex items-center justify-center gap-4 text-xs font-bold tracking-widest uppercase"><span data-field="agency.name">${esc(site.agencyName)}</span><span class="rounded-full border border-snow/60 px-3 py-1">${esc(scopeText(c))}</span></div>
          <p class="mb-3 text-xs font-bold tracking-widest text-sun uppercase">${esc(L('mode' + modeKey(c.trip.mode)))}</p>
          <h1 class="font-display text-4xl leading-tight font-semibold sm:text-6xl" data-field="trip.title">${esc(c.trip.title)}</h1>
          <p class="mt-5 text-lg text-snow/90" data-field="trip.destination">${esc(place3(c))}</p></div></header>`;
    }
  },
  endek: {
    name: 'endek', tourStyle: 'overlay', generatePages: true, stickyTop: 'top-[69px]', skip: 'focus:bg-wine focus:text-snow', tripStyle: 'table', placesStyle: 'rows', practicalStyle: 'lines',
    h2: 'font-display text-4xl sm:text-5xl', h3: 'font-display text-3xl', h4: 'font-display text-2xl',
    eyebrow: 'eyebrow', dt: 'text-xs font-semibold tracking-[0.18em] text-wine uppercase', dd: 'mt-1 font-medium', muted: 'text-graphite',
    card: 'rounded-3xl bg-snow p-8 shadow-sm ring-1 ring-ink/5', soft: 'rounded-3xl bg-pearl p-8', chip: 'rounded-full bg-blush px-3 py-1 text-sm font-medium text-wine',
    chipAccent: 'rounded-full bg-wine px-3 py-1 text-xs font-semibold text-snow', tip: 'rounded-xl bg-blush px-3 py-2 text-sm', link: 'font-semibold text-wine underline underline-offset-4',
    btn: 'btn-primary', btnGhost: 'btn-outline', closeBtn: 'btn-light', ol: 'space-y-8 border-l border-ink/20 pl-8', bullet: 'text-wine', priceNum: 'font-display text-4xl font-semibold',
    tab: 'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border border-ink/25 px-4 text-sm font-semibold aria-[current=true]:border-wine aria-[current=true]:bg-wine aria-[current=true]:text-snow',
    nav: 'sticky z-30 -mx-5 border-y border-ink/10 bg-snow/95 px-5 py-3 backdrop-blur print:hidden', closing: 'bg-onyx text-snow', closingAccent: 'text-snow', closingMuted: 'text-snow/70',
    details: 'rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5', summary: 'flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 px-6 font-display text-xl font-semibold', plus: 'text-3xl text-wine',
    minHeader: '<header data-component="header" class="sticky top-0 z-40 bg-onyx text-snow print:hidden"><div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3"><a href="index.html" class="font-display text-2xl font-bold" data-field="business.name">Sudiarta Bali Drive</a><button type="button" onclick="window.print()" class="inline-flex min-h-[44px] items-center rounded-full border border-snow/40 px-4 text-sm font-semibold">Print / PDF</button></div></header>',
    minFooter: '<footer data-component="footer" class="bg-onyx px-5 py-8 text-center text-xs text-snow/70 print:hidden"><p>Sample itinerary · Sudiarta Bali Drive</p></footer>',
    pg: { heroSection: 'bg-onyx text-snow', heroInner: '', center: false, heroTitle: 'font-display text-5xl leading-[0.95] sm:text-7xl', heroIntro: 'text-snow/80', crumbs: 'text-snow/70', heroGhost: 'inline-flex min-h-[48px] items-center justify-center rounded-full border border-snow/60 px-7 py-3 font-semibold text-snow transition hover:border-snow', band: 'bg-pearl', dark: 'bg-onyx text-snow', darkEyebrow: '!text-snow/70', cta: 'bg-wine text-snow', ctaBtn: 'btn-light', customBg: 'bg-onyx text-snow', customBtn: 'btn-light', faqItem: 'group border-b border-ink/10 py-6', faqSum: 'flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl font-semibold', faqPlus: 'text-3xl text-wine', valueCard: 'rounded-3xl bg-snow/10 p-8' },
    row(a) {
      return `<li class="relative" data-activity-id="${a.id}"><span class="absolute -left-[38px] top-2.5 h-3 w-3 rounded-full bg-wine" aria-hidden="true"></span>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1"><span class="font-display text-2xl font-semibold text-wine" data-field="activity.time">${esc(a.time)}</span><span class="rounded-full bg-blush px-2.5 py-0.5 text-xs font-medium text-wine">${esc(kindLabel(a.kind))}</span>${a.durationMinutes ? `<span class="text-sm text-graphite">${esc(fmtDur(a.durationMinutes))}</span>` : ''}</p>
        <h4 class="mt-1 font-display text-2xl font-semibold" data-field="activity.title">${esc(a.title)}</h4>
        <p class="mt-1 text-ink/80" data-field="activity.description">${esc(a.description)}</p>
        ${a.place ? `<p class="mt-1 text-sm text-graphite" data-field="activity.place">${esc(a.place)}</p>` : ''}
        ${a.tip ? `<p class="mt-3 rounded-xl bg-blush px-3 py-2 text-sm" data-field="activity.tip"><b>${esc(L('localTip'))}</b> · ${esc(a.tip)}</p>` : ''}</li>`;
    },
    hero(c, cover) {
      return `<header data-section="hero" class="relative isolate overflow-hidden bg-onyx text-snow"><img src="${cover}" width="1440" height="983" fetchpriority="high" alt="${esc(L('heroPhoto'))}" class="absolute inset-0 -z-20 h-full w-full object-cover" data-field="cover">
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-onyx/80 via-onyx/40 to-onyx/10 print:bg-onyx/70" aria-hidden="true"></div>
        <div class="mx-auto max-w-3xl px-5 pb-16 pt-24 print:pt-10">
          <div class="mb-8 flex items-center justify-between gap-4 text-xs font-semibold tracking-[0.2em] uppercase"><span data-field="agency.name">${esc(site.agencyName)}</span><span class="rounded-full border border-snow/50 px-3 py-1">${esc(scopeText(c))}</span></div>
          <p class="mb-3 text-xs font-semibold tracking-[0.22em] uppercase text-snow/80">${esc(L('mode' + modeKey(c.trip.mode)))}</p>
          <h1 class="max-w-3xl font-display text-5xl leading-[0.98] sm:text-7xl" data-field="trip.title">${esc(c.trip.title)}</h1>
          <p class="mt-5 text-lg text-snow/85" data-field="trip.destination">${esc(place3(c))}</p></div></header>`;
    }
  }
};

// ---------------------------------------------------------------- blok yang dipakai bersama
const dl = (t, items) => `<dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2">${items.map(([k, v, extra]) => `<div${extra || ''}><dt class="${t.dt}">${esc(k)}</dt><dd class="${t.dd}">${v}</dd></div>`).join('')}</dl>`;

function tripInfo(t, c) {
  const dark = t.tripStyle === 'table';
  const linkCls = dark ? 'font-semibold underline underline-offset-4' : t.link;
  const trip = [];
  if (c.trip.startDate) {
    trip.push([L('startDate'), esc(fmtDate(c.trip.startDate))]);
    if (c.trip.mode === 'multi_day') trip.push([L('endDate'), esc(fmtDate(addDays(c.trip.startDate, c.days.length - 1)))]);
  }
  if (c.trip.startTime || c.trip.endTime) trip.push([L('startTime'), esc(c.trip.endTime ? `${c.trip.startTime}–${c.trip.endTime}` : c.trip.startTime)]);
  const meet = [];
  if (c.meeting.place) meet.push([L('meetingPoint'), esc(c.meeting.place)]);
  if (c.meeting.mapsUrl) meet.push([L('mapsLink'), `<a href="${esc(c.meeting.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="${linkCls}">${esc(L('mapsLink'))}</a>`]);
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
  if (c.guide.phone) g.push([L('guidePhone'), `<a href="${wa('Hello ' + c.guide.name + ', question about my itinerary')}" class="${linkCls}">${esc(c.guide.phone)}</a>`]);
  const groups = [['When', trip], ['Where we meet', meet], ['Pickup and drop-off', pick], ['Your guide', g]].filter(([, i]) => i.length);
  const dlc = (dtc, ddc, items, cols = 'sm:grid-cols-2') => `<dl class="grid gap-x-8 gap-y-5 ${cols}">${items.map(([k, v, extra]) => `<div${cols === 'grid-cols-1' ? '' : extra || ''}><dt class="${dtc}">${esc(k)}</dt><dd class="${ddc}">${v}</dd></div>`).join('')}</dl>`;
  if (t.tripStyle === 'table') {
    return `<section data-section="trip-info" class="mt-10 rounded-3xl bg-onyx p-3 text-snow sm:p-5"><div class="divide-y divide-snow/15">${groups.map(([title, items]) => `<div class="grid gap-5 px-5 py-7 md:grid-cols-12"><h3 class="font-display text-2xl md:col-span-3">${esc(title)}</h3><div class="md:col-span-9">${dlc('text-xs font-semibold tracking-[0.18em] text-snow/60 uppercase', 'mt-1 font-medium', items)}</div></div>`).join('')}</div></section>`;
  }
  if (t.tripStyle === 'grid') {
    return `<section data-section="trip-info" class="mt-10 rounded-3xl bg-haze p-8 sm:p-10"><div class="grid gap-x-12 gap-y-10 md:grid-cols-2">${groups.map(([title, items]) => `<div><h3 class="${t.h4} mb-5 text-teal-deep">${esc(title)}</h3>${dlc(t.dt, t.dd, items, 'grid-cols-1')}</div>`).join('')}</div></section>`;
  }
  return `<section data-section="trip-info" class="mt-10"><div class="grid gap-5">${groups.map(([title, items]) => `<div class="${t.card} !p-8"><h3 class="${t.h4} mb-6">${esc(title)}</h3>${dlc(t.dt, t.dd, items)}</div>`).join('')}</div></section>`;
}

function practical(t, c) {
  const groups = [['included', c.included], ['notIncluded', c.notIncluded], ['whatToBring', c.whatToBring], ['notSuitableFor', c.notSuitableFor], ['notAllowed', c.notAllowed],
    ...(c.localTips.length ? [['localTip', c.localTips]] : []), ...(c.emergencyContacts.length ? [['emergencyContact', c.emergencyContacts.map((e) => `${e.label}: ${e.value}`)]] : [])].filter(([, v]) => v.length);
  if (!groups.length) return '';
  const head = `<h2 class="${t.h2}">${esc(L('practicalInfo'))}</h2>`;
  if (t.practicalStyle === 'lines') {
    return `<section class="mt-16" id="practical" data-section="practical">${head}<div class="mt-10 grid gap-x-14 gap-y-12 md:grid-cols-2">${groups.map(([k, v]) => `<article><h3 class="${t.h4} border-b border-ink/20 pb-3">${esc(L(k))}</h3><ul class="divide-y divide-ink/10 text-sm">${v.map((x) => `<li class="py-2.5">${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div></section>`;
  }
  return `<section class="mt-16" id="practical" data-section="practical">${head}<div class="mt-8 grid gap-5 md:grid-cols-2">${groups.map(([k, v]) => `<article class="${t.card}"><h3 class="${t.h4}">${esc(L(k))}</h3><ul class="mt-3 space-y-2 text-sm">${v.map((x) => `<li class="flex gap-2"><span class="${t.bullet}" aria-hidden="true">•</span><span>${esc(x)}</span></li>`).join('')}</ul></article>`).join('')}</div></section>`;
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
  const closing = `<footer data-section="closing" class="mt-16 ${t.closing} ${closingTone} p-8 sm:p-10"><h2 class="font-display text-3xl font-bold ${t.name === 'batu' ? '!font-sans' : ''}">${esc(L('closingHeading'))}</h2>${c.closingNote ? `<p class="mt-3">${esc(c.closingNote)}</p>` : ''}<p class="mt-3 font-semibold">${esc(site.agencyContact)}</p><a href="${wa('Hello ' + c.guide.name + ', question about my itinerary')}" class="${t.closeBtn || t.btn} mt-5 print:hidden">WhatsApp ${esc(c.guide.name.split(' ')[0])}</a>${c.disclaimer ? `<p class="mt-6 text-sm ${t.closingMuted}">${esc(c.disclaimer)}</p>` : ''}${creditHtml(credits, `mt-4 border-t border-snow/20 pt-4 text-xs ${t.closingMuted}`)}<p class="mt-3 text-xs ${t.closingMuted}">${esc(L('generatedDate'))}: ${esc(fmtDate(site.generatedDate))}</p></footer>`;
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
  const attrs = `data-component="tour-card" data-repeat-item${i ? ' data-repeat-clone' : ''} id="${id}" data-slug="${c.slug}"`;
  const facts = [[L('startTime'), esc(time)], [L('meetingPoint'), esc(c.meeting.place)], [L('pickup'), esc(c.pickup.area)], [L('dropoffNote'), esc(c.pickup.dropoffNote)]];
  const style = t.tourStyle || 'split';
  const light = style === 'overlay';
  const chips = `<p class="flex flex-wrap items-center gap-2"><span class="${t.chipAccent}" data-field="trip.mode">${esc(scopeText(c))}</span><span class="${light ? 'rounded-full bg-snow/20 px-3 py-1 text-sm font-medium backdrop-blur' : t.chip}">${esc(chipLabel[id])}</span></p>`;
  const title = `<h2 class="mt-3 ${t.h2}" data-field="trip.title">${esc(c.trip.title)}</h2><p class="mt-1 text-sm ${light ? 'text-snow/80' : t.muted}" data-field="trip.destination">${esc(place3(c))}</p>`;
  const summary = `<p class="mt-4 text-lg ${light ? 'max-w-2xl text-snow/90' : ''}" data-field="summary">${esc(c.summary)}</p>`;
  const route = stops.length >= 2 ? `<p class="mt-4 flex flex-wrap items-center gap-2 text-sm"><b>${esc(L('routeSummary'))}:</b>${stops.slice(0, 5).map((s) => `<span class="${light ? 'rounded-full bg-snow/20 px-2.5 py-0.5 text-xs backdrop-blur' : t.chip + ' !text-xs'}">${esc(s)}</span>`).join('')}</p>` : '';
  const price = (dark) => `<p class="text-sm ${dark ? 'text-snow/80' : t.muted}">From <span class="${t.priceNum} ${dark ? '!text-snow' : ''}">IDR <span data-field="site.price">${idr(c.price)}</span></span></p>`;
  const book = (cls) => `<a href="${wa('Hello Wayan, I would like ' + c.trip.title)}" class="${cls}">Book on WhatsApp</a>`;
  const sample = (cls) => `<a href="itinerary.html" class="${cls}">See a sample itinerary</a>`;
  const factsDl = (cols, dtc, ddc) => `<dl class="grid gap-x-8 gap-y-4 ${cols}">${facts.map(([k, v]) => `<div><dt class="${dtc}">${esc(k)}</dt><dd class="${ddc}">${v}</dd></div>`).join('')}</dl>`;
  const planHtml = plan(t, c, i === 0);

  if (style === 'overlay') {
    return `<article ${attrs} class="scroll-mt-28"><div class="relative isolate flex min-h-[440px] flex-col justify-end overflow-hidden rounded-3xl text-snow"><img src="${img(c.cover)}" width="1440" height="960" loading="lazy" alt="${esc(c.trip.title)}" class="absolute inset-0 -z-20 h-full w-full object-cover" data-field="cover"><div class="absolute inset-0 -z-10 bg-gradient-to-t from-onyx via-onyx/55 to-onyx/5" aria-hidden="true"></div>
      <div class="p-8 md:p-12">${chips}${title}${summary}${route}<div class="mt-7 flex flex-wrap items-center gap-5">${price(true)}${book('btn-light')}${sample('font-semibold underline underline-offset-4')}</div></div></div>
      <div class="mt-8">${factsDl('sm:grid-cols-2 lg:grid-cols-4', t.dt, t.dd)}</div>${planHtml}</article>`;
  }
  if (style === 'stack') {
    return `<article ${attrs} class="scroll-mt-28 overflow-hidden rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5"><img src="${img(c.cover)}" width="1440" height="960" loading="lazy" alt="${esc(c.trip.title)}" class="aspect-[21/9] w-full object-cover" data-field="cover">
      <div class="grid gap-8 p-8 md:grid-cols-12"><div class="md:col-span-7">${chips}${title}${summary}${route}</div>
      <div class="rounded-2xl bg-haze p-6 md:col-span-5">${factsDl('grid-cols-1', t.dt, t.dd)}<div class="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-5">${price(false)}</div><div class="mt-4 flex flex-wrap items-center gap-4">${book(t.btn)}${sample(t.link)}</div></div></div>
      <div class="px-8 pb-8">${planHtml}</div></article>`;
  }
  if (style === 'card') {
    return `<article ${attrs} class="scroll-mt-28 overflow-hidden rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5 md:grid md:grid-cols-12"><img src="${img(c.cover, 'small')}" width="800" height="533" loading="lazy" alt="${esc(c.trip.title)}" class="aspect-[4/3] w-full object-cover md:col-span-5 md:aspect-auto md:h-full" data-field="cover">
      <div class="p-7 md:col-span-7 md:p-9">${chips}${title}${summary}${route}<div class="mt-5">${factsDl('sm:grid-cols-2', t.dt, t.dd)}</div><div class="mt-6 flex flex-wrap items-center gap-4">${price(false)}${book(t.btn)}${sample(t.link)}</div></div>
      <div class="px-6 pb-6 md:col-span-12">${planHtml}</div></article>`;
  }
  const flip = i % 2 === 1;
  return `<article ${attrs} class="grid scroll-mt-28 gap-8 md:grid-cols-12">
    <img src="${img(c.cover, 'small')}" width="800" height="533" loading="lazy" alt="${esc(c.trip.title)}" class="aspect-[4/3] w-full rounded-2xl object-cover md:col-span-5 ${flip ? 'md:order-2' : ''}" data-field="cover">
    <div class="md:col-span-7 ${flip ? 'md:order-1' : ''}">${chips}${title}${summary}${route}<div class="mt-5">${factsDl('sm:grid-cols-2', t.dt, t.dd)}</div><div class="mt-6 flex flex-wrap items-center gap-4">${price(false)}${book(t.btn)}${sample(t.link)}</div></div>
    ${planHtml}
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
  const style = t.placesStyle || 'grid';
  const factsOf = (p) => [[L('suggestedDuration'), p.suggestedDuration], [L('bestTime'), p.bestTime], [L('gettingThere'), p.gettingThere], [L('nearby'), p.nearby]].filter(([, v]) => v);
  const factsHtml = (p, cols) => { const f = factsOf(p); return f.length ? `<dl class="mt-5 grid gap-4 text-sm ${cols}">${f.map(([k, v]) => `<div><dt class="${t.dt}">${esc(k)}</dt><dd class="mt-1">${esc(v)}</dd></div>`).join('')}</dl>` : ''; };
  const tipHtml = (p) => (p.tips.length ? `<p class="mt-5 ${t.tip}" data-field="place.tips"><b>${esc(L('localTip'))}</b> · ${p.tips.map(esc).join(' · ')}</p>` : '');
  const body = (p, i, h) => `<p class="${t.dt}">${String(i + 1).padStart(2, '0')}</p><h4 class="mt-1 ${h}" data-field="place.name">${esc(p.name)}</h4><p class="text-sm font-semibold ${t.muted}" data-field="place.area">${esc(p.area)}</p><p class="mt-3" data-field="place.description">${esc(p.description)}</p>`;
  const photoImg = (p, cls) => (p.photo ? `<img src="${img(p.photo, 'small')}" width="800" height="533" loading="lazy" alt="${esc(p.name)}" class="${cls}" data-field="place.photo">` : '');
  const card = (p, i, k) => {
    const attrs = `data-component="place-card" data-repeat-item data-place-id="${p.id}"`;
    if (style === 'rows') {
      return `<article ${attrs} class="grid gap-8 md:grid-cols-12 md:items-center">${p.photo ? photoImg(p, `aspect-[4/3] w-full rounded-3xl object-cover md:col-span-7 ${k % 2 ? 'md:order-2' : ''}`) : ''}<div class="${p.photo ? 'md:col-span-5' : 'md:col-span-12 md:max-w-2xl'}">${body(p, i, 'font-display text-4xl')}${factsHtml(p, '')}${tipHtml(p)}</div></article>`;
    }
    if (style === 'wide') {
      return `<article ${attrs} class="grid overflow-hidden rounded-3xl bg-snow shadow-sm ring-1 ring-ink/5 md:grid-cols-5">${photoImg(p, 'aspect-[16/9] h-full w-full object-cover md:col-span-2 md:aspect-auto')}<div class="p-8 ${p.photo ? 'md:col-span-3' : 'md:col-span-5'}">${body(p, i, t.h3)}${factsHtml(p, 'sm:grid-cols-2')}${tipHtml(p)}</div></article>`;
    }
    return `<article ${attrs} class="${t.card} flex flex-col !p-0 overflow-hidden">${photoImg(p, 'aspect-[16/9] w-full object-cover')}<div class="flex flex-1 flex-col p-7">${body(p, i, t.h3)}${factsHtml(p, '')}${tipHtml(p)}</div></article>`;
  };
  const wrap = style === 'rows' ? 'space-y-14' : style === 'wide' ? 'grid gap-6' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';
  const bg = t.pg ? t.pg.band : (t.name === 'batu' ? 'bg-fog' : 'bg-mist');
  return `<!-- component:places -->
<section data-component="places" id="places" data-section="guide" class="${bg} scroll-mt-28"><div class="mx-auto max-w-6xl px-5 py-20">
  <p class="${t.eyebrow}">${esc(L('exploreDestinations'))}</p><h2 class="${t.h2}" data-field="trip.title">${esc(g.trip.title)}</h2><p class="mt-3 max-w-2xl text-lg" data-field="summary">${esc(g.summary)}</p>
  ${runs.map((r) => `<section class="mt-12">${r.group ? `<h3 class="${t.h3} mb-6" data-field="place.group">${esc(r.group)}</h3>` : ''}<div class="${wrap}" data-repeat="places">${r.items.map(([p, i], k) => card(p, i, k)).join('')}</div></section>`).join('')}
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

// ---------------------------------------------------------------- konten statis (tema yang dibuat penuh oleh skrip)
const ratingChips = (t) => `<ul class="mt-6 flex flex-wrap gap-2 text-sm font-medium ${t.pg.center ? 'justify-center' : ''}"><li class="${t.chip}">★ 4.9 · 180 Google reviews</li><li class="${t.chip}">Free cancellation up to 24 h</li></ul>`;
function pageHero(t, { crumb, title, intro, extra = '' }) {
  const c = t.pg.center;
  return `<!-- component:page-hero -->
<section data-component="page-hero" class="${t.pg.heroSection}"><div class="mx-auto max-w-5xl px-5 py-16 md:py-24 ${t.pg.heroInner}"><p class="text-sm ${t.pg.crumbs}"><a href="index.html" class="underline underline-offset-4">Home</a> / ${esc(crumb)}</p><h1 class="mt-4 ${t.pg.heroTitle}">${title}</h1><p class="mt-5 max-w-2xl text-lg ${t.pg.heroIntro} ${c ? 'mx-auto' : ''}">${intro}</p>${extra}</div></section>
<!-- /component:page-hero -->`;
}
const customRoute = (t) => `<!-- component:custom-route -->
<section data-component="custom-route" id="custom" class="scroll-mt-28 ${t.pg.customBg}"><div class="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2 md:items-center"><div><h2 class="${t.h2}">None of these fit?</h2><p class="mt-4 opacity-90">Send the places you want, the number of hours and your hotel. Wayan replies with a route and a price, usually within the hour. Half day IDR ${idr(rates.half_day)}, full day IDR ${idr(rates.full_day)}, extra hour IDR ${idr(rates.overtime)}.</p></div><div class="md:justify-self-end"><a href="${wa('Hello Wayan, I would like a custom route')}" class="${t.pg.customBtn} !min-h-[54px] !px-8">Describe your day on WhatsApp</a></div></div></section>
<!-- /component:custom-route -->`;
const faq = (t, eyebrow, heading, items) => `<!-- component:faq -->
<section data-component="faq" class="mx-auto max-w-3xl px-5 py-20"><p class="${t.eyebrow}">${esc(eyebrow)}</p><h2 class="${t.h2}">${esc(heading)}</h2><div class="mt-10 space-y-3" data-repeat="faq">${items.map(([q, a], i) => `<details class="${t.pg.faqItem}" data-repeat-${i ? 'clone' : 'item'}><summary class="${t.pg.faqSum}">${esc(q)} <span class="${t.pg.faqPlus} transition group-open:rotate-45" aria-hidden="true">+</span></summary><p class="mt-3 ${t.muted}">${esc(a)}</p></details>`).join('')}</div></section>
<!-- /component:faq -->`;
const ctaBand = (t, title) => `<!-- component:cta -->
<section data-component="cta" class="${t.pg.cta}"><div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between"><h2 class="max-w-2xl ${t.h2}">${esc(title)}</h2><a href="${wa('Hello Wayan, I am in Bali on ...')}" class="${t.pg.ctaBtn} !min-h-[54px] !px-8">Chat on WhatsApp</a></div></section>
<!-- /component:cta -->`;
const tourFaq = [['Can I change the order of the stops?', 'Yes. Wayan may suggest a different order to avoid crowds, and tells you before changing anything.'], ['Are entrance tickets included?', 'No. Tickets are paid at each place. Wayan can tell you the current prices before you go.'], ['Can a tour be shorter or longer?', 'Yes. Extra hours are IDR 60.000 each. Shorter trips are charged at the half-day rate.'], ['What is the cancellation policy?', 'Cancel up to 24 hours before pickup for a full refund. Later cancellations are charged half the day rate.']];

function activitiesMain(t) {
  const c = t.pg.center ? 'justify-center' : '';
  const extra = `${ratingChips(t)}<div class="mt-8 flex flex-col gap-3 sm:flex-row ${c}"><a href="${wa('Hello Wayan, I would like to ask about a tour')}" class="${t.btn} !min-h-[52px] !px-8">Ask about a tour</a><a href="#custom" class="${t.pg.heroGhost} !min-h-[52px]">Build my own route</a></div>`;
  return `<main id="main" data-engine="activities">
${pageHero(t, { crumb: 'Tours', title: 'Pick a route, or let Wayan build one.', intro: 'Prices are per car, up to 6 passengers. Petrol, parking and water are included in every tour.', extra })}
${filterChips(t)}
${tourGrid(t)}
${placesBlock(t)}
${customRoute(t)}
${faq(t, 'Tour questions', 'Before you book.', tourFaq)}
${ctaBand(t, 'Found a tour you like? Send your date.')}
</main>`;
}

function aboutMain(t) {
  const c = t.pg.center ? 'justify-center' : '';
  const story = ["I was born in Ubud and started driving for my uncle's guests in 2014. Back then I knew three routes. Now I know the ones that avoid the market traffic on Saturdays.", 'Most guests book me for one day and come back for the next trip. Families like the slower pace. Couples ask for a route that stops at the right viewpoints without rushing.', 'I speak English and Bahasa Indonesia. I can explain temple etiquette, the ceremony calendar, and why we leave small offerings on the car dashboard.'];
  const values = [['On time, every time', 'I arrive 10 minutes before pickup. If traffic changes the plan, you hear it from me first.'], ['A safe, clean car', 'The car is serviced every 5.000 km. I check tyres and brakes before the first trip of the day.'], ['Honest advice', 'I suggest an order that avoids the crowds, and I take no commission from shops.']];
  const feats = ['Air conditioning', 'USB chargers', 'Child seat (on request)', 'Bottled water', 'Wi-Fi hotspot', 'Cooler box'];
  const creds = [['Experience', '11 years'], ['Languages', 'English, Bahasa Indonesia'], ['Licence', 'SIM A Umum'], ['Based in', 'Ubud, Gianyar']];
  return `<main id="main" data-engine="about">
${pageHero(t, { crumb: 'About', title: 'Hi, I am Wayan. Eleven years on the same roads.', intro: 'I drive guests around Ubud, Kintamani and the south coast of Bali. Here is how I work and what you can expect.', extra: `<div class="mt-8 flex flex-col gap-3 sm:flex-row ${c}"><a href="${wa('Hello Wayan')}" class="${t.btn}">Message Wayan</a><a href="activities.html" class="${t.pg.heroGhost}">See tours</a></div>` })}
<!-- component:driver-story -->
<section data-component="driver-story" class="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-12 md:items-center"><div class="md:col-span-5"><div class="photo-slot aspect-[4/5] rounded-3xl p-6" data-field="driver.photo_about">[FOTO: Wayan tersenyum di samping mobil, portrait 4:5]</div></div><div class="space-y-6 text-lg leading-relaxed md:col-span-7">${story.map((p, i) => `<p data-field="driver.story.${i}">${esc(p)}</p>`).join('')}</div></section>
<!-- /component:driver-story -->
<!-- component:values -->
<section data-component="values" class="${t.pg.dark}"><div class="mx-auto max-w-6xl px-5 py-20"><p class="${t.eyebrow} ${t.pg.darkEyebrow}">How I work</p><h2 class="max-w-2xl ${t.h2}">Three things I do on every trip.</h2><ol class="mt-10 grid gap-5 md:grid-cols-3" data-repeat="values">${values.map(([h, p], i) => `<li class="${t.pg.valueCard}"><span class="font-display text-5xl font-semibold ${t.closingAccent}">${i + 1}</span><h3 class="mt-3 ${t.h3}">${esc(h)}</h3><p class="mt-2 opacity-85">${esc(p)}</p></li>`).join('')}</ol></div></section>
<!-- /component:values -->
<!-- component:fleet -->
<section data-component="fleet" class="mx-auto max-w-6xl px-5 py-20"><p class="${t.eyebrow}">The car</p><div class="mt-4 grid gap-10 md:grid-cols-12 md:items-center"><div class="md:col-span-7"><div class="photo-slot aspect-[3/2] rounded-3xl p-6" data-field="fleet.0.photo">[FOTO: Toyota Innova putih, sisi samping, siang hari]</div></div><div class="md:col-span-5"><h2 class="${t.h2}" data-field="fleet.0.name">Toyota Innova</h2><p class="mt-2 ${t.muted}">Up to 6 passengers · 4 large bags</p><ul class="mt-6 grid grid-cols-2 gap-x-6 gap-y-3" data-repeat="features">${feats.map((f) => `<li><span class="${t.bullet}" aria-hidden="true">✓</span> ${esc(f)}</li>`).join('')}</ul></div></div></section>
<!-- /component:fleet -->
<!-- component:credentials -->
<section data-component="credentials" class="mx-auto max-w-6xl px-5 pb-20"><dl class="grid gap-4 md:grid-cols-4">${creds.map(([k, v]) => `<div class="${t.card} !p-6"><dt class="${t.dt}">${esc(k)}</dt><dd class="mt-2 ${t.h4}">${esc(v)}</dd></div>`).join('')}</dl></section>
<!-- /component:credentials -->
<!-- component:testimonials -->
<section data-component="testimonials" class="mx-auto max-w-4xl px-5 pb-20 text-center"><blockquote class="${t.soft}"><p class="text-lg ${t.name === 'endek' ? 'text-wine' : 'text-sun'}" aria-label="5 stars">★★★★★</p><p class="mt-3 text-xl leading-relaxed" data-field="testimonials.0.text">"He picked us up at 3.30 and we were the first at the rim. He was patient with our kids and knew exactly where to stop for breakfast."</p><footer class="mt-5 text-sm ${t.muted}"><span class="font-semibold text-ink">Sarah K.</span> · Melbourne · March 2026 · Google</footer></blockquote><p class="mt-4 text-sm ${t.muted}">4.9 out of 5 from 180 Google reviews</p></section>
<!-- /component:testimonials -->
${ctaBand(t, 'Tell Wayan where you want to go.')}
</main>`;
}

// ---------------------------------------------------------------- pembungkus halaman (head, header, footer dari landing tema)
function shell(name, t, p) {
  const idx = fs.readFileSync(`templates/${name}/index.html`, 'utf8');
  const fonts = idx.split('\n').find((l) => l.includes('fonts.googleapis.com/css2')).trim();
  const themeColor = /<meta name="theme-color" content="([^"]+)">/.exec(idx)[1];
  const take = (b) => { const r = block(idx, b); return r ? idx.slice(r[0], r[1]) : ''; };
  const fix = (h) => h.split('href="#').join('href="index.html#').replace('>On this page<', '>Explore<');
  const header = p.minimal ? t.minHeader : fix(take('header'));
  const footer = p.minimal ? t.minFooter : fix(take('footer'));
  const sticky = p.minimal ? '' : take('wa-sticky');
  const hre = p.noindex ? '' : `\n  <link rel="alternate" hreflang="en" href="https://www.example.com/${p.file}">\n  <link rel="alternate" hreflang="id" href="https://www.example.com/id/${p.file}">\n  <link rel="alternate" hreflang="x-default" href="https://www.example.com/${p.file}">`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- DUMMY: isi contoh. Halaman ini dihasilkan oleh scripts/build-engine-pages.mjs. Foto contoh: lihat shared/photos/CREDITS.md -->
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}">${p.noindex ? '\n  <meta name="robots" content="noindex,nofollow">' : ''}
  <link rel="canonical" href="https://www.example.com/${p.file}">${hre}
  <meta name="theme-color" content="${themeColor}">
  <meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(p.description)}">
  <meta property="og:url" content="https://www.example.com/${p.file}">
  <meta property="og:image" content="https://www.example.com/assets/img/og-1200x630.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fonts}
  <link rel="stylesheet" href="dist/output.css">
  <script type="application/ld+json">
${p.ld}
  </script>
</head>
<body class="min-h-screen pb-20 md:pb-0 print:pb-0">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full ${t.skip} focus:px-4 focus:py-2">Skip to content</a>

${header}

${p.main}

${footer}

${sticky}

<script src="assets/site.js" defer></script>
</body>
</html>
`;
}
const bc = (name, file) => ({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.example.com/' }, { '@type': 'ListItem', position: 2, name, item: `https://www.example.com/${file}` }] });
const ld = (o) => JSON.stringify(o, null, 2).replace(/^/gm, '  ');
const ldAbout = () => ld({ '@context': 'https://schema.org', '@graph': [{ '@type': 'AboutPage', '@id': 'https://www.example.com/about.html', url: 'https://www.example.com/about.html', name: 'About Wayan Sudiarta', inLanguage: 'en', mainEntity: { '@type': 'Person', name: 'Wayan Sudiarta', jobTitle: 'Private driver', worksFor: { '@id': 'https://www.example.com/#business' }, knowsLanguage: ['en', 'id'], areaServed: 'Bali' } }, bc('About', 'about.html')] });
const ldItinerary = () => ld({ '@context': 'https://schema.org', '@type': 'TouristTrip', name: data.itinerary.trip.title, touristType: 'Leisure', inLanguage: 'en', provider: { '@id': 'https://www.example.com/#business' }, itinerary: { '@type': 'ItemList', itemListElement: data.itinerary.days.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.title })) } });

function writePages(name, t) {
  const pages = [
    { file: 'itinerary.html', title: 'Sample itinerary: 3 days in Bali | Sudiarta Bali Drive', description: 'Sample three-day Bali itinerary by private driver: Kintamani sunrise, Ubud and the south coast. Times, places and tips for each day.', noindex: true, minimal: true, ld: ldItinerary(), main: itineraryMain(t) },
    { file: 'activities.html', title: 'Bali Tours with a Private Driver | Sudiarta Bali Drive', description: 'Kintamani sunrise, Ubud terraces, Uluwatu sunset, Bedugul and Tanah Lot, plus airport transfers. Private driver tours from Ubud, prices per car, free cancellation.', ld: ldTours(), main: activitiesMain(t) },
    { file: 'about.html', title: 'About Wayan Sudiarta, Private Driver in Ubud | Sudiarta Bali Drive', description: 'Meet Wayan Sudiarta, a private driver in Ubud since 2014. How he works, the car he drives, the languages he speaks and what guests say.', ld: ldAbout(), main: aboutMain(t) }
  ];
  for (const p of pages) fs.writeFileSync(`templates/${name}/${p.file}`, shell(name, t, p));
}

function patchExisting(name, t) {
  let f = `templates/${name}/itinerary.html`;
  let html = fs.readFileSync(f, 'utf8');
  const a = html.indexOf('<main id="main"'), b = html.indexOf('</main>');
  if (a < 0 || b < 0) throw new Error('main not found in ' + f);
  html = html.slice(0, a) + itineraryMain(t) + html.slice(b + '</main>'.length);
  fs.writeFileSync(f, html);
  f = `templates/${name}/activities.html`;
  html = fs.readFileSync(f, 'utf8');
  html = replaceBlock(html, 'filter-chips', filterChips(t));
  html = replaceBlock(html, 'tour-grid', tourGrid(t));
  if (block(html, 'places')) html = replaceBlock(html, 'places', placesBlock(t));
  else { const r = block(html, 'tour-grid'); html = html.slice(0, r[1]) + '\n\n' + placesBlock(t) + html.slice(r[1]); }
  const s = html.indexOf('<script type="application/ld+json">'), e = html.indexOf('</script>', s);
  html = html.slice(0, s) + '<script type="application/ld+json">\n' + ldTours() + '\n  ' + html.slice(e);
  fs.writeFileSync(f, html);
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['sawah', 'batu', 'segara', 'endek'];
for (const name of targets) {
  const t = themes[name];
  if (!t) throw new Error('unknown theme ' + name);
  if (t.generatePages) writePages(name, t); else patchExisting(name, t);
  console.log('built', name);
}
