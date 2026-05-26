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

const buildPlaceVideoEmbedUrl = (queries, title = "") => {
  const query = getPrimaryQuery(queries, title)
    .replace(/\b(Google Maps|place photo|tourist attraction)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${query} walking tour travel guide`)}`;
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
  const videoEmbedUrl = buildPlaceVideoEmbedUrl(queries, title);
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="relative h-[300px] overflow-hidden rounded-[22px] border border-[#D4AF37]/25 bg-[#050912] shadow-[0_16px_42px_rgba(0,0,0,0.34)] lg:col-span-2">
                <iframe
                  title={`${title} video walkthrough`}
                  src={videoEmbedUrl}
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">Playable Preview</p>
                  <p className="mt-1 text-lg font-black leading-tight text-white">Exact walkthrough video board</p>
                </div>
              </div>
              <a href={videoUrl} target="_blank" rel="noreferrer" className="flex h-[300px] flex-col items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] px-8 text-center transition-transform hover:scale-[1.01]">
                <PlayCircle size={34} className="mb-4 text-[#7DD3FC]" />
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7DD3FC]">More Videos</p>
                <p className="mt-2 text-lg font-black text-white">Open YouTube results</p>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/56">No verified Google photo set is available yet, so Rihla keeps the photo board empty instead of showing a wrong place.</p>
              </a>
            </div>
          )}

          {!!images.length && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative h-[300px] overflow-hidden rounded-[22px] border border-[#D4AF37]/25 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.24),transparent_38%),linear-gradient(135deg,#0b1423,#050912)] shadow-[0_16px_42px_rgba(0,0,0,0.34)] sm:col-span-2 lg:col-span-2">
                <iframe
                  title={`${title} video walkthrough`}
                  src={videoEmbedUrl}
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">Playable Preview</p>
                  <p className="mt-1 text-lg font-black leading-tight text-white">Exact walkthrough video board</p>
                  <p className="mt-1 max-w-xl text-[11px] font-semibold leading-relaxed text-white/68">Watch one in-site preview here. Open YouTube for more videos from this exact place search.</p>
                </div>
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative h-[230px] overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_38%),linear-gradient(135deg,#0b1423,#050912)] shadow-[0_16px_42px_rgba(0,0,0,0.34)] sm:h-[244px]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_42%,rgba(56,189,248,0.10))]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/8 shadow-[0_0_42px_rgba(56,189,248,0.16)] transition-transform group-hover:scale-110">
                    <PlayCircle size={30} className="text-[#7DD3FC]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7DD3FC]">More Videos</p>
                  <p className="mt-2 text-lg font-black leading-tight text-white">Open more walkthroughs</p>
                  <p className="mt-2 text-[11px] font-semibold leading-relaxed text-white/62">YouTube opens with this exact stop search.</p>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/78">Open YouTube</p>
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
