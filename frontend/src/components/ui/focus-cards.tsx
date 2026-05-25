"use client";
import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { sanitizeVisibleText } from "../../lib/display-text";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onSelect,
    isSelected,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onSelect?: (card: any) => void;
    isSelected?: boolean;
  }) => {
    const [localSrc, setLocalSrc] = useState(card.src);
    const [hasError, setHasError] = useState(false);
    const safeTitle = sanitizeVisibleText(card.title, "Destination");
    const safeLocation = sanitizeVisibleText(card.location);

    // Sync localSrc if card.src changes externally (and no error yet)
    React.useEffect(() => {
      if (!hasError) setLocalSrc(card.src);
    }, [card.src, hasError]);

    return (
      <div
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onSelect?.(card)}
        className={cn(
          "rounded-2xl relative bg-zinc-900 overflow-hidden h-44 w-full transition-all duration-500 ease-out border cursor-pointer group",
          isSelected
            ? "border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35)] scale-[1.02]"
            : hovered === index
            ? "border-[#D4AF37]/50 shadow-[0_0_18px_rgba(212,175,55,0.18)] scale-[1.01]"
            : hovered !== null
            ? "border-white/5 blur-[1px] scale-[0.97] opacity-45"
            : "border-white/8"
        )}
      >
        <img
          src={localSrc}
          alt={safeTitle}
          className="object-cover absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-110"
          onError={() => {
            if (!hasError) {
              setHasError(true);
              setLocalSrc("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop");
            }
          }}
        />
      {/* Keep labels readable even on bright destination photos. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/42 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="inline-flex max-w-full flex-col rounded-2xl bg-black/38 px-3 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.42)] ring-1 ring-white/10 backdrop-blur-[2px]">
          <div className="max-w-full truncate text-[14px] font-display italic font-black text-white uppercase tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            {safeTitle}
          </div>
          {safeLocation && (
            <div className="mt-1 max-w-full truncate rounded-full border border-[#D4AF37]/35 bg-black/55 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.35em] text-[#FFE28A] shadow-[0_6px_18px_rgba(0,0,0,0.42)] [text-shadow:0_1px_5px_rgba(0,0,0,0.95)]">
              {safeLocation}
            </div>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#D4AF37] text-black text-[8px] font-black uppercase tracking-widest shadow-lg">
          Selected
        </div>
      )}

      {/* Hover CTA (only when not selected) */}
      {!isSelected && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            hovered === index ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="px-4 py-1.5 rounded-full bg-[#D4AF37] text-black text-[8px] font-black uppercase tracking-[0.25em] shadow-lg">
            Select
          </div>
        </div>
      )}
    </div>
  );
}
);

Card.displayName = "Card";

type CardData = {
  title: string;
  src: string;
  location?: string;
};

export function FocusCards({
  cards,
  onSelect,
  selectedTitle,
}: {
  cards: CardData[];
  onSelect?: (card: any) => void;
  selectedTitle?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
      {cards.map((card, index) => (
        <Card
          key={sanitizeVisibleText(card.title, "destination") + index}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          onSelect={onSelect}
          isSelected={!!selectedTitle && sanitizeVisibleText(card.title).toLowerCase() === sanitizeVisibleText(selectedTitle).toLowerCase()}
        />
      ))}
    </div>
  );
}


