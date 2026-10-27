// PROTOTIPO DESECHABLE: no es código de producción, no tiene tests.
// Responde al ticket "Composición de la Escena: Ávila, Humboldt, Parque Central y Teleférico".
// Abrir con `pnpm prototype:escena`; cambiar variante con ?v=a|b|c y modo con ?modo=dia|noche.
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type Modo = 'dia' | 'noche';

interface Variante {
    id: 'a' | 'b' | 'c';
    nombre: string;
    idea: string;
    avila: { base: number; alto: number; capasLejanas: number };
    torres: { x: number; alto: number; ancho: number };
    estacionX: number; // estación base del Teleférico (Maripérez)
    humboldtX: number;
    ciudad: { filas: number; altoMax: number; densidad: number };
    cabinas: number;
}

const VARIANTES: Variante[] = [
    {
        id: 'a',
        nombre: 'A · Panorama',
        idea: 'Encuadre equilibrado: El Ávila de fondo a todo lo ancho, Parque Central como hito central, ciudad media.',
        avila: { base: 620, alto: 330, capasLejanas: 1 },
        torres: { x: 560, alto: 380, ancho: 46 },
        estacionX: 980,
        humboldtX: 1120,
        ciudad: { filas: 1, altoMax: 170, densidad: 34 },
        cabinas: 2,
    },
    {
        id: 'b',
        nombre: 'B · Ávila monumental',
        idea: 'La montaña es la protagonista: ocupa más de la mitad de la altura, con varias crestas por perspectiva atmosférica; la ciudad queda baja y densa.',
        avila: { base: 720, alto: 560, capasLejanas: 3 },
        torres: { x: 980, alto: 250, ancho: 34 },
        estacionX: 560,
        humboldtX: 760,
        ciudad: { filas: 2, altoMax: 120, densidad: 52 },
        cabinas: 4,
    },
    {
        id: 'c',
        nombre: 'C · Skyline protagonista',
        idea: 'Parque Central en primer plano, enorme; El Ávila lejano y pálido detrás; dos capas de ciudad dan profundidad.',
        avila: { base: 560, alto: 230, capasLejanas: 2 },
        torres: { x: 1180, alto: 600, ancho: 70 },
        estacionX: 420,
        humboldtX: 600,
        ciudad: { filas: 2, altoMax: 260, densidad: 30 },
        cabinas: 2,
    },
];

const W = 1600;
const H = 900;

const PALETA = {
    dia: {
        cieloArriba: '#6fb3e0',
        cieloAbajo: '#e8f4fb',
        lejana: ['#b9d3df', '#a3c4d3', '#8fb5c6'],
        avilaArriba: '#5f9c78',
        avilaAbajo: '#2f6b4f',
        torres: '#56697a',
        ciudadLejos: '#8da2b2',
        ciudadCerca: '#566a7b',
        ventana: '#d9e6ee',
        ventanaOpacidad: 0.45,
        humboldt: '#e9eef2',
        cable: '#33424f',
    },
    noche: {
        cieloArriba: '#060b1c',
        cieloAbajo: '#1b2c52',
        lejana: ['#1a2a44', '#16253c', '#132033'],
        avilaArriba: '#13263a',
        avilaAbajo: '#0a1622',
        torres: '#0b1420',
        ciudadLejos: '#13213a',
        ciudadCerca: '#0c1726',
        ventana: '#ffcf6e',
        ventanaOpacidad: 0.9,
        humboldt: '#fff2c9',
        cable: '#46566a',
    },
} as const;

function rng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// Perfil del Ávila: sube desde el oeste, meseta alta en el centro, pico (Naiguatá) hacia el este.
function alturaAvila(x: number, alto: number, semilla: number) {
    const t = x / W;
    const g = (c: number, s: number, a: number) => a * Math.exp(-((t - c) ** 2) / (2 * s * s));
    const envolvente =
        g(0.15, 0.1, 0.45) +
        g(0.38, 0.13, 0.7) +
        g(0.62, 0.1, 0.82) +
        g(0.78, 0.06, 0.55) +
        g(0.95, 0.1, 0.4);
    const ruido =
        Math.sin(x * 0.021 + semilla) * 0.035 +
        Math.sin(x * 0.057 + semilla * 2) * 0.018 +
        Math.sin(x * 0.13 + semilla * 3) * 0.008;
    return Math.max(0, Math.min(1, envolvente / 1.1 + ruido)) * alto;
}

