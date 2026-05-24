// ChatBubble.jsx — renders a single AI or user message
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useState, useEffect } from "react";

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

export function ChatBubble({ role, content, isLoading }) {
  const isUser = role === "user";
  const [displayedText, setDisplayedText] = useState("");

  // Typewriter effect for AI (only for non-loading, non-user messages)
  useEffect(() => {
    if (isUser || isLoading || !content) {
      setDisplayedText(content);
      return;
    }

    let currentIndex = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, currentIndex + 1));
      currentIndex += 2; // Type 2 chars at a time for speed
      if (currentIndex >= content.length) {
        setDisplayedText(content);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content, isUser, isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5 ${isUser ? "bg-primary" : "bg-gradient-to-br from-blue-500/20 to-violet-600/20 backdrop-blur-md"}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm transition-colors ${isUser
            ? "bg-primary text-primary-foreground rounded-br-sm shadow-primary/10"
            : "bg-muted/50 dark:bg-white/5 backdrop-blur-md text-foreground border border-border dark:border-white/10 rounded-bl-sm"
          }`}
      >
        {isLoading ? <TypingDots /> : (displayedText || content)}
      </div>
    </motion.div>
  );
}
