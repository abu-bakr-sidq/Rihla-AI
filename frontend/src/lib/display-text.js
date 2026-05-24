const REPLACEMENTS = new Map([
  ['Ãƒâ€šÃ‚Â·', '·'],
  ['Ã‚Â·', '·'],
  ['Â·', '·'],
  ['ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢', '\u2022'],
  ['Ã¢â‚¬Â¢', '\u2022'],
  ['â€¢', '\u2022'],
  ['ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“', '-'],
  ['ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â”', '-'],
  ['Ã¢â‚¬â€œ', '-'],
  ['Ã¢â‚¬â€\u009d', '-'],
  ['â€“', '-'],
  ['â€”', '-'],
  ['ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦', '...'],
  ['Ã¢â‚¬Â¦', '...'],
  ['â€¦', '...'],
  ['ÃƒÂ¢Ã¢â‚¬Âº', '->'],
  ['Ã¢â€º', '->'],
  ['ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“', '\u2713'],
  ['Ã¢Å“â€œ', '\u2713'],
  ['âœ“', '\u2713'],
  ['Ã¢â€šÂ¬', '\u20AC'],
  ['â‚¬', '\u20AC'],
  ['Ã¢â€šÂ¹', '\u20B9'],
  ['â‚¹', '\u20B9'],
  ['Ã‚Â£', '\u00A3'],
  ['Â£', '\u00A3'],
  ['Ã‚Â¥', '\u00A5'],
  ['Â¥', '\u00A5'],
  ['Ã˜Â¯.Ã˜Â¥', 'AED'],
  ['Ã˜Â±.Ã˜Â³', 'SAR'],
  ['Â', ' '],
]);

const normalizedReplacements = new Map(
  Array.from(REPLACEMENTS.entries()).map(([broken, fixed]) => [
    broken,
    fixed.replace(/\\u([0-9A-Fa-f]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16))),
  ])
);

function looksCorrupted(text) {
  if (!text) return false;

  const suspiciousChunks = ['Ã', 'Â', 'â€', 'â€œ', 'â€\u009d', 'â€™', 'â€“', 'â€”', 'â€¢', '?'];
  const hitCount = suspiciousChunks.reduce((count, chunk) => count + (text.includes(chunk) ? 1 : 0), 0);

  return hitCount >= 2 || /[ÃÂâ][A-Za-z0-9]/.test(text);
}

export function sanitizeVisibleText(value, fallback = '') {
  if (value == null) return fallback;

  let text = String(value);

  for (const [broken, fixed] of normalizedReplacements.entries()) {
    text = text.split(broken).join(fixed);
  }

  text = text
    .replace(/[\uFFFD]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/(?:Ã|Â|â€|â€œ|â€\u009d|â€™|â€“|â€”|â€¢){2,}/g, ' ')
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
      EUR: String.fromCharCode(0x20AC),
      GBP: String.fromCharCode(0x00A3),
      INR: String.fromCharCode(0x20B9),
      JPY: String.fromCharCode(0x00A5),
      AED: 'AED ',
      SAR: 'SAR ',
    };

    return `${symbolMap[currency] || '$'}${Math.round(numeric).toLocaleString(locale)}`;
  }
}
