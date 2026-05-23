const REPLACEMENTS = [
  ['\u00C3\u0192\u00E2\u20AC\u0161\u00C3\u201A\u00C2\u00B7', '\u00B7'],
  ['\u00C3\u201A\u00C2\u00B7', '\u00B7'],
  ['\u00C2\u00B7', '\u00B7'],
  ['\u00C3\u0192\u00C2\u00A2\u00C3\u00A2\u20AC\u0161\u00C2\u00AC\u00C3\u201A\u00C2\u00A2', '\u2022'],
  ['\u00C3\u00A2\u201A\u00AC\u00C2\u00A2', '\u2022'],
  ['\u00E2\u20AC\u00A2', '\u2022'],
  ['\u00C3\u0192\u00C2\u00A2\u00C3\u00A2\u20AC\u0161\u00C2\u00AC\u00C3\u00A2\u20AC\u015C', '-'],
  ['\u00C3\u0192\u00C2\u00A2\u00C3\u00A2\u20AC\u0161\u00C2\u00AC\u00C3\u00A2\u20AC\u009D', '-'],
  ['\u00C3\u00A2\u201A\u00AC\u201C', '-'],
  ['\u00C3\u00A2\u201A\u00AC\u201D', '-'],
  ['\u00E2\u20AC\u201C', '-'],
  ['\u00E2\u20AC\u201D', '-'],
  ['\u00C3\u0192\u00C2\u00A2\u00C3\u00A2\u201A\u00AC\u00C2\u00A6', '...'],
  ['\u00C3\u00A2\u201A\u00AC\u00C2\u00A6', '...'],
  ['\u00E2\u20AC\u00A6', '...'],
  ['\u00C3\u0192\u00C2\u00A2\u00C3\u00A2\u201A\u00AC\u00C2\u00A0 \u00C3\u00A2\u201A\u00AC\u2122', '->'],
  ['\u00C3\u00A2\u20AC \u00C3\u00A2\u20AC\u2122', '->'],
  ['\u00C3\u0192\u00C2\u00A2\u00C3\u2026\u0153\u00C3\u00A2\u201A\u00AC\u015C', '\u2713'],
  ['\u00C3\u00A2\u00C5\u201C\u00E2\u20AC\u015C', '\u2713'],
  ['\u00E2\u0153\u201C', '\u2713'],
  ['\u00C3\u00A2\u201A\u00AC', '\u20AC'],
  ['\u00E2\u201A\u00AC', '\u20AC'],
  ['\u00C3\u00A2\u201A\u00B9', '\u20B9'],
  ['\u00E2\u201A\u00B9', '\u20B9'],
  ['\u00C3\u201A\u00C2\u00A3', '\u00A3'],
  ['\u00C2\u00A3', '\u00A3'],
  ['\u00C3\u201A\u00C2\u00A5', '\u00A5'],
  ['\u00C2\u00A5', '\u00A5'],
  ['\u00C3\u02DC\u00C2\u00AF.\u00C3\u02DC\u00C2\u00A5', 'AED'],
  ['\u00C3\u02DC\u00C2\u00B1.\u00C3\u02DC\u00C2\u00B3', 'SAR'],
  ['\u00C2', ' '],
];

function looksCorrupted(text) {
  if (!text) return false;

  const suspiciousChunks = ['\u00C3', '\u00C2', '\u00E2\u20AC', '\u00E2\u20AC\u0153', '\u00E2\u20AC\u009D', '\u00E2\u20AC\u2122', '\u00E2\u20AC\u201C', '\u00E2\u20AC\u201D', '\u00E2\u20AC\u00A2'];
  const hitCount = suspiciousChunks.reduce((count, chunk) => count + (text.includes(chunk) ? 1 : 0), 0);

  return hitCount >= 2 || /[\u00C3\u00C2\u00E2][A-Za-z0-9]/.test(text);
}

export function sanitizeVisibleText(value, fallback = '') {
  if (value == null) return fallback;

  let text = String(value);

  for (const [broken, fixed] of REPLACEMENTS) {
    text = text.split(broken).join(fixed);
  }

  text = text
    .replace(/\uFFFD/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/(?:\u00C3|\u00C2|\u00E2\u20AC|\u00E2\u20AC\u0153|\u00E2\u20AC\u009D|\u00E2\u20AC\u2122|\u00E2\u20AC\u201C|\u00E2\u20AC\u201D|\u00E2\u20AC\u00A2){2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (looksCorrupted(text) && fallback) {
    return fallback;
  }

  return text || fallback;
}

export function sanitizeTextList(values = []) {
  return values
    .map((value) => sanitizeVisibleText(value))
    .filter(Boolean);
}

export function sanitizeRenderText(value, fallback = '') {
  return typeof value === 'string' ? sanitizeVisibleText(value, fallback) : value;
}

export function formatCurrencySafe(amount, currency = 'USD', locale = 'en-US') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    const symbolMap = {
      USD: '$',
      EUR: '\u20AC',
      GBP: '\u00A3',
      INR: '\u20B9',
      JPY: '\u00A5',
      AED: 'AED ',
      SAR: 'SAR ',
    };

    return `${symbolMap[currency] || '$'}${Math.round(numeric).toLocaleString(locale)}`;
  }
}
