// PROTOTIPO DESECHABLE: no es código de producción, no tiene tests.
// Responde al ticket "Siluetas reconocibles de los Hitos y perfil real del Ávila".
// Abrir con `pnpm prototype:hitos`; ?punto=proceres|plazavenezuela|parquedeleste|bellomonte,
// ?nivel=min|det, ?exag=auto|1|2|3, ?modo=dia|noche, ?lamina=1 (Hitos ampliados), ?ref=1 (nombres).
// El perfil del Ávila sale del SRTM 1" (dominio público): ver escenaHitosDatos.ts.
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { VISTAS } from './escenaHitosDatos';

type Modo = 'dia' | 'noche';
type Nivel = 'min' | 'det';
type Punto = keyof typeof VISTAS;

const W = 1600;
const H = 900;
const Y0 = 770; // ángulo 0° = altura del ojo, a nivel de la ciudad

const C = {
    dia: {
        cielo: ['#5ea8dc', '#cfe8f5'],
        crestas: ['#9fbfb0', '#6f9f86', '#3f7a5c'],
        ciudad: ['#7d8f9c', '#5a6c79'],
        torres: '#4f6170',
        torresLuz: '#6b7f8f',
        humboldt: '#f2f4f2',
        humboldtSombra: '#c9d0d3',
        cable: '#3a4652',
        cabina: '#d62828',
        estacion: '#e9ecef',
        ventana: '#cfdde6',
    },
    noche: {
        cielo: ['#050a1a', '#1b2c52'],
        crestas: ['#1c2c44', '#142235', '#0c1826'],
        ciudad: ['#13202f', '#0c1622'],
        torres: '#0e1925',
        torresLuz: '#1a2a3a',
        humboldt: '#fff1c4',
        humboldtSombra: '#e8c97a',
        cable: '#4b5a6b',
        cabina: '#ffcf6e',
        estacion: '#ffe8b0',
        ventana: '#ffcf6e',
    },
};

// ---------- Hitos: cada uno en coordenadas locales, con base en (0,0) y escala s ----------

const Humboldt: React.FC<{ nivel: Nivel; modo: Modo; s?: number }> = ({ nivel, modo, s = 1 }) => {
    const c = C[modo];
    // Torre cilíndrica blanca de 14 pisos sobre un basamento bajo, con corona algo más ancha.
    const w = 15;
    const h = 44;
    return (
        <g transform={`scale(${s})`}>
            {modo === 'noche' && (
                <circle cx={0} cy={-h / 2} r={34} fill="url(#halo)" opacity={0.9} />
            )}
            {nivel === 'det' ? (
                <>
                    <rect x={-17} y={-7} width={34} height={7} fill={c.humboldtSombra} />
                    <rect x={-11} y={-11} width={22} height={5} fill={c.humboldt} />
                    <rect x={-w / 2} y={-h} width={w} height={h - 10} fill={c.humboldt} />
                    <rect x={w / 2 - 4} y={-h} width={4} height={h - 10} fill={c.humboldtSombra} />
                    {Array.from({ length: 8 }, (_, i) => (
                        <rect
                            key={i}
                            x={-w / 2 + 1}
                            y={-h + 5 + i * 3.6}
                            width={w - 2}
                            height={1.1}
                            fill={modo === 'noche' ? '#ffcf6e' : '#9aa7ad'}
                            opacity={modo === 'noche' ? 0.9 : 0.6}
                        />
                    ))}
                    <rect
                        x={-w / 2 - 2}
                        y={-h - 4}
                        width={w + 4}
                        height={5}
                        rx={1.5}
                        fill={c.humboldt}
                    />
                    <rect x={-4} y={-h - 8} width={8} height={4} fill={c.humboldtSombra} />
                    <line
                        x1={0}
                        y1={-h - 8}
                        x2={0}
                        y2={-h - 18}
                        stroke={c.humboldtSombra}
                        strokeWidth={1}
                    />
                </>
            ) : (
                <>
                    <rect x={-14} y={-6} width={28} height={6} fill={c.humboldtSombra} />
                    <rect x={-w / 2} y={-h} width={w} height={h - 6} rx={2} fill={c.humboldt} />
                    <rect
                        x={-w / 2 - 1.5}
                        y={-h - 3}
                        width={w + 3}
                        height={4}
                        rx={1.5}
                        fill={c.humboldt}
                    />
                </>
            )}
        </g>
    );
};

