// src/components/ParticlesBackground.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import type { ISourceOptions } from '@tsparticles/engine';

export default function ParticlesBackground() {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setEngineReady(true);
    });
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: 'transparent' },
      fpsLimit: 60,
      particles: {
        number: { value: 50, density: { enable: true } },
        color: { value: '#000000' },
        shape: { type: 'circle' },
        opacity: { value: 0.2 },
        size: { value: { min: 1, max: 3 } },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          outModes: { default: 'bounce' },
        },
        links: {
          enable: true,
          distance: 150,
          color: '#000000',
          opacity: 0.1,
          width: 1,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
          onClick: { enable: true, mode: 'push' },
        },
        modes: {
          grab: { distance: 200, links: { opacity: 0.2 } },
          push: { quantity: 4 },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!engineReady) {
    return null;
  }

  return (
    <Particles
      id="tsparticles-bg"
      options={options}
      className="absolute inset-0 -z-10"
    />
  );
}
