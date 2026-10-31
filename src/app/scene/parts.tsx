// Piezas SVG de la Escena, en coordenadas de VIEW (1600 × 900). Son puras: no leen el entorno.
// Los elementos con `data-anim` son los únicos animados; su animación sale de scene.css.
import React from 'react';

import {
    MOVING_CABINS,
    CABLE_PATH,
    cablePoint,
    HUMBOLDT,
    HUMBOLDT_SHAPE,
    LANDMARK_SCALE,
    RIDGE_PATHS,
    STATIONS,
    TOWERS,
    VIEW,
} from './geometry';
import { NIGHT_LIGHTS, type ScenePalette } from './palette';
import {
    AGENT_SIZE,
    agentX,
    LIGHT_HEIGHT,
    STREET_ABOVE,
    streetAgents,
    type AgentKind,
} from './street';

interface PartProps {
    c: ScenePalette;
    night: boolean;
    animate: boolean;
}

const delay = (seconds: number): React.CSSProperties => ({ animationDelay: `${seconds}s` });

// ---------- Cielo ----------

// Guacamaya roja de perfil, volando hacia la derecha: ala cercana levantada, banda amarilla,
// primarias azules, cola larga roja con punta azul, cara clara y pico curvo.
const Macaw: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
    <g transform={`translate(${x},${y}) scale(${s})`}>
        <path d="M-8 1 Q-24 6 -42 14 L-40 10 Q-24 2 -8 -2 Z" style={{ fill: '#c81d25' }} />
        <path d="M-33 10.5 L-42 14 L-40 10 Z" style={{ fill: '#1d4ed8' }} />
        <path d="M-2 0 Q-10 6 -20 12 L-12 12 Q-4 6 4 1 Z" style={{ fill: '#8f1218' }} />
        <path
            d="M-10 0 Q-2 -6 10 -4 Q15 -3 16 0 Q12 4 0 4 Q-6 4 -10 0 Z"
            style={{ fill: '#d62828' }}
        />
        <circle cx={15} cy={-3} r={4} style={{ fill: '#d62828' }} />
        <ellipse cx={16.5} cy={-3.2} rx={1.8} ry={1.3} style={{ fill: '#f1ece2' }} />
        <path d="M18.5 -4.5 Q23 -3.5 20.5 0 L18.5 -1 Z" style={{ fill: '#e9e3d6' }} />
        <path d="M6 -3 Q0 -14 -14 -26 L-6 -27 Q4 -16 11 -4 Z" style={{ fill: '#c81d25' }} />
        <path d="M2.5 -9 Q-2 -15 -7 -20 L-3 -21 Q2 -15 6 -9 Z" style={{ fill: '#f2c200' }} />
        <path d="M-14 -26 L-24 -34 L-12 -31 L-6 -27 Z" style={{ fill: '#1d4ed8' }} />
    </g>
);

/** Pareja de guacamayas en el cielo a la derecha, fuera de la franja del Hero (solo de Día). */
export const Macaws: React.FC<{ animate: boolean }> = ({ animate }) => (
    <g data-part="macaws" className="scene-fade-in">
        <g data-anim={animate ? 'macaws' : undefined}>
            <Macaw x={VIEW.width * 0.74} y={210} s={1.5} />
            <Macaw x={VIEW.width * 0.79} y={236} s={1.3} />
        </g>
    </g>
);

// ---------- El Ávila ----------

export const FarRidge: React.FC<{ c: ScenePalette }> = ({ c }) => (
    <path data-part="far-ridge" d={RIDGE_PATHS.far} style={{ fill: c.ridgeFar }} />
);

