import React from "react";
import { motion } from "framer-motion";

export const SunsetBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute inset-[-100%]"
        style={{
          background: `
            repeating-linear-gradient(100deg, 
              #ff6b6b 10%, 
              #feca57 15%, 
              #ff9ff3 20%, 
              #ff6b6b 25%, 
              #feca57 30%)
          `,
          backgroundSize: "300% 100%",
          filter: "blur(80px)",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-[-10px]"
        style={{
          background: `
            repeating-linear-gradient(100deg, 
              rgba(255, 107, 107, 0.1) 0%, 
              rgba(255, 107, 107, 0.1) 7%, 
              transparent 10%, 
              transparent 12%, 
              rgba(255, 107, 107, 0.1) 16%),
            repeating-linear-gradient(100deg, 
              #ff6b6b 10%, 
              #feca57 15%, 
              #ff9ff3 20%, 
              #ff6b6b 25%, 
              #feca57 30%)
          `,
          backgroundSize: "200%, 100%",
          backgroundPosition: "50% 50%, 50% 50%",
          mixBlendMode: "difference",
        }}
        animate={{
          backgroundPosition: [
            "50% 50%, 50% 50%",
            "100% 50%, 150% 50%",
            "50% 50%, 50% 50%",
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export default SunsetBackground;
