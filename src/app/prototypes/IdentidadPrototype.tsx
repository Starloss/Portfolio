// PROTOTIPO DESECHABLE: no es código de producción, no tiene tests.
// Responde al ticket "Identidad de la UI: paleta Caracas y tipografía display".
// Abrir con `pnpm prototype:identidad`; ?v=a..e, ?modo=dia|noche, ?ancho=movil|escritorio.
// Las fuentes vienen de Google Fonts sólo para comparar; en producción irían auto-hospedadas.
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

type Modo = 'dia' | 'noche';

interface Tokens {
    superficie: string;
    texto: string;
    suave: string;
    primario: string;
    sobrePrimario: string;
    acento: string;
    borde: string;
}

interface Paleta {
    nombre: string;
    dia: Tokens;
    noche: Tokens;
}

const PALETAS: Record<string, Paleta> = {
    avila: {
        nombre: 'Verde Ávila + ámbar',
        dia: {
            superficie: 'rgba(250,252,248,0.86)',
            texto: '#14231c',
            suave: '#4b5d55',
            primario: '#2f6b4f',
            sobrePrimario: '#ffffff',
            acento: '#b86e00',
            borde: 'rgba(47,107,79,0.25)',
        },
        noche: {
            superficie: 'rgba(8,18,27,0.78)',
            texto: '#eef4f0',
            suave: '#a9bcb2',
            primario: '#6fcf97',
            sobrePrimario: '#06140d',
            acento: '#ffcf6e',
            borde: 'rgba(111,207,151,0.25)',
        },
    },
    atardecer: {
        nombre: 'Atardecer + cielo',
        dia: {
            superficie: 'rgba(255,251,247,0.86)',
            texto: '#1f1a17',
            suave: '#5c534d',
            primario: '#c2410c',
            sobrePrimario: '#ffffff',
            acento: '#1e6fa8',
            borde: 'rgba(194,65,12,0.22)',
        },
        noche: {
            superficie: 'rgba(14,16,30,0.8)',
            texto: '#f5efe9',
            suave: '#c2b6ad',
            primario: '#fb923c',
            sobrePrimario: '#1a0d04',
            acento: '#7cc4f4',
            borde: 'rgba(251,146,60,0.25)',
        },
    },
    cielo: {
        nombre: 'Azul cielo + ámbar',
        dia: {
            superficie: 'rgba(248,251,255,0.86)',
            texto: '#0f1c2a',
            suave: '#4a5b6d',
            primario: '#1e6fa8',
            sobrePrimario: '#ffffff',
            acento: '#b86e00',
            borde: 'rgba(30,111,168,0.22)',
        },
        noche: {
            superficie: 'rgba(6,12,28,0.8)',
            texto: '#edf3fa',
            suave: '#a8b8cb',
            primario: '#7cc4f4',
            sobrePrimario: '#04121f',
            acento: '#ffcf6e',
            borde: 'rgba(124,196,244,0.25)',
        },
    },
    editorial: {
        nombre: 'Editorial cálido (crema, verde, terracota)',
        dia: {
            superficie: 'rgba(251,246,236,0.9)',
            texto: '#2a2118',
            suave: '#65574a',
            primario: '#2f6b4f',
            sobrePrimario: '#fbf6ec',
            acento: '#b4532a',
            borde: 'rgba(42,33,24,0.18)',
        },
        noche: {
            superficie: 'rgba(24,20,16,0.82)',
            texto: '#f4ece0',
            suave: '#c6b8a6',
            primario: '#8fd6a8',
            sobrePrimario: '#10200f',
            acento: '#f0a272',
            borde: 'rgba(244,236,224,0.18)',
        },
    },
};

interface Variante {
    id: string;
    nombre: string;
    fuente: string;
    ajustes?: string; // font-variation-settings
    paleta: keyof typeof PALETAS;
}

const VARIANTES: Variante[] = [
    {
        id: 'a',
        nombre: 'A · Bricolage 96',
        fuente: "'Bricolage Grotesque'",
        ajustes: "'opsz' 96, 'wdth' 100",
        paleta: 'avila',
    },
    {
        id: 'b',
        nombre: 'B · Bricolage condensada 48',
        fuente: "'Bricolage Grotesque'",
        ajustes: "'opsz' 48, 'wdth' 75",
        paleta: 'atardecer',
    },
    { id: 'c', nombre: 'C · Space Grotesk', fuente: "'Space Grotesk'", paleta: 'cielo' },
    {
        id: 'd',
        nombre: 'D · Fraunces',
        fuente: "'Fraunces'",
        ajustes: "'opsz' 144",
        paleta: 'editorial',
    },
    { id: 'f', nombre: 'F · Space Grotesk + Ávila', fuente: "'Space Grotesk'", paleta: 'avila' },
    { id: 'e', nombre: 'E · Unbounded', fuente: "'Unbounded'", paleta: 'avila' },
];

const FUENTES_URL =
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,700&family=Space+Grotesk:wght@700&family=Fraunces:opsz,wght@9..144,700&family=Unbounded:wght@700&display=swap';

