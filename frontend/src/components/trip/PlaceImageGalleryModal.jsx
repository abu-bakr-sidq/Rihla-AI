import { Camera, X } from "lucide-react";
import { createPortal } from "react-dom";
import { usePlaceImageGallery } from "@/hooks/use-place-image";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export function GalleryPhotoBadge({ queries, accent = "#D4AF37", isLight = false, onClick }) {
  const { images, loading } = usePlaceImageGallery(queries, { maxResults: 9, onlyGoogle: true });
  const count = images.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] shadow-lg backdrop-blur-xl transition-transform hover:scale-[1.03]",
        isLight ? "border-white/70 bg-white/88 text-slate-900" : "border-white/14 bg-black/45 text-white"
      )}
      style={{ boxShadow: `0 12px 30px ${accent}22` }}
      aria-label={count ? `Open ${count} place photos` : "Open place photos"}
    >
      <Camera size={12} style={{ color: accent }} />
      {loading ? "Scanning" : `${count || 0} photos`}
    </button>
  );
}

export function PlaceImageGalleryModal({ open, onClose, title, queries, accent = "#D4AF37", isLight = false }) {
  const { images, loading } = usePlaceImageGallery(queries, { maxResults: 9, onlyGoogle: true });
  if (!open || typeof document === "undefined") return null;

  const countLabel = loading ? "Scanning Google Places" : `${images.length || 0} verified images`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
      <button aria-label="Close gallery" className="absolute inset-0 bg-[#020711]/92 backdrop-blur-2xl" onClick={onClose} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(212,175,55,0.14),transparent_34%)]" />
      <div
        className={cn(
          "relative z-10 flex h-[calc(100vh-32px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[30px] border shadow-[0_30px_90px_rgba(0,0,0,0.68)]",
          isLight ? "border-white/85 bg-white" : "border-white/16 bg-[#07101f]"
        )}
      >
        <div className={cn("flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6", isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#07101f]")}>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.34em]" style={{ color: accent }}>Google Places Image Board</p>
            <h3 className={cn("mt-1 truncate text-xl font-black leading-tight", isLight ? "text-slate-950" : "text-white")}>{title}</h3>
            <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.2em]", isLight ? "text-slate-600" : "text-white/72")}>{countLabel}</p>
          </div>
          <button onClick={onClose} className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors", isLight ? "border-slate-300 bg-white text-slate-700 hover:text-slate-950" : "border-white/22 bg-white/5 text-white/82 hover:border-white/40 hover:text-white")}>
            <X size={13} />
            Close
          </button>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6", isLight ? "bg-slate-50" : "bg-[#07101f]")}>
          {loading && (
            <div className={cn("flex h-64 items-center justify-center rounded-[24px] border text-[10px] font-black uppercase tracking-[0.26em]", isLight ? "border-slate-200 bg-slate-50 text-slate-500" : "border-white/8 bg-white/[0.03] text-white/45")}>
              Loading exact Google place photos...
            </div>
          )}

          {!loading && !images.length && (
            <div className={cn("flex h-64 flex-col items-center justify-center rounded-[24px] border px-8 text-center", isLight ? "border-slate-200 bg-slate-50" : "border-white/8 bg-white/[0.03]")}>
              <p className={cn("text-sm font-black", isLight ? "text-slate-900" : "text-white")}>No verified Google photo set available yet.</p>
              <p className={cn("mt-2 max-w-md text-xs leading-relaxed", isLight ? "text-slate-600" : "text-white/50")}>Rihla is avoiding random fallback images here, so this board only shows photos returned by Google Places for the exact planned stop.</p>
            </div>
          )}

          {!!images.length && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
