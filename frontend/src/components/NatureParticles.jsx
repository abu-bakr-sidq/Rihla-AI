import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function NatureParticles() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      className="fixed inset-0 z-[0] pointer-events-none"
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          color: {
            value: ["#F59E0B", "#FFFFFF", "#10B981", "#34D399"], // Gold, White, Emerald
          },
          move: {
            direction: "bottom",
            enable: true,
            outModes: { default: "out" },
            random: true,
            speed: { min: 1, max: 2 },
            straight: false,
          },
          number: {
            density: { enable: true, area: 800 },
            value: 40,
          },
          opacity: {
            value: { min: 0.1, max: 0.4 },
            animation: {
              enable: true,
              speed: 0.5,
              sync: false,
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 2, max: 5 },
          },
          tilt: {
            direction: "random",
            enable: true,
            move: true,
            value: { min: 0, max: 360 },
          },
          wobble: {
            distance: 10,
            enable: true,
            speed: { min: -5, max: 5 },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
