'use client';

import { Suspense, lazy, useEffect } from 'react';
const Spline = lazy(() => import('@splinetool/react-spline'));

interface InteractiveRobotSplineProps {
  scene: string;
  className?: string;
}

export function InteractiveRobotSpline({ scene, className }: InteractiveRobotSplineProps) {
  // Stable Branding Eradication - Shadow Root Piercing
  useEffect(() => {
    const selectors = [
      'a[href*="spline.design"]', 'a[href*="spline"]',
      '[class*="Logo"]', '[id*="logo"]',
      '[class*="watermark"]', '[class*="badge"]',
      '[style*="spline"]', '#spline-watermark', '.spline-watermark'
    ];

    const styleTagContent = `
      ${selectors.join(', ')} {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      }
    `;

    const scrub = () => {
      const purgeRecursively = (root: ShadowRoot | Document) => {
        if (root instanceof ShadowRoot && !root.querySelector('#spline-hygiene')) {
          const style = document.createElement('style');
          style.id = 'spline-hygiene';
          style.textContent = styleTagContent;
          root.appendChild(style);
        }
        selectors.forEach(s => {
          root.querySelectorAll(s).forEach(el => el.remove());
        });
        root.querySelectorAll('*').forEach(el => {
          if (el.shadowRoot) purgeRecursively(el.shadowRoot);
        });
      };
      purgeRecursively(document);
    };

    const interval = setInterval(scrub, 50);
    const observer = new MutationObserver(scrub);
    observer.observe(document.body, { childList: true, subtree: true });

    scrub();
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <Suspense
      fallback={
        <div className={`w-full h-full flex items-center justify-center bg-transparent text-white ${className}`}>
           <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"></path>
          </svg>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
        style={{ 
          background: 'transparent',
          mixBlendMode: 'screen',
          // High-luminance base for Black Stealth inversion
          filter: "grayscale(1) brightness(1.8) contrast(1.6)"
        }}
      />
    </Suspense>
  );
}
