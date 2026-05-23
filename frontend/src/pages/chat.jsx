/**
 * chat.jsx — Rihla AI floating chat page.
 * Dark full-screen backdrop with a fixed vertical chat panel (380×520) bottom-right.
 * Chat panel is already accessible via the floating ChatButton on every page;
 * this route provides a dedicated focused chat experience.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, MapPin, RotateCcw, ArrowLeft, Sparkles, ArrowRight } from "lucide-react";
import { sendChatMessage } from "@/services/chatService";

// ── Quick-start chips ────────────────────────────────────────────────────────
const CHIPS = [
  "3 days Ooty adventure",
  "2 days Pondicherry heritage",
  "5 days Dubai luxury",
  "Weekend Coorg trip",
];

const WELCOME = {
  id:        "welcome",
  role:      "assistant",
  content:   "Hi traveler! ✨ I'm your **Rihla AI** planner.\n\nTell me your destination and days — I'll build a full itinerary with real places.\n\n*Try: \"3 days Ooty for 2 people\"*",
  itinerary: null,
};

// ── Minimal markdown: **bold** and *italic* inline, bullet lines ─────────────
function MdText({ text }) {
  return (
    <div className="space-y-0.5 leading-relaxed text-sm">
      {String(text).split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        const html = line
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>");
        const bullet = /^[-•]\s/.test(line.trim());
        return (
          <div key={i} className={bullet ? "flex gap-1.5" : ""}>
            {bullet && <span className="text-[#D4AF37] mt-0.5 flex-shrink-0 text-xs">•</span>}
            <span dangerouslySetInnerHTML={{ __html: bullet ? html.replace(/^[-•]\s/, "") : html }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, onApplyPlan }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-[#D4AF37]/20">
          <Bot size={13} className="text-black" />
        </div>
      )}

      <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        <div
          className="rounded-2xl px-3 py-2"
          style={isUser ? {
            background: "linear-gradient(135deg,#D4AF37,#c9a227)",
            color: "#0B1220",
            fontWeight: 600,
            fontSize: 13,
            borderBottomRightRadius: 4,
          } : {
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0",
            borderBottomLeftRadius: 4,
          }}
        >
          {isUser ? <span className="text-sm">{msg.content}</span> : <MdText text={msg.content} />}
        </div>

        {/* Itinerary CTA */}
        {msg.itinerary && onApplyPlan && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            onClick={() => onApplyPlan(msg.itinerary)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 w-full transition-all group"
            style={{
              background: "linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.06))",
              border: "1px solid rgba(212,175,55,0.3)",
            }}
          >
            <div className="w-6 h-6 rounded-lg bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
              <Sparkles size={11} className="text-black" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">✦ Itinerary Ready</p>
              <p className="text-[10px] text-white/45 truncate">
                {msg.itinerary.trip_overview?.destination}
                {msg.itinerary.trip_overview?.total_days ? ` · ${msg.itinerary.trip_overview.total_days} days` : ""}
              </p>
            </div>
            <ArrowRight size={12} className="text-[#D4AF37]/50 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </motion.button>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-white/50">
          U
        </div>
      )}
    </motion.div>
  );
}

// ── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
        <Bot size={13} className="text-black" />
      </div>
      <div className="px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [, nav]             = useLocation();
  const [messages, setMsgs] = useState([WELCOME]);
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(false);
  const bottomRef            = useRef(null);
  const inputRef             = useRef(null);
  const historyRef           = useRef([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = useCallback(async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput("");

    setMsgs(prev => [...prev, { id: Date.now() + "u", role: "user", content: t }]);
    setLoad(true);
    historyRef.current = [...historyRef.current, { role: "user", content: t }].slice(-10);

    try {
      const { reply, itinerary } = await sendChatMessage(t, historyRef.current);
      const aiMsg = { id: Date.now() + "a", role: "assistant", content: reply, itinerary: itinerary || null };
      setMsgs(prev => [...prev, aiMsg]);
      historyRef.current = [...historyRef.current, { role: "assistant", content: reply }].slice(-10);
    } catch {
      setMsgs(prev => [...prev, { id: Date.now() + "e", role: "assistant", content: "⚠️ Connection issue — try again.", itinerary: null }]);
    } finally {
      setLoad(false);
    }
  }, [input, loading]);

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const applyPlan = (plan) => {
    sessionStorage.setItem("rihla_chat_plan", JSON.stringify(plan));
    nav("/planner");
  };

  const handleReset = () => { setMsgs([WELCOME]); historyRef.current = []; inputRef.current?.focus(); };

  const isEmpty = messages.length === 1 && messages[0].id === "welcome";

  return (
    /* Dark full-screen backdrop */
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#060f1c" }}>

      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(212,175,55,0.07) 0%, transparent 70%)" }}
      />

      {/* Back button */}
      <button
        onClick={() => nav("/planner")}
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/80 transition-all text-sm"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline text-xs font-semibold">Back to Planner</span>
      </button>

      {/* ── Floating vertical chat panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col z-10"
        style={{
          width:        380,
          height:       520,
          borderRadius: 20,
          background:   "#111827",
          border:       "1px solid rgba(255,255,255,0.09)",
          boxShadow:    "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.1)",
          overflow:     "hidden",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-white/8"
          style={{ background: "rgba(212,175,55,0.05)" }}>
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37] flex items-center justify-center shadow-md shadow-[#D4AF37]/25">
            <MapPin size={15} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-[13px]">Rihla AI Planner</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400">Online · Real places only</span>
            </div>
          </div>
          <button onClick={handleReset}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/6 transition-all">
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center pt-4 pb-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-xl shadow-[#D4AF37]/25">
                <MapPin size={20} className="text-black" />
              </div>
              <p className="text-white/70 text-sm font-bold mb-0.5">Where do you want to go?</p>
              <p className="text-white/30 text-xs">Destination + days = real itinerary</p>
            </motion.div>
          )}

          {messages.map(msg => (
            <Bubble key={msg.id} msg={msg} onApplyPlan={applyPlan} />
          ))}
          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        <AnimatePresence>
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-shrink-0 flex flex-wrap gap-1.5 px-3 pb-2"
            >
              {CHIPS.map(c => (
                <button key={c} onClick={() => handleSend(c)}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; e.currentTarget.style.color = "#D4AF37"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                >
                  {c}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-white/8">
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKey}
              placeholder="Ask about your trip…"
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/25 text-[13px] resize-none leading-relaxed"
              style={{ minHeight: 20, maxHeight: 100 }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: input.trim() && !loading ? "linear-gradient(135deg,#D4AF37,#c9a227)" : "rgba(255,255,255,0.08)" }}
            >
              <Send size={13} className={input.trim() && !loading ? "text-black" : "text-white/40"} />
            </button>
          </div>
          <p className="text-center text-[9px] text-white/15 mt-1.5">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </motion.div>
    </div>
  );
}
