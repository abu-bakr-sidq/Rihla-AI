import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * BackgroundGradient — Aceternity UI (adapted for Vite/JSX)
 * Animated radial gradient border that shifts between teal, purple, gold & blue.
 */
export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}) {
  const variants = {
    initial:  { backgroundPosition: "0 50%" },
    animate:  { backgroundPosition: ["0 50%", "100% 50%", "0 50%"] },
  };

  const gradientClasses =
    "bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]";

  const sharedMotion = animate
    ? { variants, initial: "initial", animate: "animate",
        transition: { duration: 5, repeat: Infinity, repeatType: "reverse" },
        style: { backgroundSize: "400% 400%" } }
    : {};

  return (
    <div className={cn("relative p-[3px] group", containerClassName)}>
      {/* Blurred glow layer */}
      <motion.div
        {...sharedMotion}
        className={cn(
          "absolute inset-0 rounded-2xl z-[1] opacity-60 group-hover:opacity-100",
          "blur-xl transition duration-500 will-change-transform",
          gradientClasses
        )}
      />
      {/* Sharp border layer */}
      <motion.div
        {...sharedMotion}
        className={cn(
          "absolute inset-0 rounded-2xl z-[1] will-change-transform",
          gradientClasses
        )}
      />
      {/* Content */}
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
