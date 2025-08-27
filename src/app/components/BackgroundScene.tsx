import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@lib/theme';

// Generador de estrellas (solo se usa en modo oscuro)
function generateStars(count: number) {
  const stars: {
    id: number;
    left: string;
    top: string;
    size: number;
    delay: string;
    duration: string;
  }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 6}s`,
      duration: `${4 + Math.random() * 6}s`,
    });
  }
  return stars;
}

const starsCache = generateStars(90);

export const BackgroundScene: React.FC = () => {
  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking.current = false;
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const layerTranslate = (factor: number) => ({ transform: `translateY(${scrollY * factor}px)` });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
      style={{ mixBlendMode: theme === 'dark' ? 'normal' : undefined }}
    >
      {theme === 'light' && (
        <div className="absolute inset-0" style={layerTranslate(0)}>
          {/* Gradientes suaves para dar profundidad (sin nubes) */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-sky-100/40 to-transparent" />
        </div>
      )}
      {theme === 'dark' && (
        <>
          {/* Luna llena (misma profundidad visual que estrellas) */}
          <div className="absolute inset-0" style={layerTranslate(0.05)}>
            <div
              aria-hidden="true"
              className="absolute"
              style={{
                top: '4rem',
                right: '6rem',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 30% 35%, #ffffff 0%, #f2f6fa 30%, #e2e8f0 55%, #cbd5e1 75%)',
                boxShadow:
                  '0 0 0 2px rgba(255,255,255,0.3), 0 0 25px 8px rgba(255,255,255,0.35), 0 0 80px 40px rgba(160,190,255,0.12)',
                filter: 'brightness(1.05) contrast(1.05)',
                overflow: 'hidden',
              }}
            >
              {/* Cráteres */}
              {[
                { w: 40, h: 40, top: 28, left: 46, op: 0.28 },
                { w: 26, h: 26, top: 74, left: 82, op: 0.22 },
                { w: 22, h: 22, top: 96, left: 38, op: 0.18 },
                { w: 30, h: 30, top: 48, left: 18, op: 0.24 },
                { w: 18, h: 18, top: 64, left: 60, op: 0.2 },
                { w: 14, h: 14, top: 110, left: 72, op: 0.17 },
              ].map((c, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    top: c.top,
                    left: c.left,
                    width: c.w,
                    height: c.h,
                    background:
                      'radial-gradient(circle at 35% 35%, rgba(203,213,225,0.75) 0%, rgba(148,163,184,0.35) 55%, rgba(255,255,255,0) 70%)',
                    mixBlendMode: 'multiply',
                    opacity: c.op,
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
              {/* Textura granular suave */}
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  background:
                    'repeating-radial-gradient(circle at 60% 40%, rgba(255,255,255,0.4) 0 2px, rgba(226,232,240,0.35) 2px 4px, rgba(203,213,225,0.25) 4px 6px, transparent 6px 8px)',
                  mixBlendMode: 'overlay',
                }}
              />
              {/* Halo exterior adicional */}
              <div
                className="absolute -inset-8 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(200,220,255,0.12) 45%, rgba(200,220,255,0.05) 65%, transparent 80%)',
                  filter: 'blur(2px)',
                }}
              />
            </div>
          </div>
          <div className="absolute inset-0" style={layerTranslate(0.05)}>
            {starsCache.map((s) => (
              <span
                key={s.id}
                className="absolute rounded-full"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0) 70%)',
                  animation: `twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
                  filter:
                    'drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 8px rgba(255,255,255,0.35))',
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0" style={layerTranslate(0.12)}>
            <div className="absolute w-[55rem] h-[55rem] -top-72 left-1/2 -translate-x-1/2 bg-brand-400/5 blur-[140px] rounded-full" />
            <div className="absolute w-[35rem] h-[35rem] top-1/3 -left-40 bg-indigo-400/5 blur-[110px] rounded-full" />
          </div>
        </>
      )}
    </div>
  );
};

// Nubes eliminadas deliberadamente para un fondo limpio.