const ParqueCentral: React.FC<{ nivel: Nivel; modo: Modo; alto: number; s?: number }> = ({
    nivel,
    modo,
    alto,
    s = 1,
}) => {
    const c = C[modo];
    const w = 24;
    // Dos torres gemelas de 56 pisos, prismas con esquinas ochavadas; la Oeste lleva el helipuerto.
    const torre = (x: number, helipuerto: boolean, atras: boolean) => (
        <g transform={`translate(${x},0)`} opacity={atras ? 0.92 : 1}>
            <rect x={-w / 2} y={-alto} width={w} height={alto} fill={c.torres} />
            {nivel === 'det' && (
                <>
                    <rect x={-w / 2} y={-alto} width={4} height={alto} fill={c.torresLuz} />
                    <rect x={w / 2 - 4} y={-alto} width={4} height={alto} fill={c.torresLuz} />
                    <rect x={-1.5} y={-alto + 6} width={3} height={alto - 6} fill={c.torresLuz} />
                    {modo === 'noche' &&
                        Array.from({ length: Math.floor(alto / 9) }, (_, i) => (
                            <g key={i}>
                                <rect
                                    x={-8}
                                    y={-alto + 10 + i * 9}
                                    width={2}
                                    height={2}
                                    fill="#ffcf6e"
                                    opacity={(i * 7) % 3 ? 0.85 : 0.2}
                                />
                                <rect
                                    x={5}
                                    y={-alto + 13 + i * 9}
                                    width={2}
                                    height={2}
                                    fill="#ffcf6e"
                                    opacity={(i * 5) % 4 ? 0.8 : 0.15}
                                />
                            </g>
                        ))}
                    {/* Remate: marco abierto sobre la azotea */}
                    <rect x={-w / 2 + 2} y={-alto - 9} width={2.5} height={9} fill={c.torres} />
                    <rect x={w / 2 - 4.5} y={-alto - 9} width={2.5} height={9} fill={c.torres} />
                    <rect
                        x={-w / 2 + 2}
                        y={-alto - 10}
                        width={w - 4}
                        height={2.5}
                        fill={c.torres}
                    />
                    {helipuerto && (
                        <ellipse cx={0} cy={-alto - 11} rx={w / 2 + 3} ry={2.2} fill={c.torres} />
                    )}
                    {helipuerto && modo === 'noche' && (
                        <circle cx={w / 2 + 2} cy={-alto - 12} r={1.6} fill="#ff4d4d" />
                    )}
                </>
            )}
            {nivel === 'min' && (
                <rect x={-w / 2 - 1} y={-alto - 4} width={w + 2} height={4} fill={c.torres} />
            )}
        </g>
    );
    return (
        <g transform={`scale(${s})`}>
            {torre(14, false, true)}
            {torre(-14, true, false)}
        </g>
    );
};

// Guacamaya roja (Ara macao) de perfil, volando hacia la derecha: alas hacia atrás y cola larga.
const Guacamaya: React.FC<{ nivel: Nivel; s?: number; flip?: boolean }> = ({
    nivel,
    s = 1,
    flip,
}) => (
    <g transform={`scale(${flip ? -s : s},${s})`}>
        {nivel === 'det' ? (
            <>
                {/* Cola larga y fina: roja con punta azul */}
                <path d="M-8 1 Q-24 6 -42 14 L-40 10 Q-24 2 -8 -2 Z" fill="#c81d25" />
                <path d="M-33 10.5 L-42 14 L-40 10 Z" fill="#1d4ed8" />
                {/* Ala lejana, más oscura */}
                <path d="M-2 0 Q-10 6 -20 12 L-12 12 Q-4 6 4 1 Z" fill="#8f1218" />
                {/* Cuerpo */}
                <path d="M-10 0 Q-2 -6 10 -4 Q15 -3 16 0 Q12 4 0 4 Q-6 4 -10 0 Z" fill="#d62828" />
                {/* Cabeza, cara clara y pico curvo */}
                <circle cx={15} cy={-3} r={4} fill="#d62828" />
                <ellipse cx={16.5} cy={-3.2} rx={1.8} ry={1.3} fill="#f1ece2" />
                <path d="M18.5 -4.5 Q23 -3.5 20.5 0 L18.5 -1 Z" fill="#e9e3d6" />
                {/* Ala cercana levantada: roja junto al cuerpo, banda amarilla, primarias azules */}
                <path d="M6 -3 Q0 -14 -14 -26 L-6 -27 Q4 -16 11 -4 Z" fill="#c81d25" />
                <path d="M2.5 -9 Q-2 -15 -7 -20 L-3 -21 Q2 -15 6 -9 Z" fill="#f2c200" />
                <path d="M-14 -26 L-24 -34 L-12 -31 L-6 -27 Z" fill="#1d4ed8" />
            </>
        ) : (
            <>
                <path d="M-8 0 L-36 10" stroke="#c81d25" strokeWidth={2.5} strokeLinecap="round" />
                <ellipse cx={4} cy={0} rx={12} ry={4} fill="#d62828" />
                <path d="M6 -3 L-12 -24 L-4 -24 L11 -3 Z" fill="#1d4ed8" />
                <path d="M4 -6 L-3 -14 L1 -14 L7 -5 Z" fill="#f2c200" />
            </>
        )}
    </g>
);

