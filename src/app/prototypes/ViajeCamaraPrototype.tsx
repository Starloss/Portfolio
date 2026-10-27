// PROTOTIPO DESECHABLE: no es código de producción, no tiene tests.
// Responde al ticket "Coreografía del Viaje de cámara por sección".
// Abrir con `pnpm prototype:viaje`; ?v=a|b|c, ?modo=dia|noche, ?movil=1, ?rm=1 (simula prefers-reduced-motion).
// Cada capa es un div HTML que sólo mueve transform/opacity (restricción de la research de motion).
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type Modo = 'dia' | 'noche';

interface Encuadre {
    // Desplazamiento y escala del "mundo" (todas las capas del paisaje), en % de viewport.
    x: number;
    y: number;
    k: number;
    // Altura de la cámara: 0 = ciudad, 1 = sobre las nubes. Mueve las capas con parallax.
    alt: number;
}

interface Variante {
    id: 'a' | 'b' | 'c';
    nombre: string;
    idea: string;
    encuadres: Encuadre[]; // uno por sección
}

const SECCIONES = ['Hero', 'Impacto', 'Experiencia', 'Proyectos destacados', 'Skills', 'Contacto'];

const VARIANTES: Variante[] = [
    {
        id: 'a',
        nombre: 'A · Subida en Teleférico',
        idea: 'El scroll es un viaje en Teleférico: la cabina sube por el cable, la cámara asciende sobre las nubes en el medio de la página y baja de vuelta a la ciudad en Contacto.',
        encuadres: [
            { x: 0, y: 0, k: 1, alt: 0 },
            { x: 0, y: 0, k: 1, alt: 0.35 },
            { x: 0, y: 0, k: 1, alt: 0.7 },
            { x: 0, y: 0, k: 1, alt: 1 },
            { x: 0, y: 0, k: 1, alt: 0.6 },
            { x: 0, y: 0, k: 1, alt: 0 },
        ],
    },
    {
        id: 'b',
        nombre: 'B · Parallax sobrio',
        idea: 'Sin zoom: las capas se hunden a distinta velocidad mientras se lee y el cielo gana espacio; la ciudad sube de nuevo al final. Movimiento mínimo y constante.',
        encuadres: [
            { x: 0, y: 0, k: 1, alt: 0 },
            { x: 0, y: 0, k: 1, alt: 0.25 },
            { x: 0, y: 0, k: 1, alt: 0.45 },
            { x: 0, y: 0, k: 1, alt: 0.6 },
            { x: 0, y: 0, k: 1, alt: 0.6 },
            { x: 0, y: 0, k: 1, alt: 0 },
        ],
    },
    {
        id: 'c',
        nombre: 'C · Encuadres por sección',
        idea: 'Cinematográfico: cada sección tiene su plano. Experiencia hace zoom al Humboldt, Proyectos a Parque Central, Skills mira al cielo y Contacto vuelve al plano del Hero.',
        encuadres: [
            { x: 0, y: 0, k: 1, alt: 0 },
            { x: 0, y: 6, k: 1.1, alt: 0.15 },
            { x: 14, y: 22, k: 1.9, alt: 0 },
            { x: -12, y: -10, k: 1.7, alt: 0 },
            { x: 0, y: 0, k: 1, alt: 1 },
            { x: 0, y: 0, k: 1, alt: 0 },
        ],
    },
];

const AVILA =
    'M0 900 L0 520 L120 470 L240 420 L330 380 L420 360 L520 310 L620 300 L700 270 L790 220 L860 205 L930 230 L1010 270 L1100 250 L1150 235 L1230 300 L1320 380 L1420 410 L1520 420 L1600 430 L1600 900 Z';
const LEJANA =
    'M0 900 L0 470 L160 420 L300 380 L460 330 L600 290 L760 250 L880 240 L1000 260 L1160 230 L1300 280 L1460 330 L1600 350 L1600 900 Z';

const COLORES = {
    dia: {
        cielo: ['#6fb3e0', '#2a78b8'],
        horizonte: '#e8f4fb',
        lejana: '#a3c4d3',
        avila: ['#5f9c78', '#2f6b4f'],
        ciudad: '#566a7b',
        torres: '#4a5c6c',
        luz: '#d9e6ee',
        nube: 'rgba(255,255,255,0.9)',
        humboldt: '#e9eef2',
    },
    noche: {
        cielo: ['#060b1c', '#01030a'],
        horizonte: '#1b2c52',
        lejana: '#16253c',
        avila: ['#13263a', '#0a1622'],
        ciudad: '#0c1726',
        torres: '#0b1420',
        luz: '#ffcf6e',
        nube: 'rgba(160,180,215,0.35)',
        humboldt: '#fff2c9',
    },
};

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
const suave = (t: number) => t * t * (3 - 2 * t);

