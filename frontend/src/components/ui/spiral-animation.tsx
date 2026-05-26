"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export const SpiralAnimation = ({
  className,
  text = "Generating Itinerary...",
}: {
  className?: string;
  text?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spiralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spiralRef.current) return;

    const ctx = gsap.context(() => {
      // Create rings
      const rings = 5;
      const particlesPerRing = 12;
      
      for (let i = 0; i < rings; i++) {
        const ring = document.createElement("div");
        ring.className = "absolute inset-0 flex items-center justify-center";
        spiralRef.current?.appendChild(ring);

        for (let j = 0; j < particlesPerRing; j++) {
          const particle = document.createElement("div");
          particle.className = "absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 blur-[1px]";
          
          const angle = (j / particlesPerRing) * Math.PI * 2;
          const radius = 40 + i * 25;
          
          gsap.set(particle, {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            scale: 1 - i * 0.15,
            opacity: 0.8 - i * 0.1,
          });
          
          ring.appendChild(particle);

          // Animation
          gsap.to(particle, {
            rotation: 360,
            duration: 3 + i * 1,
            repeat: -1,
            ease: "none",
            modifiers: {
              x: (x) => {
                const currentAngle = angle + (gsap.getProperty(particle, "rotation") as number * (Math.PI / 180));
                return Math.cos(currentAngle) * radius;
              },
              y: (y) => {
                const currentAngle = angle + (gsap.getProperty(particle, "rotation") as number * (Math.PI / 180));
                return Math.sin(currentAngle) * radius;
              }
            }
          });
        }
      }

      // Rotation animation for the whole container
      gsap.to(spiralRef.current, {
        rotation: 360,
        duration: 10,
        repeat: -1,
        ease: "none",
      });
    }, spiralRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-12", className)} ref={containerRef}>
      <div className="relative w-64 h-64" ref={spiralRef}>
        {/* Central Glow */}
        <div className="absolute inset-0 m-auto w-24 h-24 bg-[#D4AF37]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 m-auto w-12 h-12 bg-[#D4AF37]/20 rounded-full blur-2xl animate-pulse delay-75" />
      </div>
      
      {text ? (
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-xl font-black text-white tracking-widest uppercase animate-pulse">
            {text}
          </h3>
          <p className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em]">
            Rihla AI is architecting your neural nodes
          </p>
        </div>
      ) : null}
    </div>
  );
};