const Humboldt: React.FC<{ c: ScenePalette; night: boolean }> = ({ c, night }) => {
    const { width: w, height: h, antenna, haloRadius } = HUMBOLDT_SHAPE;
    return (
        <g
            data-part="humboldt"
            transform={`translate(${HUMBOLDT.x},${HUMBOLDT.y}) scale(${LANDMARK_SCALE})`}
        >
            {night && (
                <circle
                    data-part="halo"
                    className="scene-fade-in"
                    cx={0}
                    cy={-h / 2}
                    r={haloRadius}
                    style={{ fill: 'url(#scene-halo)' }}
                    opacity={0.9}
                />
            )}
            {/* Basamento escalonado, torre cilíndrica con su sombra y bandas de pisos */}
            <rect x={-17} y={-7} width={34} height={7} style={{ fill: c.humboldtShade }} />
            <rect x={-11} y={-11} width={22} height={5} style={{ fill: c.humboldt }} />
            <rect x={-w / 2} y={-h} width={w} height={h - 10} style={{ fill: c.humboldt }} />
            <rect
                x={w / 2 - 4}
                y={-h}
                width={4}
                height={h - 10}
                style={{ fill: c.humboldtShade }}
            />
            {Array.from({ length: 8 }, (_, i) => (
                <rect
                    key={i}
                    x={-w / 2 + 1}
                    y={-h + 5 + i * 3.6}
                    width={w - 2}
                    height={1.1}
                    style={{ fill: c.humboldtBands }}
                    opacity={night ? 0.9 : 0.6}
                />
            ))}
            {/* Corona algo más ancha, caja en la azotea y antena */}
            <rect
                x={-w / 2 - 2}
                y={-h - 4}
                width={w + 4}
                height={5}
                rx={1.5}
                style={{ fill: c.humboldt }}
            />
            <rect x={-4} y={-h - 8} width={8} height={4} style={{ fill: c.humboldtShade }} />
            <line
                x1={0}
                y1={-h - 8}
                x2={0}
                y2={-h - antenna}
                style={{ stroke: c.humboldtShade }}
                strokeWidth={1}
            />
        </g>
    );
};

/** Cabina roja con franja de ventana, colgada del cable desde (0, 0). */
export const CabinShape: React.FC<{ c: ScenePalette }> = ({ c }) => (
    <>
        <line x1={0} y1={0} x2={0} y2={7} style={{ stroke: c.cable }} strokeWidth={1} />
        <rect x={-5} y={7} width={10} height={9} rx={2.5} style={{ fill: c.cabin }} />
        <rect
            x={-3.5}
            y={9}
            width={7}
            height={3}
            rx={1}
            style={{ fill: c.cabinWindow }}
            opacity={0.9}
        />
    </>
);

const STILL_CABINS = [0.3, 0.6, 0.82];

const px = (n: number) => `${n.toFixed(1)}px`;

function cabinTrip(from: number, to: number): React.CSSProperties {
    const start = cablePoint(from);
    const middle = cablePoint((from + to) / 2);
    const end = cablePoint(to);
    return {
        '--mx': px(middle.x - start.x),
        '--my': px(middle.y - start.y),
        '--dx': px(end.x - start.x),
        '--dy': px(end.y - start.y),
    } as React.CSSProperties;
}

