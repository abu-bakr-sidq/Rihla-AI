// ChatButton.jsx — floating trigger with hover tooltip (from reference AIChatWidget)
import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X, Maximize2, Sparkles, Bot } from "lucide-react";
import { ChatWindow } from "./ChatWindow";

export function ChatButton({ onItinerary }) {
  const [open,      setOpen]      = useState(false);
  const [isHovered, setIsHovered] = useState(false);  // reference: hover tooltip
  const [, nav]                   = useLocation();

  const handleItinerary = (plan) => {
    if (onItinerary) onItinerary(plan);
  };


  return (
    <>
      {/* Quick chat panel */}
      <AnimatePresence>
        {open && (
          <ChatWindow
            onClose={() => setOpen(false)}
            onItinerary={handleItinerary}
          />
        )}
      </AnimatePresence>

      {/* Floating trigger group */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-5 sm:right-6">

        {/* "Full screen" link — appears when panel is open */}
        <AnimatePresence>
          {open && (
            <motion.button
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{    opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              onClick={() => { setOpen(false); nav("/chat"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xl"
              style={{
                background: "rgba(6,15,28,0.92)",
                border: "1px solid rgba(212,175,55,0.35)",
                color: "#D4AF37",
                backdropFilter: "blur(12px)",
              }}
            >
              <Maximize2 size={12} />
              <span className="hidden sm:inline">Full Chat</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Main toggle button */}
        <motion.button
          onClick={() => setOpen(o => !o)}
          onHoverStart={() => setIsHovered(true)}   /* reference: isHovered tooltip */
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex items-center justify-center rounded-full w-14 h-14 text-white shadow-2xl select-none"
          style={{
            background: open
              ? "#0ea5e9"
              : "#0ea5e9",
            boxShadow: "0 8px 32px rgba(14,165,233,0.4), 0 0 0 1px rgba(14,165,233,0.2)",
          }}
          aria-label={open ? "Close AI Travel Planner" : "Chat with AI"}
        >
          {/* Ping ring (reference: animate-ping on FAB) */}
          {!open && (
            <span className="absolute inset-0 rounded-full border border-[#0ea5e9]/50 animate-ping opacity-30" />
          )}

          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="close"
                initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </motion.span>
            ) : (
              <motion.span key="open"
                initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Bot style={{ width: 22, height: 22 }} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* reference: hover tooltip — slides in from right when FAB is hovered + closed */}
        <AnimatePresence>
          {isHovered && !open && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0   }}
              exit={{    opacity: 0, x: 8   }}
              transition={{ duration: 0.18 }}
              className="absolute right-[calc(100%+12px)] bottom-1 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap text-[12px] font-semibold pointer-events-none"
              style={{
                background:    "rgba(6,15,28,0.92)",
                border:        "1px solid rgba(56,189,248,0.3)",
                color:         "#38bdf8",
                backdropFilter: "blur(12px)",
                boxShadow:     "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              <Sparkles size={12} />
              Ask Rihla AI
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
