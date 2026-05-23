import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);
    
    // Check initial theme
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    // Observe theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    const moveMouse = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", moveMouse);
    return () => {
      window.removeEventListener("mousemove", moveMouse);
      observer.disconnect();
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;


  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 z-[9999] pointer-events-none mix-blend-difference"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        borderColor: isDarkMode ? "#FFFFFF" : "#000000",
        boxShadow: isDarkMode 
          ? "0 0 15px rgba(255,255,255,0.3)" 
          : "0 0 15px rgba(0,0,0,0.2)",
      }}
    >
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
        style={{
          backgroundColor: isDarkMode ? "#FFFFFF" : "#000000",
        }}
      />
    </motion.div>
  );
}
