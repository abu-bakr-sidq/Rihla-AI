/**
 * BrandLogo — Rihla AI
 * SVG: geometric R with circular globe frame + compass arrow pointing NE.
 * Glassmorphism silver/cyan style. No image file. Fully transparent.
 */
import { cn } from "@/lib/utils";

export function BrandMark({ size = 44, className = "" }) {
  return (
    <div className={cn("flex-shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 6px rgba(130,220,240,0.35))" }}>
        <defs>
          <linearGradient id="prismatic-lux" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFF"/>
            <stop offset="40%"  stopColor="#D4AF37"/>
            <stop offset="100%" stopColor="#F9E2AF"/>
          </linearGradient>
          <linearGradient id="arrow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#c0e8f8"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>
        </defs>

        {/* ── Circular globe frame ──────────────────────────── */}
        <circle cx="36" cy="44" r="30"
          stroke="url(#prismatic-lux)" strokeWidth="2" fill="none" opacity="0.75"/>

        {/* Globe grid — horizontal */}
        <ellipse cx="36" cy="44" rx="30" ry="11"
          stroke="url(#prismatic-lux)" strokeWidth="1" fill="none" opacity="0.3"/>
        <ellipse cx="36" cy="44" rx="30" ry="21"
          stroke="url(#prismatic-lux)" strokeWidth="0.8" fill="none" opacity="0.2"/>

        {/* Globe grid — vertical */}
        <line x1="36" y1="14" x2="36" y2="74"
          stroke="url(#prismatic-lux)" strokeWidth="0.8" opacity="0.3"/>
        <line x1="6"  y1="44" x2="66" y2="44"
          stroke="url(#prismatic-lux)" strokeWidth="0.8" opacity="0.3"/>

        {/* ── Stylised geometric R ──────────────────────────── */}
        <g stroke="url(#prismatic-lux)" strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none"
          style={{ filter: "drop-shadow(0 0 3px rgba(168,216,234,0.8))" }}>
          {/* Stem */}
          <line x1="18" y1="22" x2="18" y2="66"/>
          {/* Bowl top arc */}
          <path d="M18 22 Q40 22 40 33 Q40 44 18 44"/>
          {/* Bowl fill segments (creates grid-like R bowl) */}
          <line x1="18" y1="29" x2="38" y2="29" strokeWidth="0.8" opacity="0.4"/>
          <line x1="18" y1="36" x2="36" y2="36" strokeWidth="0.8" opacity="0.4"/>
          {/* Leg diagonal */}
          <path d="M28 44 Q38 52 48 66"/>
        </g>

        {/* ── Compass needle / arrow (NE direction) ──────────── */}
        <g style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.9))" }}>
          {/* Arrow shaft */}
          <line x1="46" y1="34" x2="66" y2="14"
            stroke="url(#arrow-grad)" strokeWidth="2.2" strokeLinecap="round"/>
          {/* Arrowhead */}
          <polyline points="55,14 66,14 66,25"
            stroke="url(#arrow-grad)" strokeWidth="2.2"
            fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    </div>
  );
}

export default function BrandLogo({
  size = 40,
  className = "",
  iconOnly = false,
  subtitle = "",
  titleClassName = "",
  subtitleClassName = "",
  markClassName = "",
}) {
  const textH = Math.round(size * 0.52);
  const subH  = Math.round(textH * 0.38);
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} className={markClassName} />
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          {/* RIHLA AI — bold white, clean sans-serif */}
          <div
            className={cn("leading-none font-bold", titleClassName)}
            style={{
              fontSize: textH,
              fontFamily: "'Sora','Inter','system-ui',sans-serif",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "currentColor",
              textTransform: "uppercase",
            }}
          >
            RIHLA AI
          </div>
          {subtitle && (
            <span className={cn("uppercase", subtitleClassName)}
              style={{
                fontSize: subH,
                fontFamily: "'Sora','Inter','system-ui',sans-serif",
                color: "rgba(168,216,234,0.6)",
                letterSpacing: "0.18em",
                marginTop: 3,
                fontWeight: 500,
              }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
