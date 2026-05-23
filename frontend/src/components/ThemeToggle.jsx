import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeToggle = ({ className = '', compact = false, onClick, isDarkOverride }) => {
  const { theme, setTheme } = useTheme();
  const isDark = typeof isDarkOverride === 'boolean' ? isDarkOverride : theme !== 'light';
  const activeSide = isDark ? 'left' : 'right';

  return (
    <button
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick();
          return;
        }
        setTheme(isDark ? 'light' : 'dark');
      }}
      aria-label="Toggle theme"
      className={cn(
        "group relative inline-flex items-center rounded-[22px] border p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-500",
        compact ? "h-[42px] w-[82px] rounded-[16px] p-1" : "h-[50px] w-[120px]",
        isDark
          ? "border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.94),rgba(13,24,38,0.9))] text-white hover:border-[#D4AF37]/35"
          : "border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] text-slate-900 hover:border-[#D4AF37]/40",
        className
      )}
    >
      <span
        className={cn(
          compact ? "absolute inset-[4px] rounded-[12px]" : "absolute inset-[6px] rounded-[18px]",
          isDark ? "bg-white/[0.03]" : "bg-slate-100/90"
        )}
      />
      <span
        className={cn(
          compact
            ? "absolute top-[4px] h-[32px] w-[34px] rounded-[10px] transition-all duration-500 ease-out"
            : "absolute top-[6px] h-[38px] w-[42px] rounded-[14px] transition-all duration-500 ease-out",
          compact ? (activeSide === 'left' ? "left-[4px]" : "left-[44px]") : (activeSide === 'left' ? "left-[6px]" : "left-[72px]"),
          isDark
            ? "bg-[linear-gradient(180deg,#18283f,#0d1828)] shadow-[0_10px_24px_rgba(0,0,0,0.34)]"
            : "bg-[linear-gradient(180deg,#f8da64,#f0c93c)] shadow-[0_10px_24px_rgba(212,175,55,0.34)]"
        )}
      />

      <span className={cn("relative z-10 flex h-full flex-1 items-center justify-center transition-colors duration-500", activeSide === 'left' ? "text-white" : (isDark ? "text-white/35" : "text-slate-500"))}>
        <Moon className={cn("transition-all duration-500", compact ? "h-4 w-4" : "h-4.5 w-4.5")} />
      </span>
      {!compact && (
        <span className={cn("relative z-10 text-[9px] font-black uppercase tracking-[0.18em] transition-colors duration-500", isDark ? "text-white/65" : "text-slate-500")}>
          {isDark ? "Dark" : "Light"}
        </span>
      )}
      <span className={cn("relative z-10 flex h-full flex-1 items-center justify-center transition-colors duration-500", activeSide === 'right' ? "text-slate-950" : (isDark ? "text-white/35" : "text-slate-500"))}>
        <Sun className={cn("transition-all duration-500", compact ? "h-4 w-4" : "h-4.5 w-4.5")} />
      </span>
    </button>
  );
};

export default ThemeToggle;
