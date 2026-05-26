import { Camera, X } from "lucide-react";
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
  if (!open) return null;

  const countLabel = loading ? "Scanning Google Places" : `${images.length || 0} verified images`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-5" onClick={(event) => event.stopPropagation()}>
      <button aria-label="Close gallery" className="absolute inset-0 bg-black/76 backdrop-blur-md" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border shadow-[0_30px_90px_rgba(0,0,0,0.58)]",
          isLight ? "border-white/80 bg-white/96" : "border-white/12 bg-[#08111f]/96"
        )}
      >
        <div className={cn("flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4", isLight ? "border-slate-200" : "border-white/10")}>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.34em]" style={{ color: accent }}>Google Places Image Board</p>
            <h3 className={cn("mt-1 truncate text-xl font-black leading-tight", isLight ? "text-slate-950" : "text-white")}>{title}</h3>
            <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.2em]", isLight ? "text-slate-500" : "text-white/42")}>{countLabel}</p>
          </div>
          <button onClick={onClose} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]", isLight ? "border-slate-300 text-slate-700" : "border-white/12 text-white/70")}>
            <X size={13} />
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <a key={`${image.url}-${index}`} href={image.url} target="_blank" rel="noreferrer" className="group relative h-56 overflow-hidden rounded-[22px] border border-white/10 bg-black">
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
    </div>
  );
}
