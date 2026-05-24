import React from "react";
import { BeamsBackground } from "./ui/beams-background";

/**
 * FloatingBackground — two-layer system:
 *   1. BeamsBackground (moving colored beam streaks)
 *   2. DottedSurface handled separately in App.jsx
 * No color blobs — they break light mode continuity.
 */
export default function FloatingBackground({ className = "" }) {
  return (
    <div className={`fixed inset-0 pointer-events-none z-[-1] ${className}`}>
      {/* Layer 1: Animated beams — visible at medium strength */}
      <BeamsBackground intensity="medium" className="opacity-65" />
    </div>
  );
}
