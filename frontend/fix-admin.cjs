const fs = require('fs');
let code = fs.readFileSync('src/pages/admin.jsx', 'utf8');

// 1. Add DashboardSlideshow import if missing
if (!code.includes('import DashboardSlideshow')) {
  code = code.replace(
    'import { Link } from "wouter";',
    'import { Link } from "wouter";\nimport DashboardSlideshow from "@/components/ui/DashboardSlideshow";'
  );
}

// 2. Fix the huge container wrapper at the very bottom (line 593 approx)
code = code.replace(
  /<div className="min-h-screen bg-\[#0a0a0c\] text-foreground relative overflow-x-hidden no-scrollbar">/g, 
  `<div className="min-h-screen text-foreground relative overflow-x-hidden no-scrollbar bg-background/50">
      <div className="fixed inset-0 z-[-1]">
        <DashboardSlideshow />
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/70 dark:bg-black/70 backdrop-blur-[40px] dark:backdrop-blur-[10px] transition-colors duration-500" />`
);

// 3. Make Nav and hardcoded dark colors dynamic using Tailwind dark: variant
code = code.replace(/bg-\[#0a0a0c\]\/80/g, 'bg-white/60 dark:bg-[#0a0a0c]/80');
code = code.replace(/border-white\/\[0\.05\]/g, 'border-black/5 dark:border-white/5');
code = code.replace(/border-white\/10/g, 'border-black/10 dark:border-white/10');
code = code.replace(/border-white\/20/g, 'border-black/20 dark:border-white/20');
code = code.replace(/bg-white\/\[0\.03\]/g, 'bg-black/[0.03] dark:bg-white/[0.03]');
code = code.replace(/bg-white\/\[0\.02\]/g, 'bg-black/[0.02] dark:bg-white/[0.02]');
code = code.replace(/bg-white\/\[0\.04\]/g, 'bg-black/[0.04] dark:bg-white/[0.04]');
code = code.replace(/bg-white\/\[0\.05\]/g, 'bg-black/[0.05] dark:bg-white/[0.05]');
code = code.replace(/bg-white\/\[0\.06\]/g, 'bg-black/[0.06] dark:bg-white/[0.06]');
code = code.replace(/bg-white\/\[0\.07\]/g, 'bg-black/[0.07] dark:bg-white/[0.07]');
code = code.replace(/bg-white\/\[0\.08\]/g, 'bg-black/[0.08] dark:bg-white/[0.08]');
code = code.replace(/bg-white\/10/g, 'bg-black/10 dark:bg-white/10');
code = code.replace(/bg-white\/90/g, 'bg-black/90 dark:bg-white/90');

code = code.replace(/border-white\/\[0\.07\]/g, 'border-black/5 dark:border-white/[0.07]');
code = code.replace(/border-white\/\[0\.08\]/g, 'border-black/[0.08] dark:border-white/[0.08]');

// Fix inline string backgrounds and colors using CSS variables
code = code.replace(/rgba\(255,255,255,0\.02\)/g, 'var(--panel-bg, rgba(255,255,255,0.02))');
code = code.replace(/rgba\(255,255,255,0\.07\)/g, 'var(--panel-border, rgba(255,255,255,0.07))');
code = code.replace(/rgba\(255,255,255,0\.04\)/g, 'var(--item-bg, rgba(255,255,255,0.04))');
code = code.replace(/rgba\(255,255,255,0\.08\)/g, 'var(--item-border, rgba(255,255,255,0.08))');
code = code.replace(/rgba\(255,255,255,0\.35\)/g, 'var(--text-muted, rgba(255,255,255,0.35))');
code = code.replace(/rgba\(255,255,255,0\.3\)/g, 'var(--text-muted, rgba(255,255,255,0.3))');

code = code.replace(/fill: "rgba\(255,255,255,0\.35\)"/g, 'fill: "var(--text-muted, #888)"');
code = code.replace(/fill:'rgba\(255,255,255,0\.3\)'/g, 'fill: "var(--text-muted, #888)"');

// Remove hardcoded text-white colors, replace with standard theme text color
code = code.replace(/text-white\/40/g, 'text-black/40 dark:text-white/40');
code = code.replace(/text-white\/30/g, 'text-black/30 dark:text-white/30');
code = code.replace(/text-white\/20/g, 'text-black/20 dark:text-white/20');
code = code.replace(/text-white\/80/g, 'text-black/80 dark:text-white/80');
code = code.replace(/text-white\/50/g, 'text-black/50 dark:text-white/50');
// Just text-white when used for main text
code = code.replace(/ text-white/g, ' text-slate-800 dark:text-white');

// Nav tabs add settings if the user wanted Settings Tab!
// Wait - let's see where NAV_TABS is defined. Oh it's NOT in admin.jsx!
// wait, where is NAV_TABS? I need to check.

// Replace fixed black backgrounds
code = code.replace(/bg-\[#0a0a0c\]/g, 'bg-background');

const styleInjection = `
  <style dangerouslySetInnerHTML={{ __html: \`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    :root {
      --panel-bg: rgba(0,0,0,0.03);
      --panel-border: rgba(0,0,0,0.08);
      --item-bg: rgba(0,0,0,0.04);
      --item-border: rgba(0,0,0,0.06);
      --text-muted: rgba(0,0,0,0.5);
    }
    html.dark {
      --panel-bg: rgba(255,255,255,0.02);
      --panel-border: rgba(255,255,255,0.07);
      --item-bg: rgba(255,255,255,0.04);
      --item-border: rgba(255,255,255,0.08);
      --text-muted: rgba(255,255,255,0.35);
    }
  \`}} />
`;
code = code.replace(/<style dangerouslySetInnerHTML={{ __html: `[\s\S]*?`}} \/>/m, styleInjection);

fs.writeFileSync('src/pages/admin.jsx', code);
console.log('Admin page aesthetic refactored successfully.');
