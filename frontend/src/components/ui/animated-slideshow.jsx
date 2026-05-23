/**
 * HoverSlider — animated slideshow where hovering text reveals images.
 * Adapted from animated-slideshow pattern (JSX, framer-motion).
 */
import * as React from "react";
import { MotionConfig, motion } from "framer-motion";

const HoverSliderContext = React.createContext(undefined);

function useHoverSliderContext() {
  const ctx = React.useContext(HoverSliderContext);
  if (!ctx) throw new Error("Must be used within HoverSlider");
  return ctx;
}

export const HoverSlider = ({ children, className, defaultIndex = 0, ...props }) => {
  const [activeSlide, setActiveSlide] = React.useState(defaultIndex);
  const changeSlide = React.useCallback((index) => setActiveSlide(index), []);
  return (
    <HoverSliderContext.Provider value={{ activeSlide, changeSlide }}>
      <div className={className} {...props}>{children}</div>
    </HoverSliderContext.Provider>
  );
};

export const TextStaggerHover = ({ text, index, className, children, ...props }) => {
  const { activeSlide, changeSlide } = useHoverSliderContext();
  const isActive = activeSlide === index;
  const chars = text.split("");

  return (
    <span
      className={["relative inline-block overflow-hidden", className].filter(Boolean).join(" ")}
      onMouseEnter={() => changeSlide(index)}
      {...props}
    >
      {chars.map((char, i) => (
        <span key={i} className="relative inline-block overflow-hidden">
          <MotionConfig transition={{ delay: i * 0.018, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <motion.span
              className="inline-block"
              animate={isActive ? { y: "-110%", opacity: 0.4 } : { y: "0%", opacity: 0.35 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
            <motion.span
              className="absolute left-0 top-0 inline-block"
              initial={{ y: "110%" }}
              animate={isActive ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          </MotionConfig>
        </span>
      ))}
      {children}
    </span>
  );
};

const clipVariants = {
  visible: { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
  hidden: { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0px)" },
};

export const HoverSliderImageWrap = ({ className, ...props }) => (
  <div
    className={["grid overflow-hidden [&>*]:col-start-1 [&>*]:col-end-1 [&>*]:row-start-1 [&>*]:row-end-1 [&>*]:size-full", className].filter(Boolean).join(" ")}
    {...props}
  />
);

export const HoverSliderImage = ({ index, src, alt = "", className, ...props }) => {
  const { activeSlide } = useHoverSliderContext();
  return (
    <motion.img
      className={["inline-block align-middle object-cover w-full h-full", className].filter(Boolean).join(" ")}
      transition={{ ease: [0.33, 1, 0.68, 1], duration: 0.75 }}
      variants={clipVariants}
      animate={activeSlide === index ? "visible" : "hidden"}
      src={src}
      alt={alt}
      loading="lazy"
      {...props}
    />
  );
};