function hexMix(a: string, b: string, t: number) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(mezcla(v, pb[i], t))).join(',')})`;
}

// Encuadre interpolado según la posición de scroll (una sección = una altura de viewport).
function encuadreActual(v: Variante, scroll: number, vh: number) {
    const pos = Math.max(0, Math.min(SECCIONES.length - 1, scroll / vh));
    const i = Math.min(SECCIONES.length - 2, Math.floor(pos));
    const t = suave(pos - i);
    const a = v.encuadres[i];
    const b = v.encuadres[i + 1];
    return {
        seccion: Math.round(pos),
        x: mezcla(a.x, b.x, t),
        y: mezcla(a.y, b.y, t),
        k: mezcla(a.k, b.k, t),
        alt: mezcla(a.alt, b.alt, t),
        progreso: pos / (SECCIONES.length - 1),
    };
}

const capa: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    willChange: 'transform',
    pointerEvents: 'none',
};
const svgFull: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };

export const ViajeCamaraPrototype: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const v = VARIANTES.find((x) => x.id === params.get('v')) ?? VARIANTES[0];
    const modo: Modo = params.get('modo') === 'noche' ? 'noche' : 'dia';
    const movil = params.get('movil') === '1';
    const rm = params.get('rm') === '1';
    const c = COLORES[modo];

    const [scroll, setScroll] = useState(0);
    const [vh, setVh] = useState(() => window.innerHeight);
    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setScroll(window.scrollY));
        };
        const onResize = () => setVh(window.innerHeight);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        // ?ir=N salta a la sección N (útil para capturas)
        const ir = Number(new window.URLSearchParams(window.location.search).get('ir'));
        if (ir) {
            setScroll(ir * window.innerHeight);
            setTimeout(() => window.scrollTo(0, ir * window.innerHeight), 50);
        }
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    const set = (k: string, val: string) => {
        const next = new window.URLSearchParams(params);
        next.set(k, val);
        setParams(next, { replace: true });
    };

    const e = rm
        ? { ...v.encuadres[0], seccion: Math.round(scroll / vh), progreso: 0 }
        : encuadreActual(v, scroll, vh);
    // Parallax vertical por altura de cámara: las capas cercanas se hunden más.
    const hundir = (profundidad: number) =>
        `translate3d(0, ${(e.alt * profundidad * 100).toFixed(2)}vh, 0)`;
    const mundo = `translate3d(${e.x}vw, ${e.y}vh, 0) scale(${e.k})`;
    const cabina = rm ? 0 : v.id === 'a' ? e.alt : 0.35;
    const capas = movil
        ? ['cielo', 'Ávila', 'ciudad']
        : ['cielo', 'nubes', 'lejana', 'Ávila', 'ciudad', 'torres'];

    return (
        <div>
            {/* Cielo: color según altura */}
            <div
                style={{
                    ...capa,
                    background: `linear-gradient(${hexMix(c.cielo[0], c.cielo[1], e.alt)}, ${c.horizonte})`,
                }}
            />

            {/* Mundo: todas las capas del paisaje comparten el encuadre (zoom/paneo) */}
            <div style={{ ...capa, transform: mundo, transformOrigin: '50% 60%' }}>
                {!movil && (
                    <div style={{ ...capa, transform: hundir(0.35) }}>
                        <svg
                            viewBox="0 0 1600 900"
                            preserveAspectRatio="xMidYMax slice"
                            style={svgFull}
                        >
                            <path d={LEJANA} fill={c.lejana} />
                        </svg>
                    </div>
                )}
                <div style={{ ...capa, transform: hundir(0.55) }}>
                    <svg
                        viewBox="0 0 1600 900"
                        preserveAspectRatio="xMidYMax slice"
                        style={svgFull}
                    >
                        <defs>
                            <linearGradient id="vc-av" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor={c.avila[0]} />
                                <stop offset="1" stopColor={c.avila[1]} />
                            </linearGradient>
                        </defs>
                        <path d={AVILA} fill="url(#vc-av)" />
                        <line
                            x1={520}
                            y1={800}
                            x2={700}
                            y2={270}
                            stroke="#33424f"
                            strokeWidth={1.5}
                        />
                        <rect
                            x={mezcla(520, 700, cabina) - 7}
                            y={mezcla(800, 270, cabina) + 2}
                            width={14}
                            height={10}
                            rx={2}
                            fill={modo === 'noche' ? '#ffcf6e' : '#e63946'}
                        />
                        <rect x={686} y={232} width={28} height={42} rx={12} fill={c.humboldt} />
                    </svg>
                </div>
                <div style={{ ...capa, transform: hundir(0.8) }}>
                    <svg
                        viewBox="0 0 1600 900"
                        preserveAspectRatio="xMidYMax slice"
                        style={svgFull}
                    >
                        {Array.from({ length: 40 }, (_, i) => {
                            const w = 30 + ((i * 37) % 50);
                            const h = 40 + ((i * 53) % 100);
                            return (
                                <g key={i}>
                                    <rect
                                        x={i * 40}
                                        y={900 - h}
                                        width={w}
                                        height={h}
                                        fill={c.ciudad}
                                    />
                                    <rect
                                        x={i * 40 + 8}
                                        y={900 - h + 10}
                                        width={4}
                                        height={5}
                                        fill={c.luz}
                                        opacity={0.7}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>
                {!movil && (
                    <div style={{ ...capa, transform: hundir(0.9) }}>
                        <svg
                            viewBox="0 0 1600 900"
                            preserveAspectRatio="xMidYMax slice"
                            style={svgFull}
                        >
                            <rect x={980} y={640} width={34} height={260} fill={c.torres} />
                            <rect x={1032} y={644} width={34} height={256} fill={c.torres} />
                        </svg>
                    </div>
                )}
            </div>

            {/* Nubes: bajan desde arriba cuando la cámara sube */}
            {!movil && (
                <div
                    style={{
                        ...capa,
                        transform: `translate3d(0, ${(-70 + e.alt * 80).toFixed(2)}vh, 0)`,
                        opacity: Math.min(1, e.alt * 1.6),
                    }}
                >
                    {[
                        [8, 20, 28],
                        [55, 12, 34],
                        [30, 45, 40],
                        [70, 55, 30],
                        [-5, 70, 36],
                    ].map(([x, y, w], i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${x}vw`,
                                top: `${y}vh`,
                                width: `${w}vw`,
                                height: `${w / 3.2}vw`,
                                borderRadius: '50%',
                                background: `radial-gradient(closest-side, ${c.nube}, transparent)`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Contenido: una sección por pantalla */}
            <main style={{ position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
                {SECCIONES.map((s, i) => (
                    <section
                        key={s}
                        style={{
                            height: '100vh',
                            display: 'flex',
                            alignItems:
                                i === 0 || i === SECCIONES.length - 1 ? 'flex-start' : 'center',
                            justifyContent: 'center',
                            paddingTop: i === 0 || i === SECCIONES.length - 1 ? '12vh' : 0,
                        }}
                    >
                        <div
                            style={{
                                maxWidth: 560,
                                margin: '0 16px',
                                padding: i === 0 ? 0 : '20px 24px',
                                borderRadius: 16,
                                background:
                                    i === 0
                                        ? 'transparent'
                                        : modo === 'dia'
                                          ? 'rgba(250,252,248,0.86)'
                                          : 'rgba(8,18,27,0.78)',
                                color: modo === 'dia' ? '#14231c' : '#eef4f0',
                                textAlign: i === 0 ? 'center' : 'left',
                            }}
                        >
                            <h2 style={{ margin: 0, fontSize: i === 0 ? 56 : 32, fontWeight: 700 }}>
                                {i === 0 ? 'Diego Rangel' : s}
                            </h2>
                            <p style={{ margin: '8px 0 0', opacity: 0.85 }}>
                                {i === 0
                                    ? 'Hero en la franja de cielo · encuadre inicial de la Escena'
                                    : `Encuadre de ${s}: alt=${v.encuadres[i].alt} · zoom=${v.encuadres[i].k}`}
                            </p>
                        </div>
                    </section>
                ))}
            </main>

            {/* Barra flotante del prototipo */}
            <div
                style={{
                    position: 'fixed',
                    left: '50%',
                    bottom: 16,
                    transform: 'translateX(-50%)',
                    width: 'min(860px, calc(100% - 32px))',
                    background: 'rgba(15,23,42,0.92)',
                    color: '#f1f5f9',
                    borderRadius: 14,
                    padding: '12px 14px',
                    font: '13px/1.45 system-ui, sans-serif',
                    zIndex: 10,
                }}
            >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24' }}>PROTOTIPO · Viaje de cámara</strong>
                    {VARIANTES.map((x) => (
                        <button
                            key={x.id}
                            onClick={() => set('v', x.id)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid #475569',
                                background: x.id === v.id ? '#f1f5f9' : 'transparent',
                                color: x.id === v.id ? '#0f172a' : '#f1f5f9',
                                cursor: 'pointer',
                            }}
                        >
                            {x.nombre}
                        </button>
                    ))}
                    {[
                        [
                            'modo',
                            modo === 'dia' ? 'noche' : 'dia',
                            modo === 'dia' ? '☀ Día' : '☾ Noche',
                        ],
                        [
                            'movil',
                            movil ? '0' : '1',
                            movil ? '📱 Móvil (menos capas)' : '🖥 Escritorio',
                        ],
                        ['rm', rm ? '0' : '1', rm ? '⏸ Reduced motion' : '▶ Con movimiento'],
                    ].map(([k, val, label]) => (
                        <button
                            key={k}
                            onClick={() => set(k, val)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid #fbbf24',
                                background: 'transparent',
                                color: '#fbbf24',
                                cursor: 'pointer',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: 6, color: '#cbd5e1' }}>{v.idea}</div>
                <code style={{ display: 'block', marginTop: 6, color: '#94a3b8', fontSize: 11 }}>
                    sección={SECCIONES[e.seccion]} · progreso={(e.progreso * 100).toFixed(0)}% ·
                    alt={e.alt.toFixed(2)} · zoom={e.k.toFixed(2)} · paneo=({e.x.toFixed(1)}vw,{' '}
                    {e.y.toFixed(1)}vh) · capas={capas.join(', ')}
                </code>
            </div>
        </div>
    );
};