const CableCar: React.FC<PartProps & { stillCabins: boolean; cabins: boolean }> = ({
    c,
    night,
    animate,
    stillCabins,
    cabins,
}) => {
    const station = (x: number, y: number, key: string) => (
        <g key={key} transform={`translate(${x},${y})`}>
            <rect x={-12} y={-9} width={24} height={9} style={{ fill: c.station }} />
            <path d="M-14 -9 L0 -15 L14 -9 Z" style={{ fill: c.station }} />
            {night && (
                <rect x={-8} y={-6} width={16} height={2.5} style={{ fill: NIGHT_LIGHTS.window }} />
            )}
        </g>
    );
    return (
        <g data-part="telepherique">
            <path d={CABLE_PATH} style={{ stroke: c.cable, fill: 'none' }} strokeWidth={1.4} />
            {/* Torres afinadas */}
            {[0.22, 0.45, 0.68].map((t) => {
                const { x, y } = cablePoint(t);
                return (
                    <path
                        key={t}
                        d={`M${x - 3} ${y + 38} L${x - 1} ${y} L${x + 1} ${y} L${x + 3} ${y + 38} Z`}
                        style={{ fill: c.cable }}
                    />
                );
            })}
            {!cabins
                ? null
                : stillCabins
                  ? STILL_CABINS.map((t) => {
                        const { x, y } = cablePoint(t);
                        return (
                            <g key={t} transform={`translate(${x},${y})`}>
                                <CabinShape c={c} />
                            </g>
                        );
                    })
                  : MOVING_CABINS.map(({ from, to }) => {
                        const { x, y } = cablePoint(from);
                        return (
                            <g key={from} transform={`translate(${x},${y})`}>
                                <g
                                    data-anim={animate ? 'cabin' : undefined}
                                    style={animate ? cabinTrip(from, to) : undefined}
                                >
                                    <CabinShape c={c} />
                                </g>
                            </g>
                        );
                    })}
            {station(STATIONS.lower.x, STATIONS.lower.y, 'lower')}
            {station(STATIONS.upper.x, STATIONS.upper.y, 'upper')}
        </g>
    );
};

/**
 * Crestas media y cercana, Teleférico y Humboldt. En móvil también lleva la cresta lejana.
 * `slice` parte la montaña para la Escena WebGL, que dibuja las cabinas que se mueven entre las
 * dos mitades: `back` es la cresta media con el cable, sin cabinas; `front`, la cercana y el Humboldt.
 */
export const Avila: React.FC<
    PartProps & { withFarRidge?: boolean; stillCabins?: boolean; slice?: 'back' | 'front' }
> = ({ c, night, animate, withFarRidge = false, stillCabins = false, slice }) => (
    <g data-part="avila">
        {withFarRidge && <FarRidge c={c} />}
        {slice !== 'front' && (
            <>
                <path d={RIDGE_PATHS.mid} style={{ fill: c.ridgeMid }} />
                <CableCar
                    c={c}
                    night={night}
                    animate={animate}
                    stillCabins={stillCabins}
                    cabins={slice === undefined}
                />
            </>
        )}
        {slice !== 'back' && (
            <>
                <path d={RIDGE_PATHS.near} style={{ fill: c.ridgeNear }} />
                <Humboldt c={c} night={night} />
            </>
        )}
    </g>
);

// ---------- Ciudad y Torres de Parque Central ----------

// Ciudad baja y densa en dos capas: cada capa es una silueta (un solo path) y sus ventanas
// encendidas de Noche van en dos grupos, para que parpadeen por grupos y no ventana por ventana.
function cityLayer(layer: 0 | 1) {
    let silhouette = '';
    const windows = ['', ''];
    for (let i = 0; i < 72; i++) {
        const w = 18 + ((i * 37 + layer * 11) % 30);
        const h = (layer ? 40 : 70) + ((i * 53 + layer * 29) % (layer ? 60 : 80));
        const x = i * 24 - (layer ? 8 : 0);
        const top = VIEW.height - h;
        silhouette += `M${x} ${top}h${w}v${h}h${-w}Z`;
        for (let row = 0; top + 8 + row * 12 < VIEW.height - 8; row++) {
            for (const dx of [5, w - 8]) {
                if ((i * 7 + row * 3 + dx) % 5 < 2) {
                    windows[(i + row) % 2] += `M${x + dx} ${top + 8 + row * 12}h3v3h-3Z`;
                }
            }
        }
    }
    return { silhouette, windows };
}
const CITY = [cityLayer(0), cityLayer(1)];

