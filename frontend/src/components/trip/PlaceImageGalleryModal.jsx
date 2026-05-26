import { Camera, PlayCircle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { usePlaceImageGallery } from "@/hooks/use-place-image";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getPrimaryQuery = (queries, title = "") => {
  const list = Array.isArray(queries) ? queries : [queries];
  return String(title || list.find(Boolean) || "travel place").trim();
};

const buildPlaceVideoUrl = (queries, title = "") => {
  const query = getPrimaryQuery(queries, title)
    .replace(/\b(Google Maps|place photo|tourist attraction)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} walking tour travel guide`)}`;
};

export function GalleryPhotoBadge({ queries, title = "", accent = "#D4AF37", isLight = false, onClick }) {
  const { images, loading } = usePlaceImageGallery(queries, { maxResults: 9, onlyGoogle: true });
  const count = images.length;
  const videoUrl = buildPlaceVideoUrl(queries, title);

  return (
    <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] shadow-lg backdrop-blur-xl transition-transform hover:scale-[1.03]",
          isLight ? "border-white/70 bg-white/88 text-slate-900" : "border-white/14 bg-black/45 text-white"
        )}
        style={{ boxShadow: `0 12px 30px ${accent}22` }}
        aria-label={count ? `Open ${count} place photos` : "Open place photos"}
      >
        <Camera size={12} style={{ color: accent }} />
        {loading ? "Scanning" : `${count || 0} photos`}
      </button>
      <a
        href={videoUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] shadow-lg backdrop-blur-xl transition-transform hover:scale-[1.03]",
          isLight ? "border-white/70 bg-white/88 text-slate-900" : "border-white/14 bg-black/45 text-white"
        )}
        style={{ boxShadow: `0 12px 30px ${accent}18` }}
        aria-label="Open exact place video walkthrough"
      >
        <PlayCircle size={12} style={{ color: accent }} />
        Video
      </a>
    </div>
  );
}

export function PlaceImageGalleryModal({ open, onClose, title, queries, accent = "#D4AF37", isLight = false }) {
  const { images, loading } = usePlaceImageGallery(queries, { maxResults: 9, onlyGoogle: true });
  if (!open || typeof document === "undefined") return null;

  const countLabel = loading ? "Scanning Google Places" : `${images.length || 0} verified images`;
  const videoUrl = buildPlaceVideoUrl(queries, title);
  const lockScrollToBoard = (event) => {
    event.stopPropagation();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#020711] px-0 py-0 sm:px-6 sm:py-5" onClick={(event) => event.stopPropagation()}>
      <button aria-label="Close gallery" className="absolute inset-0 bg-[#020711]" onClick={onClose} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(212,175,55,0.12),transparent_34%)]" />
      <div
        className={cn(
          "relative z-10 flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-[#07101f] shadow-[0_30px_90px_rgba(0,0,0,0.68)] sm:h-[calc(100vh-40px)] sm:max-w-[1180px] sm:rounded-[30px] sm:border sm:border-white/16"
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#07101f] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.34em]" style={{ color: accent }}>Google Places Image Board</p>
            <h3 className="mt-1 truncate text-xl font-black leading-tight text-white">{title}</h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/72">{countLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#F8E7A0] transition-colors hover:border-[#D4AF37]/60 sm:inline-flex"
            >
              <PlayCircle size={13} />
              Watch Video
            </a>
            <button onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-white/5 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/82 transition-colors hover:border-white/40 hover:text-white">
              <X size={13} />
              Close
            </button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-scroll overscroll-contain bg-[#07101f] p-5 sm:p-6"
          style={{
            height: "calc(100vh - 112px)",
            WebkitOverflowScrolling: "touch",
            scrollbarGutter: "stable",
            touchAction: "pan-y",
          }}
          onWheel={lockScrollToBoard}
          onTouchMove={lockScrollToBoard}
        >
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="relative h-[230px] overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] sm:h-[244px]">
                  <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55">Scanning view {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !images.length && (
            <div className="grid grid-cols-1 gap-4">
              <a href={videoUrl} target="_blank" rel="noreferrer" className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-[#D4AF37]/25 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.16),transparent_42%),linear-gradient(135deg,#0b1423,#050912)] px-8 text-center shadow-[0_16px_42px_rgba(0,0,0,0.34)] transition-transform hover:scale-[1.005]">
                <PlayCircle size={34} className="mb-4 text-[#7DD3FC]" />
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">Exact Video Search</p>
                <p className="mt-2 text-lg font-black text-white">Open real walkthroughs on YouTube</p>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/60">No verified Google photo set is available yet, so Rihla is not showing random media inside the app.</p>
              </a>
            </div>
          )}

          {!!images.length && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative h-[230px] overflow-hidden rounded-[22px] border border-[#D4AF37]/28 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.2),transparent_40%),linear-gradient(135deg,#0b1423,#050912)] shadow-[0_16px_42px_rgba(0,0,0,0.34)] sm:h-[244px]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(125,211,252,0.12),transparent_34%)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/34 bg-[#D4AF37]/10 shadow-[0_0_46px_rgba(212,175,55,0.16)] transition-transform group-hover:scale-110">
                    <PlayCircle size={30} className="text-[#F8E7A0]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">Exact Video Walkthrough</p>
                  <p className="mt-2 text-lg font-black leading-tight text-white">Watch this place in motion</p>
                  <p className="mt-2 text-[11px] font-semibold leading-relaxed text-white/62">Opens YouTube search for this exact planned stop.</p>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/78">Video</p>
                </div>
              </a>
              {images.map((image, index) => (
                <a key={`${image.url}-${index}`} href={image.url} target="_blank" rel="noreferrer" className="group relative h-[230px] overflow-hidden rounded-[22px] border border-white/10 bg-black shadow-[0_16px_42px_rgba(0,0,0,0.32)] sm:h-[244px]">
                  <img src={image.url} alt={`${title} ${index + 1}`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/78">View {index + 1}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
