import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

const STYLE_BACKDROPS = {
  luxury: [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2400&q=90",
  ],
  heritage: [
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2400&q=90",
  ],
  adventure: [
    "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1527672809634-0bced0366661?auto=format&fit=crop&w=2400&q=90",
  ],
  nature: [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=90",
  ],
  urban: [
    "https://images.unsplash.com/photo-1702085241418-e87b3b60a497?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2400&q=90",
  ],
  wellness: [
    "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=2400&q=90",
  ],
  halal: [
    "https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1729931421786-7bbd6c7d78f6?auto=format&fit=crop&w=2400&q=90",
    "/assets/hero_mosque.png",
  ],
  coastal: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1505881502020-0fc5f57a8044?auto=format&fit=crop&w=2400&q=90",
  ],
  default: [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=90",
    "https://images.unsplash.com/photo-1531366930421-ad53f362b1ae?auto=format&fit=crop&w=2400&q=90",
  ],
};

function getImageKey(travelStyle) {
  if (!travelStyle) return "default";
  const s = travelStyle.toLowerCase();
  if (s.includes("luxury")) return "luxury";
  if (s.includes("coastal") || s.includes("beach")) return "coastal";
  if (s.includes("wellness") || s.includes("spa") || s.includes("mindful")) return "wellness";
  if (s.includes("urban") || s.includes("city")) return "urban";
  if (s.includes("halal") || s.includes("muslim") || s.includes("spiritual")) return "halal";
  if (s.includes("cultural") || s.includes("history") || s.includes("heritage")) return "heritage";
  if (s.includes("cinematic") || s.includes("scenery") || s.includes("nature") || s.includes("mountain")) return "nature";
  if (s.includes("adventure") || s.includes("extreme")) return "adventure";
  return "default";
}

export default function PlannerSlideshow({ travelStyle = "nature" }) {
  const { theme } = useTheme();
  const requestedImageKey = getImageKey(travelStyle);
  const [activeImageKey, setActiveImageKey] = useState(requestedImageKey);
  const slides = useMemo(() => STYLE_BACKDROPS[activeImageKey] || STYLE_BACKDROPS.default, [activeImageKey]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [activeImageKey]);

  useEffect(() => {
    if (requestedImageKey === activeImageKey) return undefined;
    const nextSlides = STYLE_BACKDROPS[requestedImageKey] || STYLE_BACKDROPS.default;
    const firstSlide = nextSlides[0];
    if (!firstSlide) {
      setActiveImageKey(requestedImageKey);
      return undefined;
    }

    const image = new Image();
    image.src = firstSlide;
    image.onload = () => setActiveImageKey(requestedImageKey);
    image.onerror = () => setActiveImageKey(requestedImageKey);

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [requestedImageKey, activeImageKey]);

  useEffect(() => {
    const preloads = slides.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });
    return () => {
      preloads.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [slides]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides]);

  const isDark = theme !== "light";

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#08111d]">
      <AnimatePresence initial={false}>
        <motion.div
          key={`${activeImageKey}-${slides[index]}`}
          initial={{ opacity: 0, scale: 1.015, filter: "blur(3px) saturate(0.98)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px) saturate(1)" }}
          exit={{ opacity: 0, scale: 1.01, filter: "blur(2px) saturate(0.99)" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <motion.img
            src={slides[index]}
            alt=""
            animate={{ scale: 1.05 }}
            transition={{ duration: 11, ease: "linear" }}
            className="h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className={`absolute inset-0 transition-colors duration-700 ${isDark ? "bg-slate-950/44" : "bg-white/34"}`} />
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            isDark
              ? "bg-[linear-gradient(180deg,rgba(2,8,18,0.24)_0%,rgba(2,8,18,0.08)_35%,rgba(2,8,18,0.66)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.08)_35%,rgba(255,255,255,0.6)_100%)]"
          }`}
        />
      </div>
    </div>
  );
}