const Windows: React.FC<{ paths: string[]; animate: boolean; offset: number }> = ({
    paths,
    animate,
    offset,
}) => (
    <g data-part="windows" className="scene-fade-in">
        {paths.map((d, g) => (
            <path
                // Los grupos de ventanas salen de una geometría fija: el índice es una key estable.
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={g}
                d={d}
                style={{ fill: NIGHT_LIGHTS.window, ...(animate ? delay(offset + g * 2.3) : {}) }}
                opacity={0.85}
                data-anim={animate ? 'flicker' : undefined}
            />
        ))}
    </g>
);

export const City: React.FC<PartProps & { withTowers?: boolean }> = ({
    c,
    night,
    animate,
    withTowers = false,
}) => (
    <g data-part="city">
        <path d={CITY[0].silhouette} style={{ fill: c.cityBack }} />
        {night && <Windows paths={CITY[0].windows} animate={false} offset={0} />}
        {withTowers && <Towers c={c} night={night} animate={animate} />}
        <path d={CITY[1].silhouette} style={{ fill: c.cityFront }} />
        {night && <Windows paths={CITY[1].windows} animate={animate} offset={0} />}
    </g>
);

// Dos prismas gemelos ochavados, con caras laterales más claras, estría central y remate de
// marco abierto. La torre Oeste lleva el helipuerto.
const TOWER_WIDTH = 24;
// Ventanas de Noche de una torre centrada en x: un grupo por torre.
const towerWindows = (height: number, x: number) => {
    let d = '';
    for (let i = 0; i < Math.floor(height / 9); i++) {
        if ((i * 7) % 3) d += `M${x - 8} ${-height + 10 + i * 9}h2v2h-2Z`;
        if ((i * 5) % 4) d += `M${x + 5} ${-height + 13 + i * 9}h2v2h-2Z`;
    }
    return d;
};

export const Towers: React.FC<PartProps> = ({ c, night, animate }) => {
    const h = TOWERS.height;
    const w = TOWER_WIDTH;
    const tower = (x: number, helipad: boolean, behind: boolean) => (
        <g transform={`translate(${x},0)`} opacity={behind ? 0.92 : 1}>
            <rect x={-w / 2} y={-h} width={w} height={h} style={{ fill: c.towers }} />
            <rect x={-w / 2} y={-h} width={4} height={h} style={{ fill: c.towersLight }} />
            <rect x={w / 2 - 4} y={-h} width={4} height={h} style={{ fill: c.towersLight }} />
            <rect x={-1.5} y={-h + 6} width={3} height={h - 6} style={{ fill: c.towersLight }} />
            <rect x={-w / 2 + 2} y={-h - 9} width={2.5} height={9} style={{ fill: c.towers }} />
            <rect x={w / 2 - 4.5} y={-h - 9} width={2.5} height={9} style={{ fill: c.towers }} />
            <rect
                x={-w / 2 + 2}
                y={-h - 10}
                width={w - 4}
                height={2.5}
                style={{ fill: c.towers }}
            />
            {helipad && (
                <ellipse cx={0} cy={-h - 11} rx={w / 2 + 3} ry={2.2} style={{ fill: c.towers }} />
            )}
            {helipad && night && (
                <circle
                    data-part="beacon"
                    className="scene-fade-in"
                    cx={w / 2 + 2}
                    cy={-h - 12}
                    r={1.6}
                    style={{ fill: NIGHT_LIGHTS.beacon }}
                />
            )}
        </g>
    );
    return (
        <g
            data-part="towers"
            transform={`translate(${TOWERS.x},${TOWERS.base}) scale(${TOWERS.scale})`}
        >
            {tower(14, false, true)}
            {tower(-14, true, false)}
            {night && (
                <Windows
                    paths={[towerWindows(h, -14), towerWindows(h, 14)]}
                    animate={animate}
                    offset={0.4}
                />
            )}
        </g>
    );
};

/** Degradado del halo del Humboldt (Noche); va una vez en cada SVG que lo usa. */
export const HaloGradient: React.FC = () => (
    <defs>
        <radialGradient id="scene-halo">
            <stop offset="0" style={{ stopColor: NIGHT_LIGHTS.halo }} stopOpacity={0.55} />
            <stop offset="1" style={{ stopColor: NIGHT_LIGHTS.halo }} stopOpacity={0} />
        </radialGradient>
    </defs>
);