// Teleférico: de la estación Maripérez (abajo) a Waraira Repano (arriba, junto al Humboldt).
const Teleferico: React.FC<{
    nivel: Nivel;
    modo: Modo;
    a: [number, number];
    b: [number, number];
}> = ({ nivel, modo, a, b }) => {
    const c = C[modo];
    const [x1, y1] = a;
    const [x2, y2] = b;
    const comba = nivel === 'det' ? 0.06 : 0;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + Math.abs(y1 - y2) * comba;
    const punto = (t: number) => [
        (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2,
        (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2,
    ];
    const cabina = (t: number, k: number) => {
        const [x, y] = punto(t);
        return nivel === 'det' ? (
            <g key={k} transform={`translate(${x},${y})`}>
                <line x1={0} y1={0} x2={0} y2={7} stroke={c.cable} strokeWidth={1} />
                <rect x={-5} y={7} width={10} height={9} rx={2.5} fill={c.cabina} />
                <rect
                    x={-3.5}
                    y={9}
                    width={7}
                    height={3}
                    rx={1}
                    fill={modo === 'noche' ? '#fff6dc' : '#f7f7f7'}
                    opacity={0.9}
                />
            </g>
        ) : (
            <rect key={k} x={x - 5} y={y + 2} width={10} height={8} rx={2} fill={c.cabina} />
        );
    };
    const estacion = (x: number, y: number, k: string) => (
        <g key={k} transform={`translate(${x},${y})`}>
            <rect x={-12} y={-9} width={24} height={9} fill={c.estacion} />
            <path d="M-14 -9 L0 -15 L14 -9 Z" fill={c.estacion} />
            {modo === 'noche' && <rect x={-8} y={-6} width={16} height={2.5} fill="#ffcf6e" />}
        </g>
    );
    return (
        <g>
            <path
                d={`M${x1} ${y1 - 12} Q ${mx} ${my - 12} ${x2} ${y2 - 12}`}
                stroke={c.cable}
                strokeWidth={1.4}
                fill="none"
            />
            {nivel === 'det' &&
                [0.22, 0.45, 0.68].map((t) => {
                    const [x, y] = punto(t);
                    return (
                        <path
                            key={t}
                            d={`M${x - 3} ${y + 26} L${x - 1} ${y - 12} L${x + 1} ${y - 12} L${x + 3} ${y + 26} Z`}
                            fill={c.cable}
                        />
                    );
                })}
            {[0.3, 0.6, 0.82].map((t, k) => (
                <g key={k} transform="translate(0,-12)">
                    {cabina(t, k)}
                </g>
            ))}
            {nivel === 'det' && estacion(x1, y1, 'abajo')}
            {nivel === 'det' && estacion(x2, y2, 'arriba')}
        </g>
    );
};

// ---------- Escena completa desde un punto de vista ----------

const Escena: React.FC<{ punto: Punto; nivel: Nivel; modo: Modo; exag: string; ref_: boolean }> = ({
    punto,
    nivel,
    modo,
    exag,
    ref_,
}) => {
    const v = VISTAS[punto];
    const c = C[modo];
    const [a0, a1] = v.az;
    const pxGrado = W / (a1 - a0);
    const maxAng = Math.max(...v.perfiles[2]);
    // auto: la cumbre más alta llega al 58% de la altura del encuadre (composición B · Ávila monumental)
    const k = exag === 'auto' ? (0.58 * H) / (maxAng * pxGrado) : Number(exag);
    const X = (az: number) => ((az - a0) / (a1 - a0)) * W;
    const Y = (ang: number) => Y0 - ang * pxGrado * k;
    const camino = (perfil: readonly number[]) =>
        `M0 ${H} ` +
        perfil.map((ang, i) => `L${(i / (perfil.length - 1)) * W} ${Y(ang).toFixed(1)}`).join(' ') +
        ` L${W} ${H} Z`;
    const crestaEn = (az: number) => {
        const p = v.perfiles[2];
        const i = Math.max(0, Math.min(p.length - 1, Math.round((az - a0) * 2)));
        return Y(p[i]);
    };
    const enCuadro = (az: number) => az > a0 + 2 && az < a1 - 2;

    const hum = v.hitos.humboldt;
    const arriba = v.hitos.estacionArriba;
    const mp = v.hitos.mariperez;
    const pc = v.hitos.parqueCentral;
    const pcEnCuadro = enCuadro(pc[0]);
    const pcX = pcEnCuadro ? X(pc[0]) : W * 0.16;
    // Altura de las torres con la misma exageración, con un mínimo para que se lean.
    const pcAlto = Math.max(70, Math.min(170, (Y0 - Y(pc[1])) * 1.1 + 40));
    const mpX = enCuadro(mp[0]) ? X(mp[0]) : mp[0] < a0 ? 30 : W - 30;
    const mpY = Math.min(Y0 + 10, Y(Math.max(mp[1], 0.2)));
    const sHitos = 1.6;

    const etiquetas: [string, number, number][] = [
        ['Hotel Humboldt', hum[0], hum[1]],
        ['Pico Occidental', v.hitos.picoOccidental[0], v.hitos.picoOccidental[1]],
        ['Pico Oriental', v.hitos.picoOriental[0], v.hitos.picoOriental[1]],
        ['Pico Naiguatá', v.hitos.naiguata[0], v.hitos.naiguata[1]],
    ];

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMax slice"
            style={{ width: '100%', height: '100%', display: 'block' }}
        >
            <defs>
                <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={c.cielo[0]} />
                    <stop offset="1" stopColor={c.cielo[1]} />
                </linearGradient>
                <radialGradient id="halo">
                    <stop offset="0" stopColor="#ffe3a0" stopOpacity={0.55} />
                    <stop offset="1" stopColor="#ffe3a0" stopOpacity={0} />
                </radialGradient>
            </defs>
            <rect width={W} height={H} fill="url(#cielo)" />
            {modo === 'noche' &&
                Array.from({ length: 60 }, (_, i) => (
                    <circle
                        key={i}
                        cx={(i * 263) % W}
                        cy={(i * 97) % 380}
                        r={i % 7 ? 0.9 : 1.6}
                        fill="#fff"
                        opacity={0.7}
                    />
                ))}
            {modo === 'noche' && <circle cx={W * 0.82} cy={120} r={26} fill="#f4f1e4" />}

            {/* Crestas reales: todo el horizonte, ≤6,5 km y ≤3 km */}
            <path d={camino(v.perfiles[2])} fill={c.crestas[0]} />
            <path d={camino(v.perfiles[1])} fill={c.crestas[1]} />
            <path d={camino(v.perfiles[0])} fill={c.crestas[2]} />

            {enCuadro(hum[0]) && (
                <>
                    <Teleferico
                        nivel={nivel}
                        modo={modo}
                        a={[mpX, mpY]}
                        b={[X(arriba[0]) + 8, crestaEn(arriba[0]) + 4]}
                    />
                    <g transform={`translate(${X(hum[0])},${crestaEn(hum[0]) + 3})`}>
                        <Humboldt nivel={nivel} modo={modo} s={sHitos} />
                    </g>
                </>
            )}

            {/* Ciudad baja y densa en dos capas */}
            {[0, 1].map((capa) => (
                <g key={capa}>
                    {Array.from({ length: 70 }, (_, i) => {
                        const w = 18 + ((i * 37 + capa * 11) % 30);
                        const h = (capa ? 40 : 70) + ((i * 53 + capa * 29) % (capa ? 60 : 80));
                        const x = i * 24 - (capa ? 8 : 0);
                        return (
                            <g key={i}>
                                <rect x={x} y={H - h} width={w} height={h} fill={c.ciudad[capa]} />
                                {modo === 'noche' && (i + capa) % 3 === 0 && (
                                    <rect
                                        x={x + 5}
                                        y={H - h + 8}
                                        width={3}
                                        height={3}
                                        fill="#ffcf6e"
                                        opacity={0.8}
                                    />
                                )}
                            </g>
                        );
                    })}
                    {capa === 0 && (
                        <g transform={`translate(${pcX},${H - 20})`}>
                            <ParqueCentral nivel={nivel} modo={modo} alto={pcAlto} s={1.15} />
                        </g>
                    )}
                </g>
            ))}

            {modo === 'dia' && (
                <g>
                    <g transform={`translate(${W * 0.74},${210})`}>
                        <Guacamaya nivel={nivel} s={1.5} />
                    </g>
                    <g transform={`translate(${W * 0.79},${236})`}>
                        <Guacamaya nivel={nivel} s={1.3} />
                    </g>
                </g>
            )}

            {ref_ && (
                <g fontFamily="system-ui" fontSize={16} fill={modo === 'dia' ? '#0d2233' : '#fff'}>
                    {etiquetas
                        .filter(([, az]) => enCuadro(az))
                        .map(([n, az]) => (
                            <g
                                key={n}
                                transform={`translate(${X(az)},${crestaEn(az) - (n === 'Hotel Humboldt' ? 95 : 18)})`}
                            >
                                <line
                                    x1={0}
                                    y1={4}
                                    x2={0}
                                    y2={n === 'Hotel Humboldt' ? 20 : 14}
                                    stroke="currentColor"
                                />
                                <text textAnchor="middle">{n}</text>
                            </g>
                        ))}
                    <text x={pcX} y={H - pcAlto - 70} textAnchor="middle">
                        Parque Central{pcEnCuadro ? '' : ' (licencia: fuera de cuadro)'}
                    </text>
                    <text x={mpX} y={mpY + 34} textAnchor="middle">
                        Maripérez{enCuadro(mp[0]) ? '' : ' (fuera de cuadro)'}
                    </text>
                </g>
            )}
        </svg>
    );
};

// ---------- Lámina: cada Hito ampliado, mínimo vs detallado ----------

const Lamina: React.FC<{ modo: Modo }> = ({ modo }) => {
    const c = C[modo];
    const celda = (titulo: string, dibujo: (n: Nivel) => React.ReactNode) => (
        <div
            style={{
                background: modo === 'dia' ? '#d9eef8' : '#0b1426',
                borderRadius: 14,
                padding: 12,
            }}
        >
            <div
                style={{
                    fontWeight: 700,
                    marginBottom: 6,
                    color: modo === 'dia' ? '#0d2233' : '#eef4f0',
                }}
            >
                {titulo}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['min', 'det'] as Nivel[]).map((n) => (
                    <div key={n}>
                        <svg
                            viewBox="-60 -125 120 135"
                            style={{
                                width: '100%',
                                background: modo === 'dia' ? '#bfe0f1' : '#050a1a',
                                borderRadius: 10,
                            }}
                        >
                            <defs>
                                <radialGradient id="halo">
                                    <stop offset="0" stopColor="#ffe3a0" stopOpacity={0.55} />
                                    <stop offset="1" stopColor="#ffe3a0" stopOpacity={0} />
                                </radialGradient>
                            </defs>
                            {dibujo(n)}
                        </svg>
                        <div
                            style={{
                                fontSize: 12,
                                textAlign: 'center',
                                color: modo === 'dia' ? '#334' : '#cbd5e1',
                            }}
                        >
                            {n === 'min' ? 'Mínimo' : 'Detallado'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 14,
                padding: 16,
                maxWidth: 1400,
                margin: '0 auto',
            }}
        >
            {celda('Hotel Humboldt', (n) => (
                <g transform="translate(0,-8)">
                    <rect x={-60} y={0} width={120} height={20} fill={c.crestas[0]} />
                    <Humboldt nivel={n} modo={modo} s={1.9} />
                </g>
            ))}
            {celda('Torres de Parque Central', (n) => (
                <g transform="translate(0,6)">
                    <ParqueCentral nivel={n} modo={modo} alto={80} s={1.05} />
                </g>
            ))}
            {celda('Teleférico', (n) => (
                <g>
                    <path d="M-60 10 L60 -80 L60 10 Z" fill={c.crestas[1]} />
                    <Teleferico nivel={n} modo={modo} a={[-48, 4]} b={[50, -74]} />
                </g>
            ))}
            {celda('Guacamaya', (n) => (
                <g transform="translate(0,-50)">
                    <Guacamaya nivel={n} s={2.6} />
                </g>
            ))}
        </div>
    );
};

// ---------- Prototipo ----------

const PUNTOS: Punto[] = ['proceres', 'plazavenezuela', 'parquedeleste', 'bellomonte'];

export const EscenaHitosPrototype: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const punto: Punto = (PUNTOS as string[]).includes(params.get('punto') ?? '')
        ? (params.get('punto') as Punto)
        : 'proceres';
    const nivel: Nivel = params.get('nivel') === 'min' ? 'min' : 'det';
    const modo: Modo = params.get('modo') === 'noche' ? 'noche' : 'dia';
    const exag = ['1', '2', '3'].includes(params.get('exag') ?? '')
        ? (params.get('exag') as string)
        : 'auto';
    const lamina = params.get('lamina') === '1';
    const ref_ = params.get('ref') === '1';
    const v = VISTAS[punto];

    const set = (k: string, val: string) => {
        const next = new window.URLSearchParams(params);
        next.set(k, val);
        setParams(next, { replace: true });
    };

    const pill = (activo: boolean, ambar = false): React.CSSProperties => ({
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${ambar ? '#fbbf24' : '#475569'}`,
        background: activo ? '#f1f5f9' : 'transparent',
        color: activo ? '#0f172a' : ambar ? '#fbbf24' : '#f1f5f9',
        cursor: 'pointer',
    });

    return (
        <div
            style={{
                fontFamily: 'system-ui, sans-serif',
                minHeight: '100vh',
                background: modo === 'dia' ? '#eef6fa' : '#020611',
            }}
        >
            {lamina ? (
                <div style={{ paddingBottom: 180 }}>
                    <Lamina modo={modo} />
                </div>
            ) : (
                <div style={{ position: 'fixed', inset: 0 }}>
                    <Escena punto={punto} nivel={nivel} modo={modo} exag={exag} ref_={ref_} />
                </div>
            )}

            <div
                style={{
                    position: 'fixed',
                    left: '50%',
                    bottom: 16,
                    transform: 'translateX(-50%)',
                    width: 'min(980px, calc(100% - 32px))',
                    background: 'rgba(15,23,42,0.94)',
                    color: '#f1f5f9',
                    borderRadius: 14,
                    padding: '10px 14px',
                    font: '13px/1.45 system-ui, sans-serif',
                    zIndex: 10,
                }}
            >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24' }}>PROTOTIPO · Hitos y Ávila</strong>
                    <span style={{ color: '#94a3b8' }}>Punto de vista:</span>
                    {PUNTOS.map((p) => (
                        <button key={p} onClick={() => set('punto', p)} style={pill(p === punto)}>
                            {VISTAS[p].nombre}
                        </button>
                    ))}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        marginTop: 6,
                    }}
                >
                    <span style={{ color: '#94a3b8' }}>Hitos:</span>
                    <button onClick={() => set('nivel', 'min')} style={pill(nivel === 'min')}>
                        Mínimo
                    </button>
                    <button onClick={() => set('nivel', 'det')} style={pill(nivel === 'det')}>
                        Detallado
                    </button>
                    <span style={{ color: '#94a3b8' }}>Exageración vertical:</span>
                    {['auto', '1', '2', '3'].map((e) => (
                        <button key={e} onClick={() => set('exag', e)} style={pill(e === exag)}>
                            {e === 'auto' ? 'auto' : `×${e}`}
                        </button>
                    ))}
                    <button
                        onClick={() => set('modo', modo === 'dia' ? 'noche' : 'dia')}
                        style={pill(false, true)}
                    >
                        {modo === 'dia' ? '☀ Día' : '☾ Noche'}
                    </button>
                    <button onClick={() => set('ref', ref_ ? '0' : '1')} style={pill(ref_, true)}>
                        Nombres
                    </button>
                    <button
                        onClick={() => set('lamina', lamina ? '0' : '1')}
                        style={pill(lamina, true)}
                    >
                        Lámina
                    </button>
                </div>
                <code style={{ display: 'block', marginTop: 6, color: '#94a3b8', fontSize: 11 }}>
                    punto={v.nombre} ({v.cota} m) · azimut {v.az[0]}°…{v.az[1]}° · cumbre máx{' '}
                    {Math.max(...v.perfiles[2]).toFixed(1)}° · Humboldt az {v.hitos.humboldt[0]}° ·
                    Parque Central az {v.hitos.parqueCentral[0]}° · nivel={nivel} · exag={exag} ·
                    modo={modo}
                </code>
            </div>
        </div>
    );
};
