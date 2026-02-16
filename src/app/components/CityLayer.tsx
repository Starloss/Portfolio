import React from 'react';

interface CityLayerProps {
    theme: 'light' | 'dark';
    cityProgress: number;
}

interface WindowSpec {
    id: string;
    top: number;
    left: number;
    dynamic: boolean;
    duration: number;
    delay: number;
    lit: boolean;
}

interface BuildingSpec {
    id: number;
    xPct: number;
    width: number;
    height: number;
    windows: WindowSpec[];
}

function createRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function createBuildings(total: number): BuildingSpec[] {
    const rng = createRng(20240827);
    const basePositions = Array.from({ length: total }, (_, i) => (i / (total - 1)) * 100);

    const buildings = basePositions.map((baseX, i) => {
        const jitter = (rng() - 0.5) * (100 / total) * 0.6;
        const xPct = Math.min(100, Math.max(0, baseX + jitter));
        const width = 50 + Math.round(rng() * 55);
        const height = 110 + Math.round(rng() * 105);

        const size = 4;
        const gapX = 6;
        const gapY = 7;
        const paddingX = 6;
        const paddingTop = 8;
        const usableWidth = width - paddingX * 2;
        const cols = Math.max(1, Math.floor((usableWidth + gapX) / (size + gapX)));
        const totalWidthUsed = cols * size + (cols - 1) * gapX;
        const offsetX = paddingX + Math.floor((usableWidth - totalWidthUsed) / 2);

        const windows: WindowSpec[] = [];
        let wi = 0;
        for (let y = 0; ; y++) {
            const top = paddingTop + y * (size + gapY);
            if (top + size > height - 10) break;
            for (let x = 0; x < cols; x++) {
                const left = offsetX + x * (size + gapX);
                const seed = (i * 997 + wi * 37) % 211;
                const lit = seed % 5 !== 0;
                const dynamic = seed % 17 === 0;
                const duration = 9 + (seed % 12);
                const delay = -(seed % 8);
                windows.push({
                    id: `${i}-${wi}`,
                    top,
                    left,
                    dynamic,
                    duration,
                    delay,
                    lit,
                });
                wi += 1;
            }
        }

        return { id: i, xPct, width, height, windows };
    });

    return buildings.sort((a, b) => a.xPct - b.xPct);
}

const BUILDINGS = createBuildings(22);

export const CityLayer: React.FC<CityLayerProps> = ({ theme, cityProgress }) => {
    return (
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
                    style={{ opacity: theme === 'dark' ? 0.82 : 0.9 }}
                >
                    <path
                        d="M0 320 L150 300 L260 310 L360 280 L480 305 L600 250 L760 270 L900 240 L1080 265 L1220 250 L1360 260 L1520 240 L1700 255 L2000 245 L2000 400 L0 400 Z"
                        fill="url(#mountainGradient)"
                    />
                    <defs>
                        <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
                            {theme === 'dark' ? (
                                <>
                                    <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.55" />
                                    <stop offset="55%" stopColor="#0f2235" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#091726" stopOpacity="0.97" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#6fa4c8" stopOpacity="0.55" />
                                    <stop offset="55%" stopColor="#4f7ea5" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#315670" stopOpacity="0.9" />
                                </>
                            )}
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div
                className="absolute inset-x-0 bottom-0"
                style={{
                    height: '26vh',
                    filter: theme === 'dark' ? 'drop-shadow(0 -2px 4px rgba(0,0,0,0.35))' : 'none',
                }}
            >
                <div className="relative w-full h-full opacity-95">
                    {BUILDINGS.map((building) => (
                        <div
                            key={building.id}
                            className="absolute overflow-hidden"
                            style={{
                                left: `${building.xPct}%`,
                                transform: 'translateX(-50%)',
                                bottom: 0,
                                width: building.width,
                                height: building.height,
                                background:
                                    theme === 'dark'
                                        ? 'linear-gradient(to top,#060e17,#0c1a28 55%, #153248)'
                                        : 'linear-gradient(to top,#27465b,#356281 55%, #4d89a8)',
                                border:
                                    theme === 'dark'
                                        ? '1px solid rgba(255,255,255,0.025)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                boxShadow:
                                    theme === 'dark'
                                        ? 'inset 0 0 10px -4px rgba(255,255,255,0.05)'
                                        : 'inset 0 0 8px -3px rgba(255,255,255,0.12)',
                            }}
                        >
                            {building.windows.map((windowLight) => {
                                if (!windowLight.lit) return null;

                                return (
                                    <span
                                        key={windowLight.id}
                                        className={
                                            windowLight.dynamic
                                                ? 'absolute rounded-sm animate-light-random'
                                                : 'absolute rounded-sm'
                                        }
                                        style={{
                                            top: windowLight.top,
                                            left: windowLight.left,
                                            width: 4,
                                            height: 5,
                                            animationDuration: `${windowLight.duration}s`,
                                            animationDelay: `${windowLight.delay}s`,
                                            background:
                                                theme === 'dark'
                                                    ? 'linear-gradient(to bottom, hsl(45 100% 86%), hsl(42 100% 68%))'
                                                    : 'linear-gradient(to bottom, hsl(46 35% 92%), hsl(44 25% 82%))',
                                            filter:
                                                theme === 'dark'
                                                    ? 'drop-shadow(0 0 1.5px hsl(45 100% 75% / 0.45))'
                                                    : 'none',
                                            opacity: theme === 'dark' ? 0.92 : 0.58,
                                            mixBlendMode: theme === 'dark' ? 'screen' : 'normal',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}

                    <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none">
                        <div
                            className={
                                theme === 'dark'
                                    ? 'absolute inset-0 bg-gradient-to-t from-[#050d16] via-[#050d16]/90 to-transparent'
                                    : 'absolute inset-0 bg-gradient-to-t from-sky-900/40 via-sky-800/10 to-transparent'
                            }
                        />
                        <div
                            className="absolute inset-x-[15%] bottom-0 h-2/3 opacity-[0.25]"
                            style={{
                                background:
                                    theme === 'dark'
                                        ? 'radial-gradient(circle at 50% 85%, rgba(90,130,200,0.18) 0%, rgba(40,70,110,0.08) 40%, rgba(10,25,40,0) 70%)'
                                        : 'radial-gradient(circle at 50% 85%, rgba(120,170,220,0.25) 0%, rgba(100,150,200,0.10) 45%, rgba(80,120,170,0) 70%)',
                                mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
