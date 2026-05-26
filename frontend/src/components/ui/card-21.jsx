import * as React from "react";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import { sanitizeTextList, sanitizeVisibleText } from "@/lib/display-text";

/**
 * DestinationCard (Card-21 style)
 * Full-bleed image + themed gradient overlay + scale-on-hover + "Explore Now" CTA.
 * themeColor: HSL values e.g. "150 50% 25%"
 */
const DestinationCard = React.forwardRef(
  ({ className = "", imageUrl, imageFallbacks = [], location, country, flag, stats, score, tags, plannerHref, themeColor = "212 75% 20%", ...props }, ref) => {
    const safeLocation = sanitizeVisibleText(location, "Destination");
    const safeCountry = sanitizeVisibleText(country);
    const safeFlag = sanitizeVisibleText(flag);
    const safeStats = sanitizeVisibleText(stats);
    const safeTags = sanitizeTextList(tags);
    const safeScore = Number.isFinite(Number(score)) ? Number(score) : null;
    const fallbackChain = React.useMemo(
      () => [imageUrl, ...(Array.isArray(imageFallbacks) ? imageFallbacks : [])].filter(Boolean),
      [imageUrl, imageFallbacks],
    );
    const [imageIndex, setImageIndex] = React.useState(0);

    React.useEffect(() => {
      setImageIndex(0);
    }, [imageUrl, imageFallbacks]);

    const activeImage = fallbackChain[imageIndex] || null;

    return (
      <div
        ref={ref}
        className={`group w-full h-full ${className}`}
        style={{ "--theme-color": themeColor }}
        {...props}
      >
        <div
          className="relative block w-full h-full rounded-2xl overflow-hidden shadow-lg
                     transition-all duration-500 ease-in-out
                     group-hover:scale-[1.03] group-hover:-translate-y-1"
          style={{
            boxShadow: `0 0 40px -15px hsl(${themeColor} / 0.45)`,
          }}
          >
          {/* Background image with zoom on hover */}
          {activeImage ? (
            <img
              src={activeImage}
              alt={safeLocation}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
              onError={() => {
                setImageIndex((prev) => (prev < fallbackChain.length - 1 ? prev + 1 : prev));
              }}
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-700 ease-in-out group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, hsl(${themeColor} / 0.58), rgba(6,11,20,0.96))` }}
            />
          )}

          {/* Themed gradient overlay — bottom-heavy */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(${themeColor} / 0.95), hsl(${themeColor} / 0.5) 35%, transparent 65%)`,
            }}
          />

          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "radial-gradient(ellipse at 70% 5%, rgba(212,175,55,0.15) 0%, transparent 60%)" }} />

          {/* Top badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between">
            {/* Region / country badge */}
            {safeCountry && (
              <span className="text-[8px] font-black uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                {safeCountry}
              </span>
            )}
            {/* AI Score badge */}
            {safeScore != null && (
              <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}>
                <Star className="w-3 h-3 text-[#D4AF37]" fill="currentColor" />
                {safeScore}%
              </span>
            )}
          </div>

          {/* Bottom content */}
          <div className="relative flex flex-col justify-end h-full p-5 text-white">
            {/* Location label */}
            <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: "rgba(212,175,55,0.85)" }}>
              <MapPin className="w-2.5 h-2.5" />
              {safeFlag && <span className="text-xs mr-0.5">{safeFlag}</span>}
              {safeCountry || safeLocation}
            </p>

            {/* Destination name */}
            <h3 className="text-[1.4rem] font-black tracking-tight leading-tight">
              {safeLocation}
            </h3>

            {/* Stats / tags */}
            {safeStats && <p className="text-xs text-white/65 mt-1 font-medium">{safeStats}</p>}
            {safeTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {safeTags.map((t, i) => (
                  <span key={i} className="text-[8px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* CTA — slides up on hover */}
            <div className="mt-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 ease-out">
              {plannerHref ? (
                <Link href={plannerHref}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, hsl(${themeColor} / 0.72), rgba(0,0,0,0.68))`,
                      backdropFilter: "blur(12px)",
                      border: `1px solid rgba(255,255,255,0.42)`,
                      color: "#fff",
                      boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, hsl(${themeColor} / 0.92), rgba(0,0,0,0.58))`}
                    onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, hsl(${themeColor} / 0.72), rgba(0,0,0,0.68))`}
                  >
                    <span>Explore Now</span>
                    <ArrowRight className="h-3.5 w-3.5 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </Link>
              ) : (
                <div
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(135deg, hsl(${themeColor} / 0.72), rgba(0,0,0,0.68))`,
                    backdropFilter: "blur(12px)",
                    border: `1px solid rgba(255,255,255,0.42)`,
                    color: "#fff",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                  }}
                >
                  <span>Explore Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Gold inner border glow on hover */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.25)" }} />
        </div>
      </div>
    );
  }
);
DestinationCard.displayName = "DestinationCard";

export { DestinationCard };
