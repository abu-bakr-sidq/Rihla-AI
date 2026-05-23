"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Plane, Globe, Map, Navigation, Compass, Sparkles, 
  MapPin, Camera, Luggage, Tent, Sailboat, Hotel,
  Wind, Cloud, Sun, Sunrise
} from "lucide-react";

interface FloatingIconsHeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const icons = [
  Plane, Globe, Map, Navigation, Compass, Sparkles, 
  MapPin, Camera, Luggage, Tent, Sailboat, Hotel,
  Wind, Cloud, Sun, Sunrise
];

export const FloatingIconsHeroSection = ({
  title,
  subtitle,
  description,
  children,
  className,
}: FloatingIconsHeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 30);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 30);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-transparent",
        className
      )}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {Array.from({ length: 24 }).map((_, i) => {
          const Icon = icons[i % icons.length];
          const left = (i * 27) % 100;
          const top = (i * 19) % 100;
          const delay = i * 0.1;
          const duration = 10 + (i % 10);
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.05, 0.15, 0.05],
                scale: [0.9, 1.1, 0.9],
                x: mouseX.get() * (0.15 + (i % 6) * 0.2),
                y: mouseY.get() * (0.15 + (i % 6) * 0.2),
              }}
              transition={{
                opacity: { duration, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: duration / 1.5, repeat: Infinity, ease: "easeInOut" },
                x: { type: "spring", stiffness: 50, damping: 20 },
                y: { type: "spring", stiffness: 50, damping: 20 },
              }}
              className="absolute"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
            >
              <Icon 
                className={cn(
                  "w-5 h-5",
                  i % 3 === 0 ? "text-[#D4AF37]" : i % 3 === 1 ? "text-[#D4AF37]/60" : "text-white/20"
                )} 
              />
            </motion.div>
          );
        })}
      </div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-4 pt-16 md:pt-24"
      >
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[#D4AF37] text-[10px] font-black tracking-[0.4em] uppercase mb-6"
          >
            {subtitle}
          </motion.div>
        )}
        
        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl font-black text-foreground tracking-tighter mb-8 max-w-4xl"
          >
            {title}
          </motion.h1>
        )}

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-foreground/40 text-sm md:text-base font-medium max-w-xl mb-12"
          >
            {description}
          </motion.p>
        )}

        {children}
      </motion.div>

      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/05 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D4AF37]/03 rounded-full blur-[150px] pointer-events-none animate-pulse delay-1000" />
    </div>
  );
};
