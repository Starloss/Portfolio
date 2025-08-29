import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@lib/theme';

// Estrellas cacheadas
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

// ---- Nubes ----
interface Cloud {
    id: number;
    top: number;
    scale: number;
    duration: number;
    delay: number;
    opacity: number;
    drift: number;
    bob: number;
    bobDur: number;
    bobDelay: number;
}

function buildCloudCache(cfg: {
    count: number;
    seed: number;
    topMin: number;
    topRange: number;
    scaleMin: number;
    scaleRange: number;
    durationMin: number;
    durationRange: number;
    opacityMin: number;
    opacityRange: number;
    driftRange: number;
}): Cloud[] {
    const {
        count,
        seed,
        topMin,
        topRange,
        scaleMin,
        scaleRange,
        durationMin,
        durationRange,
        opacityMin,
        opacityRange,
        driftRange,
    } = cfg;
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    const rng = () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
    return Array.from({ length: count }, (_, i) => {
        const top = topMin + rng() * topRange;
        const scale = scaleMin + rng() * scaleRange;
        const duration = durationMin + rng() * durationRange;
        const delay = -rng() * duration;
        const opacity = opacityMin + rng() * opacityRange;
        const drift = (rng() - 0.5) * driftRange;
        const bob = 4 + rng() * 12;
        const bobDur = 6 + rng() * 10;
        const bobDelay = -rng() * bobDur;
        return { id: i, top, scale, duration, delay, opacity, drift, bob, bobDur, bobDelay };
    });
}

// Ajuste: más nubes pero un poco menos opacas para no saturar.
const cloudCacheFar = buildCloudCache({
    count: 8,
    seed: 2024082901,
    topMin: 6,
    topRange: 30,
    scaleMin: 0.34, // aumenta tamaño base
    scaleRange: 0.54, // permite algo más grande
    durationMin: 140,
    durationRange: 120,
    opacityMin: 0.08, // más opacas
    opacityRange: 0.1,
    driftRange: 4,
});
const cloudCacheNear = buildCloudCache({
    count: 11,
    seed: 2024082902,
    topMin: 12,
    topRange: 36,
    scaleMin: 0.55, // ligeramente más grande
    scaleRange: 0.85,
    durationMin: 78,
    durationRange: 70,
    opacityMin: 0.14,
    opacityRange: 0.2,
    driftRange: 9,
});

