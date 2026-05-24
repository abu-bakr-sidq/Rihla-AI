// ChatInput.jsx — text input + send button for the chat window
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

const QUICK_PROMPTS = [
  "Plan a 3 day trip to Paris",
  "Best beaches in Southeast Asia",
  "Budget trip to Tokyo under $1000",
  "Show my saved trips",
];

export function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    const msg = value.trim();
    if (!msg || disabled) return;
    setValue("");
    onSend(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border p-3 space-y-2.5 bg-card/80 backdrop-blur-sm">
      {/* Quick prompts — only show when input is empty */}
      {!value && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => onSend(p)} disabled={disabled}
              className="text-[11px] px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
            >{p}</button>
          ))}
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about travel…"
          rows={1}
          disabled={disabled}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none outline-none focus:border-primary transition-all min-h-[40px] max-h-[120px] disabled:opacity-50"
          style={{ height: "auto" }}
          ref={el => { if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; } }}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