// ---------- Avenida Bolívar ----------

// Cada cuánto hay un poste (con un árbol a mitad de camino), en px de pantalla.
const POST_EVERY = 260;

const circlePath = (x: number, y: number, r: number) =>
    `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

// Una línea con puntas redondas: los brazos, piernas y cuadros de las siluetas. `from` y `to` van
// en px con y hacia arriba, desde el suelo.
const Stroke: React.FC<{
    from: [number, number];
    to: [number, number];
    r: number;
    fill: string;
}> = ({ from, to, r, fill }) => (
    <line
        x1={from[0]}
        y1={-from[1]}
        x2={to[0]}
        y2={-to[1]}
        style={{ stroke: fill }}
        strokeWidth={2 * r}
        strokeLinecap="round"
    />
);

/**
 * La silueta de alguien de la calle, mirando hacia +x y apoyada en (0, 0), con su ancho `w` y alto
 * `h` en px. Son las mismas proporciones que dibuja la Escena WebGL.
 */
export const StreetAgentShape: React.FC<{
    kind: AgentKind;
    w: number;
    h: number;
    c: ScenePalette;
    night: boolean;
}> = ({ kind, w, h, c, night }) => {
    const wheel = (x: number, y: number, r: number) => (
        <circle cx={x * w} cy={-y * h} r={r * h} style={{ fill: c.vehicle }} />
    );
    const light = (x: number, y: number, r: number, color: string) =>
        night && <circle cx={x * w} cy={-y * h} r={r * h} style={{ fill: color }} />;
    // Un paralelogramo inclinado como el del shader: centrado en `cx`, de alto `y0` a `y1` (en h) y
    // corrido 0,55 por unidad de alto, hacia adelante arriba.
    const slanted = (cx: number, half: number, y0: number, y1: number, center: number) =>
        [
            [y0, -half],
            [y0, half],
            [y1, half],
            [y1, -half],
        ]
            .map(([y, dx], i) => {
                const x = cx * w + dx * w + 0.55 * (y - center) * h;
                return `${i ? 'L' : 'M'}${x} ${-y * h}`;
            })
            .join(' ') + ' Z';
    if (kind === 'car') {
        return (
            <g>
                <rect
                    x={-0.5 * w}
                    y={-0.56 * h}
                    width={w}
                    height={0.4 * h}
                    rx={0.12 * h}
                    style={{ fill: c.vehicle }}
                />
                <path d={slanted(-0.06, 0.27, 0.48, 0.88, 0.68)} style={{ fill: c.vehicle }} />
                <path d={slanted(-0.06, 0.21, 0.58, 0.8, 0.68)} style={{ fill: c.vehicleWindow }} />
                {wheel(0.31, 0.14, 0.15)}
                {wheel(-0.31, 0.14, 0.15)}
                {light(0.5, LIGHT_HEIGHT.car, 0.05, NIGHT_LIGHTS.headlight)}
                {light(-0.5, LIGHT_HEIGHT.car, 0.045, NIGHT_LIGHTS.taillight)}
            </g>
        );
    }
    if (kind === 'bus') {
        // Las ventanas, entre los parantes cada 0,12 w desde el frente, como en el shader.
        const windows = [0, 1, 2, 3, 4, 5, 6, 7]
            .map((k) => [
                Math.max(-0.41, -0.5 + k * 0.12 + 0.01),
                Math.min(0.47, -0.5 + (k + 1) * 0.12 - 0.01),
            ])
            .filter(([from, to]) => to > from);
        return (
            <g>
                <rect
                    x={-0.5 * w}
                    y={-0.96 * h}
                    width={w}
                    height={0.84 * h}
                    rx={0.1 * h}
                    style={{ fill: c.vehicle }}
                />
                {windows.map(([from, to]) => (
                    <rect
                        key={from}
                        x={from * w}
                        y={-0.79 * h}
                        width={(to - from) * w}
                        height={0.22 * h}
                        style={{ fill: c.busWindow }}
                    />
                ))}
                {wheel(0.33, 0.13, 0.13)}
                {wheel(-0.33, 0.13, 0.13)}
                {light(0.5, LIGHT_HEIGHT.bus, 0.05, NIGHT_LIGHTS.headlight)}
                {light(-0.5, LIGHT_HEIGHT.bus, 0.045, NIGHT_LIGHTS.taillight)}
            </g>
        );
    }
    if (kind === 'moto') {
        return (
            <g>
                {wheel(0.33, 0.17, 0.17)}
                {wheel(-0.33, 0.17, 0.17)}
                <Stroke
                    from={[-0.3 * w, 0.3 * h]}
                    to={[0.3 * w, 0.38 * h]}
                    r={0.07 * h}
                    fill={c.vehicle}
                />
                <Stroke
                    from={[-0.05 * w, 0.45 * h]}
                    to={[0.06 * w, 0.78 * h]}
                    r={0.1 * h}
                    fill={c.vehicle}
                />
                <Stroke
                    from={[0.06 * w, 0.72 * h]}
                    to={[0.3 * w, 0.55 * h]}
                    r={0.04 * h}
                    fill={c.vehicle}
                />
                <Stroke
                    from={[-0.02 * w, 0.45 * h]}
                    to={[0.12 * w, 0.25 * h]}
                    r={0.05 * h}
                    fill={c.vehicle}
                />
                <circle cx={0.1 * w} cy={-0.9 * h} r={0.1 * h} style={{ fill: c.vehicle }} />
                {light(0.5, LIGHT_HEIGHT.moto, 0.05, NIGHT_LIGHTS.headlight)}
                {light(-0.5, LIGHT_HEIGHT.moto, 0.04, NIGHT_LIGHTS.taillight)}
            </g>
        );
    }
    // Un peatón a mitad de paso.
    const step = 0.3;
    const leg = (a: number): [number, number] => [
        Math.sin(a) * 0.48 * h,
        0.5 * h - Math.cos(a) * 0.48 * h,
    ];
    const arm = (a: number): [number, number] => [
        Math.sin(a) * 0.33 * h,
        0.76 * h - Math.cos(a) * 0.33 * h,
    ];
    return (
        <g>
            <circle cx={0} cy={-0.9 * h} r={0.075 * h} style={{ fill: c.vehicle }} />
            <Stroke from={[0, 0.54 * h]} to={[0, 0.78 * h]} r={0.085 * h} fill={c.vehicle} />
            <Stroke from={[0, 0.5 * h]} to={leg(step)} r={0.04 * h} fill={c.vehicle} />
            <Stroke from={[0, 0.5 * h]} to={leg(-step)} r={0.04 * h} fill={c.vehicle} />
            <Stroke from={[0, 0.76 * h]} to={arm(-step * 0.8)} r={0.03 * h} fill={c.vehicle} />
            <Stroke from={[0, 0.76 * h]} to={arm(step * 0.8)} r={0.03 * h} fill={c.vehicle} />
        </g>
    );
};

/**
 * La Avenida Bolívar en una franja de `width` px de ancho: la calzada mide `height`, y los postes y
 * los árboles suben hasta 0,8 de eso por encima. Con `agents`, la gente y los vehículos quietos en
 * su lugar de partida; la Escena WebGL los dibuja aparte, en movimiento.
 */
export const Avenue: React.FC<{
    c: ScenePalette;
    width: number;
    height: number;
    night: boolean;
    agents: boolean;
}> = ({ c, width, height: H, night, agents }) => {
    const top = STREET_ABOVE * H;
    const band = (from: number, to: number, fill: string) => (
        <rect x={0} y={top + from * H} width={width} height={(to - from) * H} style={{ fill }} />
    );
    const mark = (s: number, stroke: string, dash?: string) => (
        <line
            x1={0}
            y1={top + s * H}
            x2={width}
            y2={top + s * H}
            style={{ stroke }}
            strokeWidth={0.012 * H}
            strokeDasharray={dash}
        />
    );
    const posts = Array.from(
        { length: Math.ceil(width / POST_EVERY) + 1 },
        (_, i) => i * POST_EVERY,
    );
    return (
        <g data-part="avenue">
            {band(0.1, 0.3, c.sidewalk)}
            {band(0.3, 0.33, c.curb)}
            {band(0.33, 0.915, c.road)}
            {band(0.915, 0.94, c.curb)}
            {band(0.94, 1, c.sidewalk)}
            {mark(0.535, c.laneMark, '46 44')}
            {mark(0.82, c.laneMark, '46 44')}
            {mark(0.672, c.centerLine)}
            {mark(0.69, c.centerLine)}
            {posts.map((x) => (
                <g key={`tree-${x}`} transform={`translate(${x + POST_EVERY / 2},${top})`}>
                    <rect
                        x={-0.02 * H}
                        y={-0.06 * H}
                        width={0.04 * H}
                        height={0.32 * H}
                        style={{ fill: c.tree }}
                    />
                    {/* La copa: tres círculos en un solo path (en móvil se cuentan los elementos). */}
                    <path
                        d={[
                            [0, -0.16, 0.22],
                            [0.15, -0.08, 0.17],
                            [-0.16, -0.07, 0.16],
                        ]
                            .map(([x, y, r]) => circlePath(x * H, y * H, r * H))
                            .join(' ')}
                        style={{ fill: c.tree }}
                    />
                </g>
            ))}
            {posts.map((x) => (
                <g key={`post-${x}`} transform={`translate(${x},${top})`}>
                    {night && (
                        <circle
                            cx={0.23 * H}
                            cy={-0.75 * H}
                            r={0.32 * H}
                            style={{ fill: 'url(#scene-lamp)' }}
                        />
                    )}
                    <rect
                        x={-0.014 * H}
                        y={-0.77 * H}
                        width={0.028 * H}
                        height={1.04 * H}
                        style={{ fill: c.lamppost }}
                    />
                    <rect
                        x={0}
                        y={-0.777 * H}
                        width={0.24 * H}
                        height={0.024 * H}
                        style={{ fill: c.lamppost }}
                    />
                    <rect
                        x={0.185 * H}
                        y={-0.766 * H}
                        width={0.09 * H}
                        height={0.032 * H}
                        style={{ fill: night ? NIGHT_LIGHTS.window : c.lamppost }}
                    />
                </g>
            ))}
            {agents &&
                streetAgents().map((a, i) => {
                    const [fw, fh] = AGENT_SIZE[a.kind];
                    const x = agentX(a, 0, width, H);
                    // Solo los que caen en pantalla: en un teléfono son menos.
                    if (x < -fw * H || x > width + fw * H) return null;
                    return (
                        <g
                            // La formación es siempre la misma: el índice es una key estable.
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={i}
                            transform={`translate(${x},${top + a.s * H}) scale(${a.dir},1)`}
                        >
                            <StreetAgentShape
                                kind={a.kind}
                                w={fw * H * a.scale}
                                h={fh * H * a.scale}
                                c={c}
                                night={night}
                            />
                        </g>
                    );
                })}
        </g>
    );
};

/** La luz de los postes de Noche. */
export const LampGradient: React.FC = () => (
    <defs>
        <radialGradient id="scene-lamp">
            <stop offset="0" style={{ stopColor: NIGHT_LIGHTS.window }} stopOpacity={0.6} />
            <stop offset="1" style={{ stopColor: NIGHT_LIGHTS.window }} stopOpacity={0} />
        </radialGradient>
    </defs>
);
