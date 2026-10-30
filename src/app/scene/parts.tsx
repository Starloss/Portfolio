// Piezas SVG de la Escena, en coordenadas de VIEW (1600 × 900). Son puras: no leen el entorno.
// Los elementos con `data-anim` son los únicos animados; su animación sale de scene.css.
import React from 'react';

import {
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

interface PartProps {
    c: ScenePalette;
    night: boolean;
    animate: boolean;
}

const delay = (seconds: number): React.CSSProperties => ({ animationDelay: `${seconds}s` });

// ---------- Cielo ----------

export const Stars: React.FC<{ count: number; groups: number; animate: boolean }> = ({
    count,
    groups,
    animate,
}) => (
    <g data-part="stars" className="scene-fade-in">
        {Array.from({ length: groups }, (_, g) => (
            <g
                key={g}
                data-anim={animate ? 'twinkle' : undefined}
                style={animate ? delay(g * 1.7) : undefined}
            >
                {Array.from({ length: count }, (_, i) => i)
                    .filter((i) => i % groups === g)
                    .map((i) => (
                        <circle
                            key={i}
                            cx={(i * 263) % VIEW.width}
                            cy={(i * 97) % 380}
                            r={i % 7 ? 0.9 : 1.6}
                            style={{ fill: NIGHT_LIGHTS.star }}
                            opacity={0.8}
                        />
                    ))}
            </g>
        ))}
    </g>
);

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

// Cabinas que avanzan solas por un tramo del cable, ida y vuelta.
export const MOVING_CABINS = [
    { from: 0.56, to: 0.7 },
    { from: 0.86, to: 0.74 },
];
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
