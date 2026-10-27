// PROTOTIPO DESECHABLE: no es código de producción, no tiene tests.
// Responde al ticket "Layout del Home sobre la Escena".
// Abrir con `pnpm prototype:layout`; ?v=a|b|c|d, ?modo=dia|noche, ?sobre=fuera|hero|impacto|seccion,
// ?ir=<id de sección> salta a esa sección (útil para capturas).
// La Escena es la del prototipo del Viaje de cámara (coreografía A · Teleférico), simplificada.
/* eslint-disable react/display-name */
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export type Modo = 'dia' | 'noche';
type Sobre = 'fuera' | 'hero' | 'impacto' | 'seccion';

interface Variante {
    id: 'a' | 'b' | 'c' | 'd';
    nombre: string;
    idea: string;
}

const VARIANTES: Variante[] = [
    {
        id: 'a',
        nombre: 'A · Panel único',
        idea: 'Como hoy: después del Hero, un solo panel translúcido largo con todas las secciones. La Escena se ve en los bordes y detrás del vidrio.',
    },
    {
        id: 'b',
        nombre: 'B · Bloques por sección',
        idea: 'Cada sección es su propio bloque translúcido, con un respiro de paisaje limpio entre bloques. El Viaje de cámara se ve en los respiros.',
    },
    {
        id: 'c',
        nombre: 'C · Columna lateral',
        idea: 'El contenido vive en una columna a la izquierda sobre un velo degradado; la mitad derecha deja ver la Escena todo el tiempo. En móvil se apila como B.',
    },
    {
        id: 'd',
        nombre: 'D · Escena como ventanas',
        idea: 'Hero y Contacto a pantalla completa sobre la Escena. Entre medio, las secciones van sobre una superficie opaca y el paisaje asoma por "ventanas" entre ellas. Máximo contraste.',
    },
];

// ---------- Contenido (borradores ya aprobados en otros tickets del mapa) ----------

const CIFRAS = [
    { valor: '8+', texto: 'años de experiencia', respaldo: 'Trayectoria' },
    { valor: '10+', texto: 'devs liderados', respaldo: 'CORE' },
    { valor: '−80%', texto: 'tiempo de booking hotelero', respaldo: 'SuperWallet' },
    { valor: '100%', texto: 'entregas a tiempo', respaldo: 'CORE' },
];

const EXPERIENCIAS = [
    {
        rol: 'Senior Developer',
        empresa: 'XHype',
        periodo: 'Ago 2025 – Abr 2026',
        lugar: 'Remoto',
        logros: [
            'Integraciones de proveedores de viaje en una billetera cripto.',
            'Capa de hoteles y actividades con caché y consultas en paralelo.',
        ],
        proyectos: ['SuperWallet'],
    },
    {
        rol: 'Lead Developer',
        empresa: 'CORE Care and Health Systems',
        periodo: 'Oct 2022 – Presente',
        lugar: 'Caracas, Venezuela',
        logros: [
            'Lidero y mentoreo a un equipo de más de 10 devs, aumentando su productividad en 60%.',
            'Workshops que lograron 100% de entregas a tiempo.',
        ],
        proyectos: ['BE - Booking Engine'],
    },
    {
        rol: 'Lead Developer',
        empresa: 'Wocoon',
        periodo: 'Jun 2021 – Mar 2023',
        lugar: 'Caracas, Venezuela',
        logros: [
            'App móvil híbrida con Ionic, Angular y Firebase.',
            'CI/CD que redujo los tiempos de despliegue en 70%.',
        ],
        proyectos: [],
    },
    {
        rol: 'Software Developer',
        empresa: 'Daxos',
        periodo: 'Ago 2020 – Oct 2022',
        lugar: 'Caracas, Venezuela',
        logros: ['Aplicaciones full-stack con Node.js, React, Angular e Ionic.'],
        proyectos: [],
    },
    {
        rol: 'Frontend Developer',
        empresa: '300 Dev',
        periodo: 'Sep 2018 – Ago 2020',
        lugar: 'Caracas, Venezuela',
        logros: ['Soluciones para clientes internacionales.'],
        proyectos: [],
    },
];

