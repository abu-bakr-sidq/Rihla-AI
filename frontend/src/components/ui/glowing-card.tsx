import React from "react";
import { cn } from "@/lib/utils";

export const GlowingCard = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "relative p-[1px] group/card rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.6)]",
        containerClassName
      )}
    >
      {/* Border Follow Animation - Gold/Amber Tone */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/40 via-amber-200/50 to-[#D4AF37]/40 opacity-10 group-hover/card:opacity-80 transition-opacity duration-700 blur-[2px]" />
      
      {/* Inner Card Content */}
      <div
        className={cn(
          "relative z-10 bg-black/50 backdrop-blur-3xl rounded-[23px] border border-white/[0.08] group-hover/card:border-[#D4AF37]/30 transition-all duration-500 h-full",
          className
        )}
      >
        {/* Animated Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-10 transition-opacity duration-700">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#D4AF37_1px,transparent_1px),linear-gradient(to_bottom,#D4AF37_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>
        
        {children}
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-[2px] bg-gradient-to-r from-[#D4AF37] via-amber-500 to-[#D4AF37] rounded-3xl opacity-0 group-hover/card:opacity-[0.15] blur-2xl transition-all duration-700 pointer-events-none" />
    </div>
  );
};