function luminancia(hex: string) {
    const c = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(c.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string) {
    const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
}

const CIELO = {
    dia: ['#6fb3e0', '#e8f4fb', '#5f9c78', '#2f6b4f', '#8da2b2'],
    noche: ['#060b1c', '#1b2c52', '#13263a', '#0a1622', '#13213a'],
};

// Silueta simplificada de la composición B (sólo para dar contexto de fondo).
const AVILA =
    'M0 900 L0 520 L120 470 L240 420 L330 380 L420 360 L520 310 L620 300 L700 270 L790 220 L860 205 L930 230 L1010 270 L1100 250 L1150 235 L1230 300 L1320 380 L1420 410 L1520 420 L1600 430 L1600 900 Z';

export const IdentidadPrototype: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const v = VARIANTES.find((x) => x.id === params.get('v')) ?? VARIANTES[0];
    const modo: Modo = params.get('modo') === 'noche' ? 'noche' : 'dia';
    const movil = params.get('ancho') === 'movil';
    const paleta = PALETAS[v.paleta];
    const t = paleta[modo];
    const cielo = CIELO[modo];

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FUENTES_URL;
        document.head.appendChild(link);
        return () => link.remove();
    }, []);

    const set = (k: string, val: string) => {
        const next = new window.URLSearchParams(params);
        next.set(k, val);
        setParams(next, { replace: true });
    };

    const display: React.CSSProperties = {
        fontFamily: `${v.fuente}, system-ui, sans-serif`,
        fontWeight: 700,
        fontVariationSettings: v.ajustes,
        fontOpticalSizing: 'none',
        letterSpacing: '-0.01em',
    };
    const cuerpo: React.CSSProperties = {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    };

    const cifras = [
        { valor: '8+', etiqueta: 'años de Trayectoria', respaldo: 'Trayectoria' },
        { valor: '10', etiqueta: 'devs mentoreados', respaldo: 'CORE' },
        { valor: '−70%', etiqueta: 'tiempo de despliegue', respaldo: 'Wocoon' },
        { valor: '100%', etiqueta: 'entregas a tiempo', respaldo: 'CORE' },
    ];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: `linear-gradient(${cielo[0]}, ${cielo[1]})`,
                position: 'relative',
                overflowX: 'hidden',
                ...cuerpo,
            }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMax slice"
                style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="av" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={cielo[2]} />
                        <stop offset="1" stopColor={cielo[3]} />
                    </linearGradient>
                </defs>
                <path d={AVILA} fill="url(#av)" />
                <rect y={800} width={1600} height={100} fill={cielo[4]} />
            </svg>

            <main
                style={{
                    position: 'relative',
                    maxWidth: movil ? 360 : 1040,
                    margin: '0 auto',
                    padding: movil ? '40px 16px 220px' : '64px 24px 220px',
                    color: t.texto,
                    outline: movil ? `1px dashed ${t.suave}` : undefined,
                }}
            >
                {/* Hero */}
                <section
                    style={{ textAlign: 'center', padding: movil ? '24px 0 40px' : '48px 0 72px' }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: movil ? 18 : 22,
                            color: modo === 'dia' ? '#14231c' : '#eef4f0',
                        }}
                    >
                        Hola, soy
                    </p>
                    <h1
                        style={{
                            ...display,
                            margin: '4px 0 12px',
                            fontSize: movil ? 44 : 88,
                            lineHeight: 1.02,
                            color: modo === 'dia' ? '#0e1a14' : '#ffffff',
                        }}
                    >
                        Diego Rangel
                    </h1>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '6px 14px',
                            borderRadius: 999,
                            background: t.superficie,
                            border: `1px solid ${t.borde}`,
                            color: t.primario,
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        Full-Stack Lead Developer
                    </span>
                    <p
                        style={{
                            maxWidth: 620,
                            margin: '18px auto 6px',
                            fontSize: movil ? 17 : 20,
                            lineHeight: 1.5,
                            color: modo === 'dia' ? '#14231c' : '#eef4f0',
                        }}
                    >
                        Lidero equipos y construyo productos web/móviles escalables con foco en
                        rendimiento, arquitectura y resultados de negocio
                    </p>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            color: modo === 'dia' ? '#34443c' : '#c9d6cf',
                        }}
                    >
                        Caracas, Venezuela · Remoto
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            justifyContent: 'center',
                            marginTop: 24,
                            flexWrap: 'wrap',
                        }}
                    >
                        <a
                            href="#cv"
                            style={{
                                padding: '12px 22px',
                                borderRadius: 12,
                                background: t.primario,
                                color: t.sobrePrimario,
                                fontWeight: 700,
                                textDecoration: 'none',
                            }}
                        >
                            Descargar CV
                        </a>
                        <a
                            href="#contacto"
                            style={{
                                padding: '12px 22px',
                                borderRadius: 12,
                                background: t.superficie,
                                border: `1px solid ${t.borde}`,
                                color: t.texto,
                                fontWeight: 700,
                                textDecoration: 'none',
                            }}
                        >
                            Contactar
                        </a>
                    </div>
                </section>

                {/* Panel de contenido */}
                <div
                    style={{
                        background: t.superficie,
                        border: `1px solid ${t.borde}`,
                        borderRadius: 20,
                        padding: movil ? 20 : 36,
                        backdropFilter: 'blur(10px)',
                        display: 'grid',
                        gap: 40,
                    }}
                >
                    {/* Impacto */}
                    <section
                        style={{
                            display: 'grid',
                            gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(4, 1fr)',
                            gap: 16,
                        }}
                    >
                        {cifras.map((c) => (
                            <a
                                key={c.etiqueta}
                                href="#respaldo"
                                style={{ color: 'inherit', textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        ...display,
                                        fontSize: movil ? 36 : 48,
                                        color: t.primario,
                                        lineHeight: 1,
                                    }}
                                >
                                    {c.valor}
                                </div>
                                <div style={{ fontSize: 14, marginTop: 6 }}>{c.etiqueta}</div>
                                <div style={{ fontSize: 12, color: t.acento, marginTop: 2 }}>
                                    → {c.respaldo}
                                </div>
                            </a>
                        ))}
                    </section>

                    {/* Experiencia */}
                    <section>
                        <h2 style={{ ...display, fontSize: movil ? 28 : 36, margin: '0 0 16px' }}>
                            Experiencia
                        </h2>
                        <div style={{ borderLeft: `3px solid ${t.primario}`, paddingLeft: 18 }}>
                            <div style={{ fontSize: 13, color: t.acento, fontWeight: 700 }}>
                                Oct 2022 – Presente
                            </div>
                            <div style={{ ...display, fontSize: movil ? 20 : 24, marginTop: 4 }}>
                                Lead Developer · CORE Care and Health Systems
                            </div>
                            <p style={{ margin: '8px 0 0', color: t.suave, lineHeight: 1.55 }}>
                                Mentoricé a un equipo de 10 devs aumentando productividad en 60%.
                                Facilité workshops logrando 100% entregas a tiempo y satisfacción
                                del cliente.
                            </p>
                        </div>
                    </section>

                    {/* Proyecto destacado */}
                    <section>
                        <h2 style={{ ...display, fontSize: movil ? 28 : 36, margin: '0 0 16px' }}>
                            Proyectos destacados
                        </h2>
                        <article
                            style={{
                                border: `1px solid ${t.borde}`,
                                borderRadius: 16,
                                padding: 20,
                                background:
                                    modo === 'dia'
                                        ? 'rgba(255,255,255,0.6)'
                                        : 'rgba(255,255,255,0.04)',
                            }}
                        >
                            <div style={{ fontSize: 13, color: t.suave }}>
                                XHype · Ago 2025 – Abr 2026
                            </div>
                            <h3
                                style={{
                                    ...display,
                                    fontSize: movil ? 24 : 30,
                                    margin: '4px 0 8px',
                                }}
                            >
                                SuperWallet
                            </h3>
                            <p style={{ margin: 0, lineHeight: 1.55 }}>
                                Producto transaccional orientado a operaciones de booking y pagos,
                                con foco en rendimiento, confiabilidad y experiencia fluida.
                            </p>
                            <div
                                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}
                            >
                                {['React', 'TypeScript', 'Prisma', 'Nest'].map((x) => (
                                    <span
                                        key={x}
                                        style={{
                                            fontSize: 12,
                                            padding: '3px 10px',
                                            borderRadius: 999,
                                            border: `1px solid ${t.borde}`,
                                            color: t.primario,
                                        }}
                                    >
                                        {x}
                                    </span>
                                ))}
                            </div>
                            <div style={{ marginTop: 14, color: t.acento, fontWeight: 700 }}>
                                Ver caso de estudio →
                            </div>
                        </article>
                    </section>

                    {/* Prueba de palabras largas */}
                    <section>
                        <h2 style={{ ...display, fontSize: movil ? 28 : 36, margin: 0 }}>
                            Desarrollador de aplicaciones multiplataforma
                        </h2>
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: t.suave }}>
                            (Prueba de cortes de línea con palabras largas en español.)
                        </p>
                    </section>
                </div>
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
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    zIndex: 10,
                }}
            >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24' }}>PROTOTIPO · Identidad</strong>
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
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid #fbbf24',
                            background: 'transparent',
                            color: '#fbbf24',
                            cursor: 'pointer',
                        }}
                    >
                        {modo === 'dia' ? '☀ Día' : '☾ Noche'}
                    </button>
                    <button
                        onClick={() => set('ancho', movil ? 'escritorio' : 'movil')}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid #94a3b8',
                            background: 'transparent',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                        }}
                    >
                        {movil ? '📱 360px' : '🖥 Escritorio'}
                    </button>
                </div>
                <code style={{ display: 'block', marginTop: 6, color: '#94a3b8', fontSize: 11 }}>
                    v={v.id} · fuente={v.fuente} {v.ajustes ?? ''} · paleta={paleta.nombre} · modo=
                    {modo} · primario=
                    {t.primario} · contraste CTA={contraste(t.primario, t.sobrePrimario).toFixed(2)}
                    :1
                </code>
            </div>
        </div>
    );
};