function crestaPath(base: number, alto: number, semilla: number) {
    let d = `M0 ${H} L0 ${base - alturaAvila(0, alto, semilla)}`;
    for (let x = 0; x <= W; x += 12) d += ` L${x} ${base - alturaAvila(x, alto, semilla)}`;
    return `${d} L${W} ${H} Z`;
}

interface Edificio {
    x: number;
    w: number;
    h: number;
    ventanas: { x: number; y: number; on: boolean }[];
}

function ciudad(semilla: number, cantidad: number, altoMax: number, evitarX: number) {
    const r = rng(semilla);
    const edificios: Edificio[] = [];
    for (let i = 0; i < cantidad; i++) {
        const x = (i / cantidad) * W + (r() - 0.5) * 30;
        if (Math.abs(x - evitarX) < 90) continue;
        const w = 34 + r() * 46;
        const h = 40 + r() * altoMax;
        const ventanas: Edificio['ventanas'] = [];
        for (let vy = 10; vy < h - 10; vy += 12)
            for (let vx = 6; vx < w - 8; vx += 10) ventanas.push({ x: vx, y: vy, on: r() > 0.42 });
        edificios.push({ x, w, h, ventanas });
    }
    return edificios;
}

const CapaCiudad: React.FC<{ edificios: Edificio[]; suelo: number; color: string; modo: Modo }> = ({
    edificios,
    suelo,
    color,
    modo,
}) => {
    const p = PALETA[modo];
    return (
        <g>
            {edificios.map((e, i) => (
                <g key={i} transform={`translate(${e.x} ${suelo - e.h})`}>
                    <rect width={e.w} height={e.h + 200} fill={color} />
                    {e.ventanas
                        .filter((v) => v.on)
                        .map((v, j) => (
                            <rect
                                key={j}
                                x={v.x}
                                y={v.y}
                                width={4}
                                height={5}
                                fill={p.ventana}
                                opacity={p.ventanaOpacidad}
                            />
                        ))}
                </g>
            ))}
        </g>
    );
};

// Torres de Parque Central: dos prismas gemelos con remate escalonado.
const TorresParqueCentral: React.FC<{
    x: number;
    suelo: number;
    alto: number;
    ancho: number;
    modo: Modo;
}> = ({ x, suelo, alto, ancho, modo }) => {
    const p = PALETA[modo];
    const torre = (dx: number, dh: number, key: string) => {
        const h = alto - dh;
        const top = suelo - h;
        const pisos = Math.floor(h / 9);
        return (
            <g key={key}>
                <rect x={x + dx} y={top} width={ancho} height={h + 200} fill={p.torres} />
                <rect
                    x={x + dx + ancho * 0.18}
                    y={top - 10}
                    width={ancho * 0.64}
                    height={12}
                    fill={p.torres}
                />
                <rect
                    x={x + dx + ancho * 0.44}
                    y={top - 34}
                    width={2}
                    height={26}
                    fill={p.torres}
                />
                {Array.from({ length: pisos }, (_, i) =>
                    (i * 7 + dx) % 5 === 0 && modo === 'dia' ? null : (
                        <rect
                            key={i}
                            x={x + dx + 4}
                            y={top + 6 + i * 9}
                            width={ancho - 8}
                            height={2}
                            fill={p.ventana}
                            opacity={
                                modo === 'noche' ? ((i * 13 + dx) % 7 > 2 ? 0.75 : 0.15) : 0.25
                            }
                        />
                    ),
                )}
            </g>
        );
    };
    return (
        <g>
            {torre(0, 0, 'oeste')}
            {torre(ancho + ancho * 0.55, alto * 0.015, 'este')}
        </g>
    );
};

