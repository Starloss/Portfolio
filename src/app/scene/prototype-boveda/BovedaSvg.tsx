// PROTOTIPO desechable: la Bóveda celeste en la Escena SVG. Aquí escribe el DOM con rAF para compartir
// la simulación con WebGL; en producción, la versión SVG sería CSS.
import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { DAY, NIGHT } from '../palette';

import { BovedaSim, durationOf, PIVOT, type BovedaParams } from './sim';

const STARS = Array.from({ length: 420 }, (_, i) => {
    const a = (i * 2.399963) % (Math.PI * 2);
    const r = 60 + Math.sqrt(i / 420) * 1900;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: i % 7 ? 0.9 : 1.6 };
});

function moonPath(phase: number) {
    const waxing = phase <= 0.5;
    const k = waxing ? phase : 1 - phase;
    const rx = Math.abs(Math.cos(2 * Math.PI * k));
    const sweep = k < 0.25 ? 0 : 1;
    return {
        d: `M0 -1 A1 1 0 0 1 0 1 A${rx.toFixed(3)} 1 0 0 ${sweep} 0 -1Z`,
        flip: waxing ? 1 : -1,
    };
}

export const BovedaSvg: React.FC<{ night: boolean; params: BovedaParams }> = ({
    night,
    params,
}) => {
    const box = useRef<HTMLDivElement>(null);
    const sun = useRef<HTMLDivElement>(null);
    const moon = useRef<SVGSVGElement>(null);
    const stars = useRef<HTMLDivElement>(null);
    const dusk = useRef<HTMLDivElement>(null);
    const sweep = useRef<HTMLDivElement>(null);
    const sim = useRef<BovedaSim | null>(null);
    const live = useRef(params);
    useLayoutEffect(() => {
        live.current = params;
    });

    useLayoutEffect(() => {
        if (!sim.current) {
            sim.current = new BovedaSim();
            sim.current.set(night);
        } else {
            sim.current.change(night, performance.now(), live.current);
        }
    }, [night]);

    useEffect(() => {
        let raf = 0;
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            const root = box.current?.parentElement;
            if (!root || !sim.current) return;
            const f = sim.current.tick(now, live.current);
            const { clientWidth: w, clientHeight: h } = root;
            const nightSky = root.querySelector<HTMLElement>('.scene-sky-night');
            if (nightSky) {
                nightSky.style.transition = 'none';
                nightSky.style.opacity = String(f.night);
            }
            sun.current!.style.transform = `translate(${f.sun.x * w - 60}px, ${f.sun.y * h - 60}px)`;
            sun.current!.style.opacity = String(f.sun.alpha);
            moon.current!.style.transform = `translate(${f.moon.x * w - 26}px, ${f.moon.y * h - 26}px)`;
            moon.current!.style.opacity = String(f.moon.alpha);
            stars.current!.style.transform = `translate(${PIVOT.x * w}px, ${PIVOT.y * h}px) rotate(${f.stars.angle}rad)`;
            stars.current!.style.opacity = String(f.stars.alpha);
            dusk.current!.style.opacity = String(f.skyDusk * 0.85);
            const on = f.sweep >= 0;
            sweep.current!.style.opacity = on
                ? String(Math.min(1, Math.sin(f.sweep % Math.PI) * 3))
                : '0';
            if (on) {
                sweep.current!.style.transform = `translate(${PIVOT.x * w}px, ${PIVOT.y * h}px) translate(-50%, -50%) rotate(${-f.sweep}rad)`;
            }
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    const { d, flip } = moonPath(params.phase);
    return (
        <div ref={box} data-part="prototipo-boveda" className="scene-layer">
            {/* El paisaje cambia de color al ritmo del giro. */}
            <style>{`.scene * { transition-duration: ${durationOf(params)}s !important; }`}</style>
            <div
                ref={dusk}
                className="scene-layer"
                style={{
                    background: 'linear-gradient(to bottom, #2b3369, #ff945c 85%)',
                    opacity: 0,
                    transition: 'none',
                }}
            />
            <div
                ref={sweep}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '600vmax',
                    height: '600vmax',
                    opacity: 0,
                    transition: 'none',
                    background: `linear-gradient(to bottom, ${DAY.skyBottom} 47%, #ffcf9a 48.6%, #f28a5a 50%, #4a2f66 51.2%, ${NIGHT.skyTop} 53%)`,
                }}
            />
            <div ref={stars} style={{ position: 'absolute', top: 0, left: 0, transition: 'none' }}>
                <svg
                    width="4"
                    height="4"
                    style={{ overflow: 'visible', display: 'block' }}
                    aria-hidden="true"
                >
                    {STARS.map((s) => (
                        <circle key={`${s.x}|${s.y}`} cx={s.x} cy={s.y} r={s.s} fill="#fff" />
                    ))}
                </svg>
            </div>
            <div
                ref={sun}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    transition: 'none',
                    background:
                        'radial-gradient(closest-side, #fff8e0 0 26%, rgba(255,225,150,.55) 30%, rgba(255,205,120,.16) 60%, transparent)',
                }}
            />
            <svg
                ref={moon}
                viewBox="-1.1 -1.1 2.2 2.2"
                width="52"
                height="52"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 'auto',
                    bottom: 'auto',
                    width: 52,
                    height: 52,
                    overflow: 'visible',
                    transition: 'none',
                }}
                aria-hidden="true"
            >
                <g transform={`rotate(-35) scale(${flip} 1)`}>
                    <circle r="1" fill="#fff" opacity="0.07" />
                    <path
                        d={d}
                        fill="#f4eccb"
                        style={{ filter: 'drop-shadow(0 0 .22px rgba(255,241,196,.7))' }}
                    />
                </g>
            </svg>
        </div>
    );
};
