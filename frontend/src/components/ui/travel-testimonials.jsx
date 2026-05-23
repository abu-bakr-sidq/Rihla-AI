/**
 * AnimatedTestimonials — travel traveler reviews with stacked rotating photos.
 * Adapted for Rihla AI (JSX, framer-motion).
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Star, Quote } from "lucide-react";

const TRAVEL_TESTIMONIALS = [
  {
    quote: "Rihla AI planned my entire 10-day Japan trip in minutes. The itinerary was so detailed and spot-on — every restaurant, temple, and train connection was perfect.",
    name: "Aisha Rahman",
    designation: "Travel Blogger · Dubai, UAE",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    destination: "Kyoto, Japan",
  },
  {
    quote: "I was skeptical about AI travel planning but Rihla completely changed my mind. The Maldives package it curated for us was flawless — halal dining, private villas, everything.",
    name: "Omar Al-Farsi",
    designation: "Business Traveler · Riyadh, KSA",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    destination: "Maldives",
  },
  {
    quote: "The budget breakdown feature saved us thousands. Rihla not only plans your trip but tells you exactly what to spend and where. Best travel tool I've ever used.",
    name: "Fatima Zahra",
    designation: "Family Travel Enthusiast · Casablanca",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    destination: "Istanbul, Turkey",
  },
  {
    quote: "From Dubai to Santorini, every trip I've planned through Rihla AI has been an unforgettable experience. The AI truly understands what modern Muslim travelers need.",
    name: "Yusuf Karimov",
    designation: "Adventure Traveler · Tashkent",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    destination: "Santorini, Greece",
  },
  {
    quote: "Planning a solo trip to Cappadocia felt overwhelming — until I found Rihla. It built a 7-day itinerary in seconds that felt handcrafted just for me.",
    name: "Mariam Khalil",
    designation: "Solo Traveler · Beirut, Lebanon",
    src: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=600&auto=format&fit=crop",
    rating: 5,
    destination: "Cappadocia, Turkey",
  },
];

export function AnimatedTestimonials({ testimonials = TRAVEL_TESTIMONIALS, autoplay = true }) {
  const [active, setActive] = useState(0);

  const handleNext = useCallback(() => {
    setActive((p) => (p + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = () => {
    setActive((p) => (p - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(handleNext, 5000);
    return () => clearInterval(id);
  }, [autoplay, handleNext]);

  const getRot = () => `${Math.floor(Math.random() * 14) - 7}deg`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16 items-center">

        {/* ── Stacked Photos ── */}
        <div className="flex items-center justify-center">
          <div className="relative h-80 w-72">
            <AnimatePresence>
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.src}
                  initial={{ opacity: 0, scale: 0.88, y: 40, rotate: getRot() }}
                  animate={{
                    opacity: i === active ? 1 : 0.4,
                    scale: i === active ? 1 : 0.88,
                    y: i === active ? 0 : 16,
                    rotate: i === active ? "0deg" : getRot(),
                    zIndex: i === active ? testimonials.length : testimonials.length - Math.abs(i - active),
                  }}
                  exit={{ opacity: 0, scale: 0.88, y: -40 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={t.src}
                    alt={t.name}
                    className="h-full w-full rounded-2xl object-cover shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&size=500&background=1a1a2e&color=D4AF37`;
                      e.currentTarget.onerror = null;
                    }}
                  />
                  {/* Overlay destination tag */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                      style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}>
                      ✈ {t.destination}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Text Content ── */}
        <div className="flex flex-col justify-center space-y-6">
          {/* Stars */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* Quote */}
              <div className="relative">
                <Quote className="absolute -top-1 -left-1 w-6 h-6 text-[#D4AF37]/20" fill="currentColor" />
                <p className="text-base text-white/75 leading-relaxed pl-5 italic">
                  {testimonials[active].quote}
                </p>
              </div>

              {/* Author */}
              <div className="border-t border-white/[0.06] pt-5">
                <p className="font-black text-white text-base">{testimonials[active].name}</p>
                <p className="text-white/40 text-xs mt-0.5">{testimonials[active].designation}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all hover:bg-white/5"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 ml-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`rounded-full transition-all duration-300 ${i === active ? "w-5 h-1.5 bg-[#D4AF37]" : "w-1.5 h-1.5 bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedTestimonials;
