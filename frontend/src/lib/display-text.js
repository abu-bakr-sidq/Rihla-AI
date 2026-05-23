const REPLACEMENTS = new Map([
  ["\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b7", "\u00b7"],
  ["\u00c3\u201a\u00c2\u00b7", "\u00b7"],
  ["\u00c2\u00b7", "\u00b7"],
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u201a\u00c2\u00a2", "\u2022"],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2", "\u2022"],
  ["\u00e2\u20ac\u00a2", "\u2022"],
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u00a2\u00e2\u201a\u00ac\u0153", "-"],
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u00a2\u00e2\u201a\u00ac\u009d", "-"],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u201c", "-"],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d", "-"],
  ["\u00e2\u20ac\u201c", "-"],
  ["\u00e2\u20ac\u201d", "-"],
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u201a\u00c2\u00a6", "..."],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a6", "..."],
  ["\u00e2\u20ac\u00a6", "..."],
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a0 \u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2", "->"],
  ["\u00c3\u00a2\u20ac \u00c3\u00a2\u20ac\u2122", "->"],
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u2026\u0153\u00c3\u00a2\u00e2\u201a\u00ac\u00c5\u201c", "\u2713"],
  ["\u00c3\u00a2\u00c5\u201c\u00e2\u20ac\u0153", "\u2713"],
  ["\u00e2\u0153\u201c", "\u2713"],
  ["\u00c3\u00a2\u20ac\u0161\u00c2\u00ac", "\u20ac"],
  ["\u00e2\u201a\u00ac", "\u20ac"],
  ["\u00c3\u00a2\u20ac\u0161\u00c2\u00b9", "\u20b9"],
  ["\u00e2\u201a\u00b9", "\u20b9"],
  ["\u00c3\u201a\u00c2\u00a3", "\u00a3"],
  ["\u00c2\u00a3", "\u00a3"],
  ["\u00c3\u201a\u00c2\u00a5", "\u00a5"],
  ["\u00c2\u00a5", "\u00a5"],
  ["\u00c3\u02d8\u00c2\u00af.\u00c3\u02d8\u00c2\u00a5", "AED"],
  ["\u00c3\u02d8\u00c2\u00b1.\u00c3\u02d8\u00c2\u00b3", "SAR"],
  ["\u00c2", " "],
]);

function looksCorrupted(text) {
  if (!text) return false;

  const suspiciousChunks = [
    "\u00c3",
    "\u00c2",
    "\u00e2\u20ac",
    "\u00e2\u20ac\u0153",
    "\u00e2\u20ac\u009d",
    "\u00e2\u20ac\u2122",
    "\u00e2\u20ac\u201c",
    "\u00e2\u20ac\u201d",
    "\u00e2\u20ac\u00a2",
    "?",
  ];
  const hitCount = suspiciousChunks.reduce(
    (count, chunk) => count + (text.includes(chunk) ? 1 : 0),
    0,
  );

  return hitCount >= 2 || /[\u00c3\u00c2\u00e2][A-Za-z0-9]/.test(text);
}

export function sanitizeVisibleText(value, fallback = "") {
  if (value == null) return fallback;

  let text = String(value);

  for (const [broken, fixed] of REPLACEMENTS.entries()) {
    text = text.split(broken).join(fixed);
  }

  text = text
    .replace(/[\uFFFD]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/(?:\u00c3|\u00c2|\u00e2\u20ac|\u00e2\u20ac\u0153|\u00e2\u20ac\u009d|\u00e2\u20ac\u2122|\u00e2\u20ac\u201c|\u00e2\u20ac\u201d|\u00e2\u20ac\u00a2){2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (looksCorrupted(text) && fallback) {
    return fallback;
  }

  return text || fallback;
}

export function sanitizeTextList(values = []) {
  return values.map((value) => sanitizeVisibleText(value)).filter(Boolean);
}

export function sanitizeRenderText(value, fallback = "") {
  return typeof value === "string" ? sanitizeVisibleText(value, fallback) : value;
}

export function formatCurrencySafe(amount, currency = "USD", locale = "en-US") {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    const symbolMap = {
      USD: "$",
      EUR: "\u20ac",
      GBP: "\u00a3",
      INR: "\u20b9",
      JPY: "\u00a5",
      AED: "AED ",
      SAR: "SAR ",
    };

    return `${symbolMap[currency] || "$"}${Math.round(numeric).toLocaleString(locale)}`;
  }
}
