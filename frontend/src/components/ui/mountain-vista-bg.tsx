import React, { useMemo } from 'react';

// Data Configuration
const layersData = [
  { className: 'layer-6', speed: '120s', size: '250px', zIndex: 1, image: '6' },
  { className: 'layer-5', speed: '95s',  size: '350px', zIndex: 1, image: '5' },
  { className: 'layer-4', speed: '75s',  size: '500px', zIndex: 1, image: '4' },
  // Bikes - Fixed positioning and size
  { className: 'bike-1',  speed: '14s',  size: '120px',  zIndex: 2, image: 'bike', animation: 'parallax_bike', bottom: '115px', noRepeat: true, isBike: true },
  { className: 'bike-2',  speed: '20s',  size: '120px',  zIndex: 2, image: 'bike', animation: 'parallax_bike', bottom: '115px', noRepeat: true, isBike: true },
  { className: 'layer-3', speed: '55s',  size: '200px', zIndex: 3, image: '3' },
  { className: 'layer-2', speed: '30s',  size: '180px', zIndex: 4, image: '2' },
  { className: 'layer-1', speed: '20s',  size: '160px', zIndex: 5, image: '1' },
];

const MountainVistaParallax = ({ title = '', subtitle = '' }) => {
  // Generate dynamic CSS for each layer
  const dynamicStyles = useMemo(() => {
    return layersData
      .map(layer => {
        const url = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;
        return `
          .${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation};` : ''}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ''}
            ${layer.noRepeat ? 'background-repeat: no-repeat;' : ''}
            /* Calibrated for Blue Monochrome Masterpiece - Image 1/3 match */
            filter: ${layer.zIndex > 3 ? 'brightness(0.7) saturate(1.2)' : 'brightness(1.1) saturate(1.1)'} drop-shadow(0 0 5px rgba(0, 100, 255, 0.1));
            ${layer.isBike ? 'height: ' + layer.size + ';' : ''}
          }
        `;
      })
      .join('\n');
  }, []);

  return (
    <section
      className="hero-container pointer-events-none select-none"
      aria-label="An animated parallax landscape of mountains and cyclists."
    >
      <style>{`
        .hero-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(180deg, #0a1628 0%, #0d2a4a 25%, #0a3560 50%, #002244 75%, #001122 100%);
          z-index: 0;
          pointer-events: none;
          user-select: none;
        }

        .parallax-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 100%;
          animation-name: parallax_fg;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          will-change: background-position;
        }

        /* Gold highlight for bikes and fix for bottom positioning */
        .bike-1, .bike-2 {
          top: auto !important; /* Allow bottom to work */
          filter: saturate(2) brightness(2) drop-shadow(0 0 15px rgba(212, 175, 55, 0.6)) !important;
        }
        
        ${dynamicStyles}
      `}</style>

      {/* Render each parallax layer */}
      {layersData.map(layer => (
        <div
          key={layer.className}
          className={`parallax-layer ${layer.className}`}
        />
      ))}

      {/* Dark scrim — keeps UI content readable over the bright sky */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,5,15,0.75) 0%, rgba(0,10,25,0.55) 40%, rgba(0,15,35,0.35) 70%, transparent 100%)',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      />

      {/* Hero text */}
      {(title || subtitle) && (
        <div className="hero-content relative z-[10] flex flex-col items-center justify-center h-full text-center">
          <h1 className="hero-title text-4xl font-bold text-[#D4AF37] mb-4">{title}</h1>
          <p className="hero-subtitle text-xl text-white/70">{subtitle}</p>
        </div>
      )}
    </section>
  );
};

export default React.memo(MountainVistaParallax);