// Hotel Humboldt: cilindro esbelto en la cima.
const Humboldt: React.FC<{ x: number; y: number; escala: number; modo: Modo }> = ({
    x,
    y,
    escala,
    modo,
}) => {
    const p = PALETA[modo];
    const w = 30 * escala;
    const h = 46 * escala;
    return (
        <g transform={`translate(${x - w / 2} ${y - h})`}>
            {modo === 'noche' && (
                <ellipse
                    cx={w / 2}
                    cy={h * 0.5}
                    rx={w * 1.6}
                    ry={h * 0.9}
                    fill="#ffd98a"
                    opacity={0.08}
                />
            )}
            <rect width={w} height={h + 6} rx={w / 2.4} fill={p.humboldt} />
            {Array.from({ length: 10 }, (_, i) => (
                <rect
                    key={i}
                    x={2}
                    y={h * 0.12 + i * h * 0.075}
                    width={w - 4}
                    height={1.6 * escala}
                    fill={modo === 'noche' ? '#ffb347' : '#9fb0bd'}
                    opacity={modo === 'noche' ? 0.95 : 0.7}
                />
            ))}
        </g>
    );
};

// Guacamaya estilizada: cuerpo rojo, ala azul, cola larga.
const Guacamaya: React.FC<{ ruta: string; dur: number; delay: number; escala: number }> = ({
    ruta,
    dur,
    delay,
    escala,
}) => (
    <g>
        <g transform={`scale(${escala})`}>
            <path d="M0 0 Q8 -5 16 -1 Q10 1 0 0 Z" fill="#d62828" />
            <path d="M5 -2 Q10 -14 15 -3 Z" fill="#1d4ed8">
                <animate
                    attributeName="d"
                    values="M5 -2 Q10 -14 15 -3 Z;M5 -2 Q10 8 15 -3 Z;M5 -2 Q10 -14 15 -3 Z"
                    dur="0.6s"
                    repeatCount="indefinite"
                />
            </path>
            <path d="M0 0 L-16 3 L-14 0 Z" fill="#f4c430" />
            <path d="M-2 0 L-22 5 L-20 1 Z" fill="#d62828" />
        </g>
        <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={ruta} />
    </g>
);

