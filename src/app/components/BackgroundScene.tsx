import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@lib/theme';

// Genera y cachea estrellas
function generateStars(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: `${Math.random() * 6}s`,
        duration: `${4 + Math.random() * 6}s`,
    }));
}
const starsCache = generateStars(90);

export const BackgroundScene: React.FC = () => {
    const { theme } = useTheme();
    const [scrollY, setScrollY] = useState(0);
    const [cityProgress, setCityProgress] = useState(0); // 0 a 1
    const ticking = useRef(false);

    useEffect(() => {
        const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const sy = window.scrollY;
                setScrollY(sy);
                const doc = document.documentElement;
                const maxScroll = doc.scrollHeight - window.innerHeight;
                const remaining = maxScroll - sy;
                const revealRange = 800; // px antes del final donde empieza a aparecer
                setCityProgress(clamp(1 - remaining / revealRange));
                ticking.current = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // inicializar
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const layerTranslate = (f: number) => ({ transform: `translateY(${scrollY * f}px)` });

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
            style={{ mixBlendMode: theme === 'dark' ? 'normal' : undefined }}
        >
            {theme === 'light' && (
                <div className="absolute inset-0" style={layerTranslate(0)}>
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-sky-100/40 to-transparent" />
                </div>
            )}
            {theme === 'dark' && (
                <>
                    {/* Estrellas */}
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
                                    filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 8px rgba(255,255,255,0.35))',
                                    opacity: 0.9,
                                }}
                            />
                        ))}
                    </div>
                    {/* Glow ambiental */}
                    <div className="absolute inset-0" style={layerTranslate(0.12)}>
                        <div className="absolute w-[55rem] h-[55rem] -top-72 left-1/2 -translate-x-1/2 bg-brand-400/5 blur-[140px] rounded-full" />
                        <div className="absolute w-[35rem] h-[35rem] top-1/3 -left-40 bg-indigo-400/5 blur-[110px] rounded-full" />
                    </div>
                    {/* Luna */}
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
                            <div
                                className="absolute inset-0 opacity-[0.15]"
                                style={{
                                    background:
                                        'repeating-radial-gradient(circle at 60% 40%, rgba(255,255,255,0.4) 0 2px, rgba(226,232,240,0.35) 2px 4px, rgba(203,213,225,0.25) 4px 6px, transparent 6px 8px)',
                                    mixBlendMode: 'overlay',
                                }}
                            />
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

                    <div
                        className="absolute inset-x-0 bottom-0"
                        style={{
                            opacity: cityProgress,
                            transform: `translateY(${(1 - cityProgress) * 60}px)`,
                            transition: 'opacity 0.12s linear, transform 0.12s linear',
                        }}
                    >
                        <div
                            className="absolute inset-x-0 bottom-0"
                            style={{
                                height: '68vh',
                                mixBlendMode: 'normal',
                            }}
                        >
                            <svg
                                aria-hidden="true"
                                width="100%"
                                height="100%"
                                preserveAspectRatio="none"
                                viewBox="0 0 2000 400"
                                className="absolute inset-0"
                                style={{ opacity: 0.82 }}
                            >
                                <path
                                    d="M0 320 L150 300 L260 310 L360 280 L480 305 L600 250 L760 270 L900 240 L1080 265 L1220 250 L1360 260 L1520 240 L1700 255 L2000 245 L2000 400 L0 400 Z"
                                    fill="url(#mountainGradient)"
                                />
                                <defs>
                                    <linearGradient
                                        id="mountainGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.55" />
                                        <stop offset="55%" stopColor="#0f2235" stopOpacity="0.85" />
                                        <stop
                                            offset="100%"
                                            stopColor="#091726"
                                            stopOpacity="0.97"
                                        />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        {/* Edificios */}
                        <div
                            className="absolute inset-x-0 bottom-0"
                            style={{
                                height: '26vh',
                                filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.55))',
                            }}
                        >
                            <div className="relative w-full h-full opacity-95">
                                {(() => {
                                    // Distribución pseudo-aleatoria estable (seeded)
                                    const total = 22;
                                    const seedRandom = (seed: number) => {
                                        let s = seed % 2147483647;
                                        if (s <= 0) s += 2147483646;
                                        return () => {
                                            s = (s * 16807) % 2147483647;
                                            return (s - 1) / 2147483646;
                                        };
                                    };
                                    const rng = seedRandom(20240827);
                                    const basePositions = Array.from(
                                        { length: total },
                                        (_, i) => (i / (total - 1)) * 100,
                                    );
                                    const buildings = basePositions.map((baseX, i) => {
                                        const jitter = (rng() - 0.5) * (100 / total) * 0.6;
                                        const xPct = Math.min(100, Math.max(0, baseX + jitter));
                                        const w = 50 + Math.round(rng() * 55); // 50 - 105
                                        const h = 110 + Math.round(rng() * 105); // 110 - 215
                                        return { w, h, xPct, i };
                                    });
                                    buildings.sort((a, b) => a.xPct - b.xPct);
                                    return buildings.map((b) => (
                                        <div
                                            key={b.i}
                                            className="absolute overflow-hidden"
                                            style={{
                                                left: `${b.xPct}%`,
                                                transform: 'translateX(-50%)',
                                                bottom: 0,
                                                width: b.w,
                                                height: b.h,
                                                background:
                                                    'linear-gradient(to top,#060e17,#0c1a28 55%, #153248)',
                                                border: '1px solid rgba(255,255,255,0.025)',
                                                boxShadow:
                                                    'inset 0 0 10px -4px rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            {(() => {
                                                const size = 4;
                                                const gapX = 6;
                                                const gapY = 7;
                                                const paddingX = 6;
                                                const paddingTop = 8;
                                                const usableWidth = b.w - paddingX * 2;
                                                const cols = Math.max(
                                                    1,
                                                    Math.floor(
                                                        (usableWidth + gapX) / (size + gapX),
                                                    ),
                                                );
                                                const totalWidthUsed =
                                                    cols * size + (cols - 1) * gapX;
                                                const offsetX =
                                                    paddingX +
                                                    Math.floor((usableWidth - totalWidthUsed) / 2);
                                                const windows: React.ReactElement[] = [];
                                                let wi = 0;
                                                for (let y = 0; ; y++) {
                                                    const top = paddingTop + y * (size + gapY);
                                                    if (top + size > b.h - 10) break;
                                                    for (let x = 0; x < cols; x++) {
                                                        const left = offsetX + x * (size + gapX);
                                                        const seed = (b.i * 997 + wi * 37) % 211;
                                                        wi++;
                                                        if (seed % 5 === 0) continue;
                                                        const flicker = seed % 11 === 0;
                                                        windows.push(
                                                            <span
                                                                key={wi}
                                                                className={
                                                                    flicker
                                                                        ? 'absolute rounded-sm animate-light-flicker'
                                                                        : 'absolute rounded-sm'
                                                                }
                                                                style={{
                                                                    top,
                                                                    left,
                                                                    width: size,
                                                                    height: size + 1,
                                                                    background:
                                                                        'linear-gradient(to bottom, hsl(45 100% 86%), hsl(42 100% 68%))',
                                                                    filter: 'drop-shadow(0 0 2px hsl(45 100% 75% / 0.5))',
                                                                    opacity: 0.9,
                                                                    mixBlendMode: 'screen',
                                                                }}
                                                            />,
                                                        );
                                                    }
                                                }
                                                return windows;
                                            })()}
                                        </div>
                                    ));
                                })()}
                                {/* Gradiente base suelo + leve luz central para evitar sombra oscura */}
                                <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050d16] via-[#050d16]/90 to-transparent" />
                                    <div
                                        className="absolute inset-x-[15%] bottom-0 h-2/3 opacity-[0.25]"
                                        style={{
                                            background:
                                                'radial-gradient(circle at 50% 85%, rgba(90,130,200,0.18) 0%, rgba(40,70,110,0.08) 40%, rgba(10,25,40,0) 70%)',
                                            mixBlendMode: 'screen',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Nubes eliminadas deliberadamente para un fondo limpio.