const PROYECTOS = [
    {
        titulo: 'SuperWallet',
        tipo: 'Proyecto de trabajo · XHype',
        resumen:
            'Billetera cripto para pagar viajes, tarjetas y eSIMs, con integraciones de proveedores de viaje hasta 80% más rápidas.',
        img: '/projects/superwallet-1.jpg',
        tech: ['React', 'TypeScript', 'Prisma', 'Nest'],
    },
    {
        titulo: 'BE - Booking Engine',
        tipo: 'Proyecto de trabajo · CORE',
        resumen:
            'Plataforma interna para coordinar interpretación médica en EE.UU., de la reserva a la facturación.',
        img: null, // sin capturas: va un diagrama propio
        tech: ['React', 'TypeScript', 'Python', 'Django', 'AWS'],
    },
    {
        titulo: 'Invitación de Boda',
        tipo: 'Proyecto personal',
        resumen:
            'Invitación de boda interactiva con RSVP por código y fotos de los invitados, construida y desplegada en 1 semana.',
        img: '/projects/wedding-invitation-11.jpg',
        tech: ['Astro', 'TypeScript', 'Firebase'],
    },
];

const SKILLS: [string, string[]][] = [
    ['Front', ['React', 'React Native', 'Astro', 'Angular', 'Ionic', 'TypeScript', 'Vue']],
    [
        'Back',
        [
            'Node.js',
            'Python',
            'Django',
            'Nest',
            'Next.js',
            'PostgreSQL',
            'MongoDB',
            'Prisma',
            'Firebase',
        ],
    ],
    ['DevOps', ['AWS', 'GCP', 'Vercel', 'CI/CD']],
    [
        'Soft Skills',
        ['Liderazgo', 'Mentoría', 'Resolución de problemas', 'Comunicación', 'Planificación'],
    ],
];

// Borrador nuevo para el "Sobre mí", sin la cifra de años (esa vive en la franja de Impacto).
const SOBRE_MI =
    'Lidero equipos de ingeniería, defino la arquitectura y desarrollo los componentes críticos. Combino visión de negocio con ejecución técnica para convertir problemas complejos en soluciones robustas y medibles.';

// ---------- Escena (simplificada del prototipo del Viaje de cámara) ----------

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

// Tokens de Identidad de la UI (Verde Ávila + ámbar).
export const TOKENS = {
    dia: {
        superficie: 'rgba(250,252,248,0.86)',
        opaca: '#f6f9f5',
        texto: '#14231c',
        suave: '#4b5d55',
        primario: '#2f6b4f',
        sobrePrimario: '#ffffff',
        acento: '#8a5200',
        borde: 'rgba(47,107,79,0.25)',
        velo: 'rgba(250,252,248,0.92)',
    },
    noche: {
        superficie: 'rgba(8,18,27,0.78)',
        opaca: '#0a141d',
        texto: '#eef4f0',
        suave: '#a9bcb2',
        primario: '#6fcf97',
        sobrePrimario: '#06140d',
        acento: '#ffcf6e',
        borde: 'rgba(111,207,151,0.25)',
        velo: 'rgba(8,18,27,0.9)',
    },
};