export const EscenaPrototype: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const v = VARIANTES.find((x) => x.id === params.get('v')) ?? VARIANTES[0];
    const modo: Modo = params.get('modo') === 'noche' ? 'noche' : 'dia';
    const p = PALETA[modo];

    const set = (k: string, val: string) => {
        const next = new window.URLSearchParams(params);
        next.set(k, val);
        setParams(next, { replace: true });
    };

    const semilla = 7;
    const suelo = H - 20;
    const humboldtY = v.avila.base - alturaAvila(v.humboldtX, v.avila.alto, semilla);
    const estacionY = suelo - 70;
    const cable = `M${v.estacionX} ${estacionY} Q${(v.estacionX + v.humboldtX) / 2} ${
        (estacionY + humboldtY) / 2 + 40
    } ${v.humboldtX} ${humboldtY - 4}`;

    const lejos = useMemo(
        () =>
            ciudad(11 + v.id.charCodeAt(0), v.ciudad.densidad, v.ciudad.altoMax * 0.7, v.torres.x),
        [v],
    );
    const cerca = useMemo(
        () =>
            ciudad(
                23 + v.id.charCodeAt(0),
                Math.round(v.ciudad.densidad * 0.8),
                v.ciudad.altoMax,
                v.torres.x,
            ),
        [v],
    );
    const estrellas = useMemo(() => {
        const r = rng(99);
        return Array.from({ length: 140 }, () => ({
            x: r() * W,
            y: r() * H * 0.55,
            s: 0.6 + r() * 1.6,
        }));
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, background: p.cieloAbajo }}>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="xMidYMax slice"
                style={{ width: '100%', height: '100%' }}
            >
                <defs>
                    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={p.cieloArriba} />
                        <stop offset="1" stopColor={p.cieloAbajo} />
                    </linearGradient>
                    <linearGradient id="avila" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={p.avilaArriba} />
                        <stop offset="1" stopColor={p.avilaAbajo} />
                    </linearGradient>
                    <path id="cable" d={cable} />
                </defs>

                <rect width={W} height={H} fill="url(#cielo)" />
                {modo === 'noche' &&
                    estrellas.map((e, i) => (
                        <circle key={i} cx={e.x} cy={e.y} r={e.s} fill="#fff" opacity={0.8} />
                    ))}
                {modo === 'dia' ? (
                    <circle cx={W * 0.82} cy={150} r={70} fill="#ffd25e" opacity={0.95} />
                ) : (
                    <circle cx={W * 0.82} cy={140} r={56} fill="#eef2f7" />
                )}

                {/* Crestas lejanas (perspectiva atmosférica) */}
                {Array.from({ length: v.avila.capasLejanas }, (_, i) => (
                    <path
                        key={i}
                        d={crestaPath(
                            v.avila.base - 40 - i * 30,
                            v.avila.alto * (0.75 - i * 0.12),
                            semilla + 3 + i * 5,
                        )}
                        fill={p.lejana[i % p.lejana.length]}
                    />
                ))}

                {/* El Ávila */}
                <path d={crestaPath(v.avila.base, v.avila.alto, semilla)} fill="url(#avila)" />

                {/* Teleférico */}
                <use href="#cable" fill="none" stroke={p.cable} strokeWidth={1.4} />
                {Array.from({ length: v.cabinas }, (_, i) => (
                    <g key={i}>
                        <g transform="translate(-6 0)">
                            <line x1={6} y1={0} x2={6} y2={6} stroke={p.cable} strokeWidth={1} />
                            <rect
                                y={6}
                                width={12}
                                height={9}
                                rx={2}
                                fill={modo === 'noche' ? '#ffcf6e' : '#e63946'}
                            />
                        </g>
                        <animateMotion
                            dur="26s"
                            begin={`${-i * (26 / v.cabinas)}s`}
                            repeatCount="indefinite"
                            keyPoints="0;1;0"
                            keyTimes="0;0.5;1"
                            calcMode="linear"
                        >
                            <mpath href="#cable" />
                        </animateMotion>
                    </g>
                ))}
                <Humboldt
                    x={v.humboldtX}
                    y={humboldtY + 4}
                    escala={v.avila.alto / 380}
                    modo={modo}
                />

                {/* Ciudad */}
                <CapaCiudad
                    edificios={lejos}
                    suelo={suelo - 30}
                    color={p.ciudadLejos}
                    modo={modo}
                />
                <TorresParqueCentral
                    x={v.torres.x}
                    suelo={suelo}
                    alto={v.torres.alto}
                    ancho={v.torres.ancho}
                    modo={modo}
                />
                {v.ciudad.filas > 1 && (
                    <CapaCiudad
                        edificios={cerca}
                        suelo={suelo + 20}
                        color={p.ciudadCerca}
                        modo={modo}
                    />
                )}

                {/* Guacamayas, sólo de Día */}
                {modo === 'dia' && (
                    <>
                        <Guacamaya
                            ruta={`M-60 260 Q${W / 2} 180 ${W + 60} 300`}
                            dur={22}
                            delay={0}
                            escala={2.4}
                        />
                        <Guacamaya
                            ruta={`M-60 290 Q${W / 2} 210 ${W + 60} 330`}
                            dur={22}
                            delay={0.7}
                            escala={2}
                        />
                    </>
                )}
            </svg>

            {/* Barra flotante del prototipo */}
            <div
                style={{
                    position: 'fixed',
                    left: '50%',
                    bottom: 16,
                    transform: 'translateX(-50%)',
                    width: 'min(760px, calc(100% - 32px))',
                    background: 'rgba(15,23,42,0.88)',
                    color: '#f1f5f9',
                    borderRadius: 14,
                    padding: '12px 14px',
                    font: '13px/1.45 system-ui, sans-serif',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                }}
            >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24' }}>PROTOTIPO · Escena</strong>
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
                    <button
                        onClick={() => set('modo', modo === 'dia' ? 'noche' : 'dia')}
                        style={{
                            marginLeft: 'auto',
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid #fbbf24',
                            background: 'transparent',
                            color: '#fbbf24',
                            cursor: 'pointer',
                        }}
                    >
                        {modo === 'dia' ? '☀ Día → Noche' : '☾ Noche → Día'}
                    </button>
                </div>
                <div style={{ marginTop: 6, color: '#cbd5e1' }}>{v.idea}</div>
                <code style={{ display: 'block', marginTop: 6, color: '#94a3b8', fontSize: 11 }}>
                    v={v.id} · modo={modo} · Ávila alto={v.avila.alto} capas=
                    {v.avila.capasLejanas + 1} · torres alto=
                    {v.torres.alto} · ciudad filas={v.ciudad.filas} · cabinas={v.cabinas}
                </code>
            </div>
        </div>
    );
};
