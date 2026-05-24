import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function fmtBudget(n, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return '$' + (n || 0);
  }
}

const SLOT_CFG = {
  morning: { label: 'Morning', time: '08:00 AM' },
  morningActivity: { label: 'Activity', time: '10:00 AM' },
  afternoon: { label: 'Afternoon', time: '12:30 PM' },
  afternoonActivity: { label: 'Activity', time: '02:30 PM' },
  evening: { label: 'Evening', time: '05:00 PM' },
  eveningActivity: { label: 'Activity', time: '07:30 PM' },
  night: { label: 'Night', time: '09:00 PM' },
  nightActivity: { label: 'Activity', time: '10:30 PM' },
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeDayPlans(dayData) {
  const slots = ['morning', 'morningActivity', 'afternoon', 'afternoonActivity', 'evening', 'eveningActivity', 'night', 'nightActivity'];
  if (Array.isArray(dayData?.plans)) {
    return dayData.plans.map((plan, index) => ({
      slotKey: plan.slotKey || slots[index] || 'morning',
      time: plan.time || SLOT_CFG[slots[index] || 'morning']?.time || '08:00 AM',
      place: plan.place || 'Planned stop',
      description: plan.description || plan.activity || '',
      cost: plan.cost || 0,
      locationLink: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(plan.place || ''),
    }));
  }
  return slots.map((slotKey) => {
    const item = dayData?.[slotKey];
    if (!item?.place) return null;
    return {
      slotKey,
      time: item.time || SLOT_CFG[slotKey]?.time || '08:00 AM',
      place: item.place,
      description: item.activity || item.description || '',
      cost: item.cost || 0,
      locationLink: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(item.place || ''),
    };
  }).filter(Boolean);
}

function padTimeChunk(value) {
  return String(value).padStart(2, '0');
}

function parseTimeToMinutes(label = '08:00 AM') {
  const match = String(label).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 8 * 60;
  let hh = Number(match[1]);
  const mm = Number(match[2]);
  const meridian = (match[3] || '').toUpperCase();
  if (meridian === 'PM' && hh !== 12) hh += 12;
  if (meridian === 'AM' && hh === 12) hh = 0;
  return hh * 60 + mm;
}

function formatMinutes(totalMinutes) {
  const hh24 = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  const meridian = hh24 >= 12 ? 'PM' : 'AM';
  const hh12 = hh24 % 12 || 12;
  return padTimeChunk(hh12) + ':' + padTimeChunk(mm) + ' ' + meridian;
}

function inferStopType(plan) {
  const raw = (plan.slotKey + ' ' + plan.place + ' ' + plan.description).toLowerCase();
  if (/beach|coast|sea|shore|marina/.test(raw)) return 'beach';
  if (/temple|church|mosque|basilica|fort|museum|gallery|palace|ashram|heritage|historic/.test(raw)) return 'heritage';
  if (/food|cafe|restaurant|dining|lunch|breakfast|tiffin|biryani|market/.test(raw)) return 'food';
  if (/park|garden|lake|view|viewpoint|peak|sunset|sunrise/.test(raw)) return 'scenic';
  return 'local';
}

function buildTimelineSteps(plan) {
  const base = parseTimeToMinutes(plan.time || '08:00 AM');
  const type = inferStopType(plan);
  const shortPlace = plan.place || 'this stop';
  const templates = {
    heritage: [
      'Arrive at ' + shortPlace,
      'Explore the main heritage zone',
      'Photo stop and detail viewing',
      'Move onward to the next district',
    ],
    food: [
      'Arrive and settle into the area',
      'Explore the signature food stop',
      'Taste local highlights and details',
      'Move onward after the meal break',
    ],
    beach: [
      'Arrive near ' + shortPlace,
      'Explore the shoreline stretch',
      'Photo stop and sea-view details',
      'Move onward along the coast route',
    ],
    scenic: [
      'Arrive at the viewpoint area',
      'Explore the scenic zone slowly',
      'Photo stop and quiet details',
      'Move onward with the best light',
    ],
    local: [
      'Arrive near ' + shortPlace,
      'Explore the local area',
      'Photo stop and street details',
      'Move onward to the next district',
    ],
  };
  const offsets = [0, 30, 75, 120];
  return offsets.map((offset, index) => ({
    time: formatMinutes(base + offset),
    label: templates[type][index],
  }));
}

function buildDayAtGlance(plans) {
  return plans.map((plan) => ({
    time: plan.time,
    label: SLOT_CFG[plan.slotKey]?.label || 'Stop',
    place: plan.place,
  }));
}

async function fetchPlaceImageUrl(place, destination, photoIndex = 0) {
  try {
    const query = [place, destination].filter(Boolean).join(' ').trim();
    const res = await fetch(
      '/api/place-image?query=' + encodeURIComponent(query) + '&photoIndex=' + photoIndex + '&onlyGoogle=1',
      { credentials: 'include' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url || null;
  } catch {
    return null;
  }
}

async function fetchPrayerTimes(destination) {
  try {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const res = await fetch(
      'https://api.aladhan.com/v1/timingsByCity/' + day + '-' + month + '-' + year + '?city=' + encodeURIComponent(destination) + '&country=&method=2'
    );
    if (!res.ok) return null;
    const data = await res.json();
    const t = data?.data?.timings;
    const hijri = data?.data?.date?.hijri;
    if (!t) return null;
    return {
      hijriDate: hijri ? (hijri.day + ' ' + hijri.month.en + ' ' + hijri.year + ' AH') : '',
      times: {
        Fajr: t.Fajr,
        Sunrise: t.Sunrise,
        Dhuhr: t.Dhuhr,
        Asr: t.Asr,
        Maghrib: t.Maghrib,
        Isha: t.Isha,
      },
    };
  } catch {
    return null;
  }
}

async function buildPrintableTrip(trip, prayerTimesArg, hijriDateArg) {
  const destination = (trip.destination || 'Trip').split(',')[0].trim();
  const days = Array.isArray(trip.itinerary)
    ? trip.itinerary
    : Array.isArray(trip.itinerary?.days)
      ? trip.itinerary.days
      : [];

  const prayerBundle = prayerTimesArg
    ? { times: prayerTimesArg, hijriDate: hijriDateArg || '' }
    : await fetchPrayerTimes(destination);

  const coverImage = await fetchPlaceImageUrl(destination, destination, 0);
  const printableDays = [];

  for (const day of days) {
    const plans = normalizeDayPlans(day);
    const planCards = await Promise.all(
      plans.map(async (plan, index) => ({
        ...plan,
        image: await fetchPlaceImageUrl(plan.place, destination, index),
        timeline: buildTimelineSteps(plan),
      }))
    );
    printableDays.push({
      ...day,
      plans: planCards,
      dayAtGlance: buildDayAtGlance(planCards),
    });
  }

  return { destination, coverImage, printableDays, prayerBundle };
}

function renderPrayerSection(prayerBundle) {
  if (!prayerBundle?.times) {
    return '<div class="prayer-empty">Prayer times could not be loaded for this trip.</div>';
  }
  const entries = Object.entries(prayerBundle.times);
  return '<div class="prayer-grid">' +
    entries.map(([name, time]) =>
      '<div class="prayer-pill"><span>' + escapeHtml(name) + '</span><strong>' + escapeHtml(time) + '</strong></div>'
    ).join('') +
  '</div>' + (prayerBundle.hijriDate ? '<div class="hijri">' + escapeHtml(prayerBundle.hijriDate) + '</div>' : '');
}

function renderDayAtGlance(day) {
  const items = Array.isArray(day.dayAtGlance) ? day.dayAtGlance : [];
  if (!items.length) return '';
  return '<div class="glance-wrap">' +
    '<div class="section-kicker">Day At A Glance</div>' +
    '<div class="glance-row">' +
      items.map((item) =>
        '<div class="glance-pill">' +
          '<div class="glance-time">' + escapeHtml(item.time || '') + '</div>' +
          '<div class="glance-place">' + escapeHtml(item.place || '') + '</div>' +
        '</div>'
      ).join('') +
    '</div>' +
  '</div>';
}

function renderTimeline(plan) {
  const steps = Array.isArray(plan.timeline) ? plan.timeline : [];
  return '<div class="timeline-block">' +
    '<div class="timeline-title">Time Plan</div>' +
    steps.map((step) =>
      '<div class="timeline-row">' +
        '<span class="timeline-time">' + escapeHtml(step.time) + '</span>' +
        '<span class="timeline-text">' + escapeHtml(step.label) + '</span>' +
      '</div>'
    ).join('') +
  '</div>';
}

function renderDay(day, currency = 'USD') {
  const plans = Array.isArray(day.plans) ? day.plans : [];
  return '<section class="day-page">' +
      '<div class="day-head">' +
        '<div>' +
          '<div class="day-kicker">Day ' + escapeHtml(day.day || '') + '</div>' +
          '<h2 class="day-title">' + escapeHtml(day.title || day.theme || 'Planned Day') + '</h2>' +
          '<div class="day-date">' + escapeHtml(day.date || '') + '</div>' +
        '</div>' +
      '</div>' +
      renderDayAtGlance(day) +
      '<div class="plans-grid">' +
        plans.map((plan, index) =>
          '<article class="plan-card">' +
            '<div class="plan-image-wrap">' +
              (plan.image ? '<img class="plan-image" src="' + escapeHtml(plan.image) + '" alt="' + escapeHtml(plan.place) + '" />' : '<div class="plan-image placeholder"></div>') +
              '<div class="plan-overlay"></div>' +
              '<div class="plan-meta-top">' +
                '<span class="plan-count">' + (index + 1) + '</span>' +
                '<span class="plan-badge">' + escapeHtml(SLOT_CFG[plan.slotKey]?.label || 'Stop') + '</span>' +
              '</div>' +
              '<div class="plan-meta-bottom">' +
                '<span class="plan-time">' + escapeHtml(plan.time) + '</span>' +
                '<h3>' + escapeHtml(plan.place) + '</h3>' +
              '</div>' +
            '</div>' +
            '<div class="plan-body">' +
              '<a class="plan-link" href="' + escapeHtml(plan.locationLink) + '" target="_blank" rel="noreferrer">Open Place Link</a>' +
              '<p class="plan-desc">' + escapeHtml(plan.description || '') + '</p>' +
              renderTimeline(plan) +
              '<div class="plan-cost">' + escapeHtml(plan.cost > 0 ? fmtBudget(plan.cost, currency) : 'Included') + '</div>' +
            '</div>' +
          '</article>'
        ).join('') +
      '</div>' +
    '</section>';
}

function buildHtml(trip, printable) {
  const totalBudget = trip.costBreakdown?.total || 0;
  const currency = trip.currency || 'USD';
  const daysCount = printable.printableDays.length || trip.days || 1;

  return '<!doctype html><html><head><meta charset="utf-8" />' +
  '<title>Rihla AI PDF</title>' +
  '<style>' +
  '@page{size:A4;margin:12mm;}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#060b14;color:#fff;}*{box-sizing:border-box}a{text-decoration:none}.doc{display:flex;flex-direction:column;gap:18px;align-items:center;padding:0}.cover,.day-page{width:186mm;min-height:273mm;page-break-after:always;border:1px solid rgba(212,175,55,.18);border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#09111d,#060b14)}.cover:last-child,.day-page:last-child{page-break-after:auto}.cover-hero{height:76mm;position:relative;background:#101826}.cover-hero img{width:100%;height:100%;object-fit:cover}.cover-hero .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,11,20,.1),rgba(6,11,20,.82))}.cover-body{padding:14mm}.brand{font-size:10px;letter-spacing:.5em;color:#d4af37;font-weight:800;text-transform:uppercase}.dest{font-size:34px;line-height:1;margin:10px 0 8px;font-weight:900}.meta{color:#94a3b8;font-size:11px;display:flex;gap:10px;flex-wrap:wrap}.budget{margin-top:14px}.budget .label{font-size:10px;letter-spacing:.25em;color:#94a3b8;text-transform:uppercase}.budget .value{font-size:26px;color:#d4af37;font-weight:900;margin-top:6px}.prayer-box{margin-top:16px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:#0f1623;padding:12px}.prayer-title{font-size:11px;letter-spacing:.3em;color:#10b981;text-transform:uppercase;font-weight:800;margin-bottom:10px}.prayer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.prayer-pill{border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px;background:rgba(255,255,255,.02)}.prayer-pill span{display:block;color:#94a3b8;font-size:11px}.prayer-pill strong{display:block;color:#fff;font-size:14px;margin-top:5px}.hijri{margin-top:10px;color:#94a3b8;font-size:11px}.day-head{padding:12mm 12mm 6mm;border-bottom:1px solid rgba(255,255,255,.06)}.day-kicker{font-size:11px;letter-spacing:.3em;color:#d4af37;text-transform:uppercase;font-weight:800}.day-title{font-size:24px;line-height:1.15;margin:8px 0 6px;font-weight:900}.day-date{color:#94a3b8;font-size:12px}.glance-wrap{padding:10mm 10mm 0}.section-kicker{font-size:11px;letter-spacing:.3em;color:#d4af37;text-transform:uppercase;font-weight:800;margin-bottom:10px}.glance-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.glance-pill{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px;background:#0f1623}.glance-time{font-size:11px;color:#d4af37;font-weight:800}.glance-place{margin-top:6px;font-size:11px;color:#e5edf6;line-height:1.45}.plans-grid{padding:10mm;display:grid;grid-template-columns:1fr 1fr;gap:8mm}.plan-card{border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;background:#0f1623}.plan-image-wrap{position:relative;height:64mm;background:#101826}.plan-image{width:100%;height:100%;object-fit:cover}.plan-image.placeholder{background:linear-gradient(135deg,#122033,#0b1422)}.plan-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.68))}.plan-meta-top,.plan-meta-bottom{position:absolute;left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;gap:8px}.plan-meta-top{top:12px}.plan-meta-bottom{bottom:12px;align-items:flex-end}.plan-count,.plan-badge,.plan-time{background:rgba(6,11,20,.82);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800}.plan-meta-bottom h3{margin:0;font-size:21px;line-height:1.1;max-width:72%;font-weight:900}.plan-body{padding:12px 14px 14px}.plan-link{display:inline-block;margin-bottom:10px;color:#38bdf8;font-size:11px;font-weight:800}.plan-desc{margin:0 0 12px;color:#dbe4ee;font-size:12px;line-height:1.6}.timeline-block{border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:10px;background:rgba(255,255,255,.02);margin-bottom:12px}.timeline-title{font-size:10px;letter-spacing:.22em;color:#d4af37;text-transform:uppercase;font-weight:800;margin-bottom:8px}.timeline-row{display:grid;grid-template-columns:74px 1fr;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}.timeline-row:last-child{border-bottom:none}.timeline-time{color:#10b981;font-size:11px;font-weight:800}.timeline-text{color:#eef4fb;font-size:11px;line-height:1.5}.plan-cost{color:#d4af37;font-weight:900;font-size:12px}.footer-note{padding:0 12mm 12mm;color:#64748b;font-size:10px}.empty{padding:12mm;color:#94a3b8}.prayer-empty{color:#94a3b8;font-size:12px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc{align-items:stretch}.cover,.day-page{width:auto;min-height:auto}}' +
  '</style></head><body><div class="doc">' +
    '<section class="cover">' +
      '<div class="cover-hero">' +
        (printable.coverImage ? '<img src="' + escapeHtml(printable.coverImage) + '" alt="' + escapeHtml(printable.destination) + '" />' : '') +
        '<div class="shade"></div>' +
      '</div>' +
      '<div class="cover-body">' +
        '<div class="brand">Rihla AI - Your Journey</div>' +
        '<div class="dest">' + escapeHtml(printable.destination.toUpperCase()) + '</div>' +
        '<div class="meta">' +
          '<span>' + escapeHtml(String(daysCount)) + ' days</span>' +
          '<span>' + escapeHtml(String(trip.travelers || 1)) + ' traveller' + ((trip.travelers || 1) > 1 ? 's' : '') + '</span>' +
          '<span>' + escapeHtml(trip.travelStyle || 'Balanced') + '</span>' +
          '<span>' + escapeHtml(trip.dates || '') + '</span>' +
        '</div>' +
        '<div class="budget">' +
          '<div class="label">Total Budget</div>' +
          '<div class="value">' + escapeHtml(fmtBudget(totalBudget, currency)) + '</div>' +
        '</div>' +
        '<div class="prayer-box">' +
          '<div class="prayer-title">Islamic Prayer Times</div>' +
          renderPrayerSection(printable.prayerBundle) +
        '</div>' +
      '</div>' +
      '<div class="footer-note">Exported from the same saved trip plan shown in Rihla AI.</div>' +
    '</section>' +
    (printable.printableDays.length
      ? printable.printableDays.map((day) => renderDay(day, currency)).join('')
      : '<section class="day-page"><div class="empty">No itinerary data was available for export.</div></section>') +
  '</div></body></html>';
}

async function openPdfWindow(trip, prayerTimesArg, hijriDateArg, options = {}) {
  const { autoPrint = false } = options;
  const printable = await buildPrintableTrip(trip, prayerTimesArg, hijriDateArg);
  const win = window.open('', '_blank', 'width=1280,height=900');
  if (!win) throw new Error('Popup blocked');
  const html = buildHtml(trip, printable);
  win.document.open();
  win.document.write(html);
  win.document.close();

  const waitForImages = () => new Promise((resolve) => {
    const images = Array.from(win.document.images || []);
    if (!images.length) {
      setTimeout(resolve, 300);
      return;
    }
    let loaded = 0;
    const done = () => {
      loaded += 1;
      if (loaded >= images.length) resolve();
    };
    images.forEach((img) => {
      if (img.complete) done();
      else {
        img.onload = done;
        img.onerror = done;
      }
    });
  });

  await waitForImages();
  await new Promise((resolve) => setTimeout(resolve, 400));
  win.focus();
  if (autoPrint) win.print();
  return win;
}

async function waitForDocumentAssets(doc) {
  const images = Array.from(doc.images || []);
  await Promise.all(images.map((img) => new Promise((resolve) => {
    if (img.complete) resolve();
    else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  })));
  if (doc.fonts?.ready) {
    try { await doc.fonts.ready; } catch {}
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function downloadPdfFile(trip, prayerTimesArg, hijriDateArg) {
  const printable = await buildPrintableTrip(trip, prayerTimesArg, hijriDateArg);
  const html = buildHtml(trip, printable);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-99999px';
  iframe.style.bottom = '0';
  iframe.style.width = '1200px';
  iframe.style.height = '1600px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Hidden PDF frame could not be created');
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForDocumentAssets(doc);

  const pages = Array.from(doc.querySelectorAll('.cover, .day-page'));
  if (!pages.length) {
    document.body.removeChild(iframe);
    throw new Error('No PDF pages were available to download');
  }

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = 186;
  const pageHeight = 273;
  const marginX = 12;
  const marginY = 12;

  for (let index = 0; index < pages.length; index += 1) {
    const pageEl = pages[index];
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#060b14',
      logging: false,
      windowWidth: 1200,
    });
    const imageData = canvas.toDataURL('image/jpeg', 0.96);
    if (index > 0) pdf.addPage();
    pdf.addImage(imageData, 'JPEG', marginX, marginY, pageWidth, pageHeight, undefined, 'FAST');
  }

  const destination = String(printable.destination || trip.destination || 'trip')
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'trip';

  pdf.save('rihla-' + destination + '.pdf');
  document.body.removeChild(iframe);
}

export async function exportTripPDF(trip, prayerTimesArg, hijriDateArg, options = {}) {
  return openPdfWindow(trip, prayerTimesArg, hijriDateArg, { autoPrint: false, ...options });
}

export async function downloadTripPDF(trip, prayerTimesArg, hijriDateArg, options = {}) {
  return downloadPdfFile(trip, prayerTimesArg, hijriDateArg, options);
}