// Altura de cámara por sección (coreografía A): 0 = ciudad, 1 = sobre las nubes.
const ALT: Record<string, number> = {
    hero: 0,
    sobre: 0.15,
    impacto: 0.35,
    experiencia: 0.7,
    proyectos: 1,
    skills: 0.6,
    contacto: 0,
};

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
const suave = (t: number) => t * t * (3 - 2 * t);
function hexMix(a: string, b: string, t: number) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(mezcla(v, pb[i], t))).join(',')})`;
}

const capa: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    willChange: 'transform',
    pointerEvents: 'none',
};
const svgFull: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };

export const Escena: React.FC<{ modo: Modo; alt: number }> = ({ modo, alt }) => {
    const c = COLORES[modo];
    // BASE baja el paisaje para dejar la franja de cielo libre para el Hero.
    const BASE = 0.3;
    const hundir = (p: number) => `translate3d(0, ${((BASE + alt * p) * 100).toFixed(2)}vh, 0)`;
    return (
        <>
            <div
                style={{
                    ...capa,
                    background: `linear-gradient(${hexMix(c.cielo[0], c.cielo[1], alt)}, ${c.horizonte})`,
                }}
            />
            <div style={{ ...capa, transform: hundir(0.35) }}>
                <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" style={svgFull}>
                    <path d={LEJANA} fill={c.lejana} />
                </svg>
            </div>
            <div style={{ ...capa, transform: hundir(0.55) }}>
                <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" style={svgFull}>
                    <defs>
                        <linearGradient id="lh-av" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor={c.avila[0]} />
                            <stop offset="1" stopColor={c.avila[1]} />
                        </linearGradient>
                    </defs>
                    <path d={AVILA} fill="url(#lh-av)" />
                    <line x1={520} y1={800} x2={700} y2={270} stroke="#33424f" strokeWidth={1.5} />
                    <rect
                        x={mezcla(520, 700, alt) - 7}
                        y={mezcla(800, 270, alt) + 2}
                        width={14}
                        height={10}
                        rx={2}
                        fill={modo === 'noche' ? '#ffcf6e' : '#e63946'}
                    />
                    <rect x={686} y={232} width={28} height={42} rx={12} fill={c.humboldt} />
                </svg>
            </div>
            <div style={{ ...capa, transform: hundir(0.8) }}>
                <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" style={svgFull}>
                    {Array.from({ length: 40 }, (_, i) => {
                        const w = 30 + ((i * 37) % 50);
                        const h = 40 + ((i * 53) % 100);
                        return (
                            <g key={i}>
                                <rect x={i * 40} y={900 - h} width={w} height={h} fill={c.ciudad} />
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
                    <rect x={980} y={640} width={34} height={260} fill={c.torres} />
                    <rect x={1032} y={644} width={34} height={256} fill={c.torres} />
                </svg>
            </div>
            <div
                style={{
                    ...capa,
                    transform: `translate3d(0, ${(-70 + alt * 80).toFixed(2)}vh, 0)`,
                    opacity: Math.min(1, alt * 1.6),
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
        </>
    );
};

// ---------- Secciones (mismo contenido en todas las variantes) ----------

type T = (typeof TOKENS)['dia'];
const titulo = (t: T): React.CSSProperties => ({
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 30,
    margin: '0 0 16px',
    color: t.texto,
});
const chip = (t: T): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    border: `1px solid ${t.borde}`,
    fontSize: 13,
    color: t.suave,
    margin: '0 6px 6px 0',
});

const Impacto: React.FC<{ t: T }> = ({ t }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
        }}
    >
        {CIFRAS.map((c) => (
            <a
                key={c.valor}
                href="#top"
                style={{
                    display: 'block',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: `1px solid ${t.borde}`,
                    textDecoration: 'none',
                    color: t.texto,
                }}
            >
                <div
                    style={{
                        fontFamily: "'Space Grotesk', system-ui",
                        fontWeight: 700,
                        fontSize: 36,
                        color: t.primario,
                    }}
                >
                    {c.valor}
                </div>
                <div style={{ fontSize: 14 }}>{c.texto}</div>
                <div style={{ fontSize: 12, color: t.acento, marginTop: 6 }}>
                    Ver respaldo: {c.respaldo} →
                </div>
            </a>
        ))}
    </div>
);

// La línea de tiempo se dibuja como el cable del Teleférico: cada Experiencia es una estación.
const Experiencia: React.FC<{ t: T }> = ({ t }) => (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
        <div
            style={{
                position: 'absolute',
                left: 7,
                top: 6,
                bottom: 6,
                width: 2,
                background: t.borde,
            }}
        />
        {EXPERIENCIAS.map((e) => (
            <li key={e.empresa} style={{ position: 'relative', paddingLeft: 32, marginBottom: 22 }}>
                <span
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 4,
                        width: 16,
                        height: 12,
                        borderRadius: 3,
                        background: t.acento,
                    }}
                />
                <div style={{ fontSize: 13, color: t.suave }}>
                    {e.periodo} · {e.lugar}
                </div>
                <div
                    style={{
                        fontFamily: "'Space Grotesk', system-ui",
                        fontWeight: 700,
                        fontSize: 19,
                        color: t.texto,
                    }}
                >
                    {e.rol} · {e.empresa}
                </div>
                <ul style={{ margin: '6px 0', paddingLeft: 18, color: t.texto, fontSize: 15 }}>
                    {e.logros.map((l) => (
                        <li key={l}>{l}</li>
                    ))}
                </ul>
                {e.proyectos.map((p) => (
                    <a
                        key={p}
                        href="#top"
                        style={{
                            display: 'inline-flex',
                            gap: 6,
                            alignItems: 'center',
                            padding: '4px 12px',
                            borderRadius: 999,
                            background: t.primario,
                            color: t.sobrePrimario,
                            fontSize: 13,
                            textDecoration: 'none',
                        }}
                    >
                        Proyecto: {p} →
                    </a>
                ))}
            </li>
        ))}
    </ol>
);

const Proyectos: React.FC<{ t: T; modo: Modo }> = ({ t, modo }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
        }}
    >
        {PROYECTOS.map((p) => (
            <a
                key={p.titulo}
                href="#top"
                style={{
                    display: 'block',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: `1px solid ${t.borde}`,
                    background: modo === 'dia' ? '#ffffff' : '#0f1d29',
                    color: t.texto,
                    textDecoration: 'none',
                }}
            >
                {p.img ? (
                    <img
                        src={p.img}
                        alt=""
                        style={{
                            width: '100%',
                            aspectRatio: '16/10',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            aspectRatio: '16/10',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            fontSize: 12,
                            color: t.suave,
                            background: modo === 'dia' ? '#eaf2ec' : '#13263a',
                        }}
                    >
                        reserva → intérprete → servicio → reporte → facturación
                    </div>
                )}
                <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 12, color: t.acento }}>{p.tipo}</div>
                    <div
                        style={{
                            fontFamily: "'Space Grotesk', system-ui",
                            fontWeight: 700,
                            fontSize: 20,
                        }}
                    >
                        {p.titulo}
                    </div>
                    <p style={{ fontSize: 14, margin: '6px 0 10px', color: t.suave }}>
                        {p.resumen}
                    </p>
                    {p.tech.map((x) => (
                        <span key={x} style={chip(t)}>
                            {x}
                        </span>
                    ))}
                </div>
            </a>
        ))}
    </div>
);

const Skills: React.FC<{ t: T }> = ({ t }) => (
    <div style={{ display: 'grid', gap: 12 }}>
        {SKILLS.map(([g, items]) => (
            <div key={g}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.primario, marginBottom: 6 }}>
                    {g}
                </div>
                {items.map((x) => (
                    <span key={x} style={chip(t)}>
                        {x}
                    </span>
                ))}
            </div>
        ))}
    </div>
);

const Contacto: React.FC<{ t: T }> = ({ t }) => (
    <div>
        <p style={{ fontSize: 18, color: t.texto, margin: '0 0 16px' }}>
            ¿Buscas a alguien que lidere tu próximo producto? Escríbeme.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="#top" style={boton(t, true)}>
                starloss09@gmail.com
            </a>
            <a href="#top" style={boton(t, false)}>
                LinkedIn
            </a>
            <a href="#top" style={boton(t, false)}>
                GitHub
            </a>
            <a href="#top" style={boton(t, false)}>
                Descargar CV
            </a>
        </div>
    </div>
);

const boton = (t: T, primario: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    background: primario ? t.primario : 'transparent',
    color: primario ? t.sobrePrimario : t.texto,
    border: `1.5px solid ${primario ? t.primario : t.borde}`,
});

const Hero: React.FC<{ t: T; modo: Modo; conSobre: boolean }> = ({ t, modo, conSobre }) => {
    // El Hero va solo en la franja de cielo: texto directo sobre el cielo, sin panel.
    const sobreCielo = modo === 'dia' ? '#0d2233' : '#eef4f0';
    return (
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto', color: sobreCielo }}>
            <div style={{ fontSize: 18 }}>Hola, soy</div>
            <h1
                style={{
                    fontFamily: "'Space Grotesk', system-ui",
                    fontWeight: 700,
                    fontSize: 'clamp(44px, 8vw, 76px)',
                    margin: '4px 0 10px',
                    lineHeight: 1,
                }}
            >
                Diego Rangel
            </h1>
            <span
                style={{
                    ...chip(t),
                    background: t.superficie,
                    color: t.texto,
                    fontWeight: 600,
                }}
            >
                Full-Stack Lead Developer
            </span>
            <p style={{ fontSize: 19, margin: '10px auto', maxWidth: 560 }}>
                Lidero equipos que construyen productos web y móviles rápidos, escalables y
                medibles.
            </p>
            {conSobre && (
                <p style={{ fontSize: 15, margin: '0 auto 10px', maxWidth: 560, opacity: 0.85 }}>
                    {SOBRE_MI}
                </p>
            )}
            <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>
                Caracas, Venezuela · Remoto
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href="#top" style={boton(t, true)}>
                    Descargar CV
                </a>
                <a href="#top" style={{ ...boton(t, false), background: t.superficie }}>
                    Contactar
                </a>
            </div>
        </div>
    );
};

// ---------- Prototipo ----------

interface Seccion {
    id: string;
    titulo: string;
    cuerpo: React.ReactNode;
}

export const LayoutHomePrototype: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const v = VARIANTES.find((x) => x.id === params.get('v')) ?? VARIANTES[0];
    const modo: Modo = params.get('modo') === 'noche' ? 'noche' : 'dia';
    const sobre = (['fuera', 'hero', 'impacto', 'seccion'] as Sobre[]).includes(
        params.get('sobre') as Sobre,
    )
        ? (params.get('sobre') as Sobre)
        : 'fuera';
    const t = TOKENS[modo];

    const set = (k: string, val: string) => {
        const next = new window.URLSearchParams(params);
        next.set(k, val);
        setParams(next, { replace: true });
    };

    useEffect(() => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap';
        document.head.appendChild(l);
        return () => l.remove();
    }, []);

    const secciones: Seccion[] = [
        ...(sobre === 'seccion'
            ? [
                  {
                      id: 'sobre',
                      titulo: 'Sobre mí',
                      cuerpo: <p style={{ fontSize: 17, color: t.texto, margin: 0 }}>{SOBRE_MI}</p>,
                  },
              ]
            : []),
        {
            id: 'impacto',
            titulo: 'Impacto',
            cuerpo: (
                <>
                    {sobre === 'impacto' && (
                        <p style={{ fontSize: 17, color: t.texto, margin: '0 0 16px' }}>
                            {SOBRE_MI}
                        </p>
                    )}
                    <Impacto t={t} />
                </>
            ),
        },
        { id: 'experiencia', titulo: 'Experiencia', cuerpo: <Experiencia t={t} /> },
        {
            id: 'proyectos',
            titulo: 'Proyectos destacados',
            cuerpo: <Proyectos t={t} modo={modo} />,
        },
        { id: 'skills', titulo: 'Skills', cuerpo: <Skills t={t} /> },
    ];

    // Altura de cámara según la sección que cruza el centro de la pantalla.
    const refs = useRef<Record<string, HTMLElement | null>>({});
    const desplazoRef = useRef(0);
    const mainRef = useRef<HTMLElement | null>(null);
    const [alt, setAlt] = useState(0);
    const [actual, setActual] = useState('hero');
    // ?ir= es un modo de captura: desplaza el contenido con transform en vez de hacer scroll,
    // porque Chrome headless no pinta el scroll real.
    const ir = params.get('ir');
    const [desplazo, setDesplazo] = useState(0);
    useEffect(() => {
        let raf = 0;
        const calc = () => {
            const ids = ['hero', ...secciones.map((s) => s.id), 'contacto'];
            const mid = window.scrollY + desplazoRef.current + window.innerHeight / 2;
            const tops = ids.map((id) => {
                const el = refs.current[id];
                if (!el) return 0;
                // Medido respecto de <main>, así el transform del modo captura no afecta.
                const b = el.getBoundingClientRect();
                const m = mainRef.current?.getBoundingClientRect().top ?? 0;
                return b.top - m + b.height / 2;
            });
            let i = 0;
            while (i < tops.length - 2 && mid > tops[i + 1]) i++;
            const f = Math.max(0, Math.min(1, (mid - tops[i]) / (tops[i + 1] - tops[i] || 1)));
            setAlt(mezcla(ALT[ids[i]], ALT[ids[i + 1]], suave(f)));
            setActual(f < 0.5 ? ids[i] : ids[i + 1]);
        };
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(calc);
        };
        calc();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        if (ir) {
            const el = refs.current[ir];
            if (el) {
                const d = Math.max(0, el.getBoundingClientRect().top + desplazoRef.current - 24);
                desplazoRef.current = d;
                setDesplazo(d);
                calc();
            }
        }
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [v.id, sobre, ir]);

    const reg = (id: string) => (el: HTMLElement | null) => {
        refs.current[id] = el;
    };

    const encabezado = (s: Seccion) => <h2 style={titulo(t)}>{s.titulo}</h2>;

    const hero = (
        <section
            ref={reg('hero')}
            style={{ minHeight: '100vh', paddingTop: '12vh', boxSizing: 'border-box' }}
        >
            <Hero t={t} modo={modo} conSobre={sobre === 'hero'} />
        </section>
    );
    const contacto = (envoltorio: (n: React.ReactNode) => React.ReactNode) => (
        <section
            ref={reg('contacto')}
            style={{
                minHeight: '100vh',
                paddingTop: '12vh',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            {envoltorio(
                <>
                    <h2 style={titulo(t)}>Contacto</h2>
                    <Contacto t={t} />
                </>,
            )}
        </section>
    );
    const panel =
        (extra: React.CSSProperties = {}) =>
        (n: React.ReactNode) => (
            <div
                style={{
                    width: 'min(860px, calc(100% - 32px))',
                    padding: '24px 24px',
                    borderRadius: 20,
                    background: t.superficie,
                    backdropFilter: 'blur(6px)',
                    border: `1px solid ${t.borde}`,
                    boxSizing: 'border-box',
                    alignSelf: 'flex-start',
                    ...extra,
                }}
            >
                {n}
            </div>
        );

    let cuerpo: React.ReactNode;
    if (v.id === 'a') {
        cuerpo = (
            <>
                {hero}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {panel()(
                        secciones.map((s) => (
                            <section key={s.id} ref={reg(s.id)} style={{ padding: '20px 0 36px' }}>
                                {encabezado(s)}
                                {s.cuerpo}
                            </section>
                        )),
                    )}
                </div>
                {contacto(panel())}
            </>
        );
    } else if (v.id === 'b') {
        cuerpo = (
            <>
                {hero}
                {secciones.map((s) => (
                    <section
                        key={s.id}
                        ref={reg(s.id)}
                        style={{ display: 'flex', justifyContent: 'center', marginBottom: '35vh' }}
                    >
                        {panel()(
                            <>
                                {encabezado(s)}
                                {s.cuerpo}
                            </>,
                        )}
                    </section>
                ))}
                {contacto(panel())}
            </>
        );
    } else if (v.id === 'c') {
        cuerpo = (
            <>
                {hero}
                <div style={{ position: 'relative' }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: 'min(100%, 760px)',
                            background: `linear-gradient(90deg, ${t.velo} 0%, ${t.velo} 82%, transparent 100%)`,
                        }}
                    />
                    <div
                        style={{
                            position: 'relative',
                            width: 'min(100%, 640px)',
                            padding: '32px 24px 32px max(24px, 4vw)',
                            boxSizing: 'border-box',
                        }}
                    >
                        {secciones.map((s) => (
                            <section
                                key={s.id}
                                ref={reg(s.id)}
                                style={{ padding: '24px 0 64px', minHeight: '60vh' }}
                            >
                                {encabezado(s)}
                                {s.cuerpo}
                            </section>
                        ))}
                    </div>
                </div>
                {contacto(panel())}
            </>
        );
    } else {
        cuerpo = (
            <>
                {hero}
                {secciones.map((s) => (
                    <React.Fragment key={s.id}>
                        <section
                            ref={reg(s.id)}
                            style={{
                                background: t.opaca,
                                padding: '56px 0',
                                display: 'flex',
                                justifyContent: 'center',
                                boxShadow: '0 -12px 32px rgba(0,0,0,0.12)',
                            }}
                        >
                            <div style={{ width: 'min(860px, calc(100% - 32px))' }}>
                                {encabezado(s)}
                                {s.cuerpo}
                            </div>
                        </section>
                        {/* Ventana: un respiro transparente por donde asoma la Escena */}
                        <div aria-hidden style={{ height: '40vh' }} />
                    </React.Fragment>
                ))}
                {contacto(panel())}
            </>
        );
    }

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif' }}>
            <Escena modo={modo} alt={alt} />
            <main
                ref={mainRef}
                style={{
                    position: 'relative',
                    paddingBottom: 160,
                    transform: desplazo ? `translateY(${-desplazo}px)` : undefined,
                }}
            >
                {cuerpo}
            </main>

            {/* Barra flotante del prototipo */}
            <div
                style={{
                    position: 'fixed',
                    left: '50%',
                    bottom: 16,
                    transform: 'translateX(-50%)',
                    width: 'min(920px, calc(100% - 32px))',
                    background: 'rgba(15,23,42,0.94)',
                    color: '#f1f5f9',
                    borderRadius: 14,
                    padding: '10px 14px',
                    font: '13px/1.45 system-ui, sans-serif',
                    zIndex: 10,
                }}
            >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24' }}>PROTOTIPO · Layout del Home</strong>
                    {VARIANTES.map((x) => (
                        <button
                            key={x.id}
                            onClick={() => set('v', x.id)}
                            style={pill(x.id === v.id)}
                        >
                            {x.nombre}
                        </button>
                    ))}
                    <button
                        onClick={() => set('modo', modo === 'dia' ? 'noche' : 'dia')}
                        style={pill(false, true)}
                    >
                        {modo === 'dia' ? '☀ Día' : '☾ Noche'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={{ color: '#94a3b8' }}>“Sobre mí”:</span>
                    {(
                        [
                            ['fuera', 'se elimina'],
                            ['hero', 'en el Hero'],
                            ['impacto', 'abre Impacto'],
                            ['seccion', 'sección propia'],
                        ] as [Sobre, string][]
                    ).map(([k, label]) => (
                        <button key={k} onClick={() => set('sobre', k)} style={pill(k === sobre)}>
                            {label}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: 6, color: '#cbd5e1' }}>{v.idea}</div>
                <code style={{ display: 'block', marginTop: 4, color: '#94a3b8', fontSize: 11 }}>
                    sección={actual} · alt={alt.toFixed(2)} · variante={v.id} · modo={modo} · sobre=
                    {sobre} · ancho={typeof window !== 'undefined' ? window.innerWidth : 0}px
                </code>
            </div>
        </div>
    );
};

const pill = (activo: boolean, ambar = false): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${ambar ? '#fbbf24' : '#475569'}`,
    background: activo ? '#f1f5f9' : 'transparent',
    color: activo ? '#0f172a' : ambar ? '#fbbf24' : '#f1f5f9',
    cursor: 'pointer',
});