const CloudLayer: React.FC<{
    scrollFactor: number;
    scrollY: number;
    variant: 'near' | 'far';
}> = ({ scrollFactor, scrollY, variant }) => {
    const clouds = variant === 'far' ? cloudCacheFar : cloudCacheNear;
    return (
        <div
            className="absolute inset-0"
            style={{ pointerEvents: 'none', transform: `translateY(${scrollY * scrollFactor}px)` }}
        >
            <style>{`@keyframes cloud-horizontal {0% {transform: translateX(-35vw) translateY(var(--drift)) scale(var(--scale));}100% {transform: translateX(135vw) translateY(var(--drift)) scale(var(--scale));}}`}</style>
            <style>{`@keyframes cloud-bob {0%,100% {transform: translateY(calc(var(--bobOffset) * -1));}50% {transform: translateY(var(--bobOffset));}}`}</style>
            {clouds.map((c) => (
                <div
                    key={c.id}
                    className="absolute will-change-transform"
                    style={(() => {
                        const style: React.CSSProperties & Record<string, string | number> = {
                            top: `${c.top}%`,
                            left: '-30vw',
                            width: `${variant === 'far' ? 14 + c.scale * 8 : 19 + c.scale * 10}vw`,
                            height: `${variant === 'far' ? 4.8 + c.scale * 3 : 6.5 + c.scale * 4}vw`,
                            minWidth: variant === 'far' ? 260 : 320,
                            minHeight: variant === 'far' ? 110 : 140,
                            opacity: c.opacity * (variant === 'far' ? 0.8 : 1.15), // near más densas
                            animation: `cloud-horizontal ${c.duration}s linear ${c.delay}s infinite`,
                            filter:
                                variant === 'far'
                                    ? 'blur(0.5px) drop-shadow(0 0 4px rgba(200,215,235,0.04))'
                                    : 'blur(0.4px) drop-shadow(0 0 6px rgba(200,215,235,0.07))',
                            overflow: 'visible',
                        };
                        style['--scale'] = c.scale;
                        style['--drift'] = `${c.drift}px`;
                        style['--bobOffset'] = `${c.bob}px`;
                        return style;
                    })()}
                >
                    <div
                        className="relative w-full h-full"
                        style={{
                            animation: `cloud-bob ${c.bobDur}s ease-in-out ${c.bobDelay}s infinite`,
                        }}
                    >
                        {(() => {
                            const puffs: React.ReactElement[] = [];
                            const rand = (seed: number) => {
                                const v = Math.sin(seed * 12345.678 + c.id * 77) * 10000;
                                return ((v % 1) + 1) % 1;
                            };
                            const puffCount = variant === 'far' ? 6 : 9;
                            for (let i = 0; i < puffCount; i++) {
                                const r1 = rand(i + 1);
                                const r2 = rand(i + 11);
                                const r3 = rand(i + 31);
                                const widthPct = 13 + r1 * (variant === 'far' ? 20 : 26);
                                const aspect = 0.5 + r2 * 0.95;
                                const heightPct = widthPct * aspect;
                                const leftPct = 4 + r2 * 72;
                                const verticalBand = r3 * 38;
                                const topPct = 18 + verticalBand - aspect * 10;
                                const blur = 1 + r1 * (variant === 'far' ? 2.2 : 3.5);
                                const radA = 45 + r1 * 25;
                                const radB = 40 + r2 * 30;
                                const radC = 50 + r3 * 20;
                                const radD = 42 + r2 * 26;
                                const opacityLayer =
                                    (0.42 + r2 * 0.24) * (variant === 'far' ? 0.72 : 0.9);
                                const baseBg =
                                    'radial-gradient(circle at 42% 46%, rgba(255,255,255,0.55) 0%, rgba(225,235,250,0.46) 48%, rgba(160,190,225,0.20) 68%, rgba(120,150,190,0.05) 80%, rgba(120,150,190,0) 95%)';
                                const nearOverlay =
                                    'radial-gradient(circle at 55% 60%, rgba(110,130,170,0.15) 0%, rgba(110,130,170,0.08) 35%, rgba(110,130,170,0) 70%)';
                                puffs.push(
                                    <span
                                        key={i}
                                        className="absolute"
                                        style={{
                                            left: `${leftPct}%`,
                                            top: `${topPct}%`,
                                            width: `${widthPct}%`,
                                            height: `${heightPct}%`,
                                            background:
                                                variant === 'near'
                                                    ? `${nearOverlay}, ${baseBg}`
                                                    : baseBg,
                                            borderRadius: `${radA}% ${radB}% ${radC}% ${radD}% / ${radB}% ${radC}% ${radD}% ${radA}%`,
                                            filter: `blur(${blur}px)`,
                                            opacity: opacityLayer,
                                            transform: `translateY(-${verticalBand * 0.12}%)`,
                                        }}
                                    />,
                                );
                            }
                            return puffs;
                        })()}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const BackgroundScene: React.FC = () => {
    const { theme } = useTheme();
    const [scrollY, setScrollY] = useState(0);
    const [cityProgress, setCityProgress] = useState(0);
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
                const revealRange = 800;
                setCityProgress(clamp(1 - remaining / revealRange));
                ticking.current = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
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
                    {/* Nubes lejanas detrás de la luna */}
                    <CloudLayer variant="far" scrollFactor={0.04} scrollY={scrollY} />

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
                                    '0 0 0 2px rgba(255,255,255,0.3), 0 0 25px 8px rgba(255,255,255,0.35), 0 0 65px 32px rgba(160,190,255,0.10)',
                                filter: 'brightness(1.0) contrast(1.02)',
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
                                            'radial-gradient(circle at 35% 35%, rgba(203,213,225,0.72) 0%, rgba(148,163,184,0.33) 55%, rgba(255,255,255,0) 70%)',
                                        mixBlendMode: 'multiply',
                                        opacity: c.op,
                                        filter: 'blur(0.5px)',
                                    }}
                                />
                            ))}
                            <div
                                className="absolute inset-0 opacity-[0.13]"
                                style={{
                                    background:
                                        'repeating-radial-gradient(circle at 60% 40%, rgba(255,255,255,0.38) 0 2px, rgba(226,232,240,0.33) 2px 4px, rgba(203,213,225,0.24) 4px 6px, transparent 6px 8px)',
                                    mixBlendMode: 'overlay',
                                }}
                            />
                            <div
                                className="absolute -inset-8 rounded-full pointer-events-none"
                                style={{
                                    background:
                                        'radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(200,220,255,0.11) 45%, rgba(200,220,255,0.045) 65%, transparent 78%)',
                                    filter: 'blur(2px)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Nubes cercanas que pueden ocultar la luna */}
                    <CloudLayer variant="near" scrollFactor={0.09} scrollY={scrollY} />

                    {/* Montañas + Ciudad */}
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
                            style={{ height: '68vh', mixBlendMode: 'normal' }}
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
                                        const w = 50 + Math.round(rng() * 55);
                                        const h = 110 + Math.round(rng() * 105);
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
                                                        if (seed % 5 === 0) continue; // ventana apagada
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
                                {/* Gradiente base suelo */}
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
