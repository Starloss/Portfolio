// PROTOTIPO DESECHABLE: no es código de producción, no tiene tests.
// Responde al ticket "Página del Caso de estudio y transición Home↔Proyecto".
// Abrir con `pnpm prototype:caso`; ?v=a|b|c (página), ?t=x|y|z (transición), ?modo=dia|noche,
// ?p=superwallet|be|boda abre un Caso de estudio, ?rm=1 simula prefers-reduced-motion.
// La transición usa document.startViewTransition + flushSync directamente: en producción sería
// <ViewTransition> de React ≥19.3 (ver la research de motion), pero el efecto visual es el mismo.

import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';

import { Escena, Modo, TOKENS } from './LayoutHomePrototype';

type T = (typeof TOKENS)['dia'];
type Id = 'superwallet' | 'be' | 'boda';

interface Imagen {
    src: string;
    alt: string;
    vertical?: boolean;
}

interface Caso {
    id: Id;
    titulo: string;
    tipo: string;
    periodo: string;
    rol: string;
    tech: string[];
    enlaces: [string, string][];
    resumen: string;
    contexto: string;
    problema: string;
    decisiones: [string, string][];
    impacto: [string, string][];
    galeria: Imagen[]; // vacía = va el diagrama propio
}

// Contenido aprobado en los tickets de cada Caso de estudio (solo ES para el prototipo).
const CASOS: Caso[] = [
    {
        id: 'superwallet',
        titulo: 'SuperWallet',
        tipo: 'Proyecto de trabajo · XHype',
        periodo: 'Ago 2025 – Abr 2026',
        rol: 'Senior Developer',
        tech: ['React', 'TypeScript', 'Prisma', 'Nest'],
        enlaces: [['Demo', 'https://superwallet.xhype.io']],
        resumen:
            'Billetera cripto para pagar viajes, tarjetas y eSIMs, con integraciones de proveedores de viaje hasta 80% más rápidas.',
        contexto:
            'SuperWallet, de XHype, es una billetera cripto auto-custodiada para gastar cripto en el mundo real: tarjetas, reservas de hoteles y actividades, gift cards y eSIMs, sin pedir datos personales.',
        problema:
            'Integrar proveedores externos de viajes, lentos y heterogéneos, en una experiencia de pago con cripto que se sienta inmediata.',
        decisiones: [
            [
                'Capa de integración de proveedores de viaje',
                'Un modelo propio de hotel/habitación que normaliza a los proveedores, con consultas en paralelo y caché de búsquedas y tarifas. La misma capa se reusó para actividades.',
            ],
            [
                'Menos red entre cliente y servidor',
                'Agregación en el backend para reducir idas y vueltas, respuestas con solo los campos necesarios y caché en el cliente para no volver a pedir lo que ya se tiene.',
            ],
            [
                'Referidos y cupones como piezas de producto',
                'Sistema de referidos por niveles y cupones integrado al flujo de pago, para crecer sin depender solo de adquisición paga.',
            ],
        ],
        impacto: [
            ['−80%', 'tiempo de booking hotelero'],
            ['−90%', 'tiempo de reserva de actividades'],
            ['−70%', 'tráfico cliente-servidor'],
        ],
        galeria: [
            ['1', 'Pantalla de registro de SuperWallet con las tarjetas de XHype'],
            ['2', 'Billetera con balance en USDT y tokens soportados'],
            ['4', 'Selección de plan de tarjeta: Lite, Essential, Premium, LifeTime y Whale'],
            ['5', 'Buscador de hoteles con pago en cripto'],
            ['6', 'Resultados de hoteles en Madrid con precios en USDT'],
            ['7', 'Detalle de un hotel con galería de fotos'],
            ['13', 'Catálogo de planes de eSIM por región'],
            ['14', 'Panel del programa de referidos'],
        ].map(([n, alt]) => ({ src: `/projects/superwallet-${n}.jpg`, alt })),
    },
    {
        id: 'be',
        titulo: 'BE - Booking Engine',
        tipo: 'Proyecto de trabajo · CORE Care and Health Systems',
        periodo: 'Oct 2022 – en curso',
        rol: 'Tech Lead / Full-Stack Lead Developer',
        tech: ['React', 'TypeScript', 'Python', 'Django', 'AWS'],
        enlaces: [],
        resumen:
            'Plataforma interna para coordinar interpretación médica en EE.UU., de la reserva a la facturación.',
        contexto:
            'CORE coordina servicios de interpretación médica certificada para pacientes de compensación laboral (workers’ compensation) en EE.UU. BE es la plataforma interna donde los operadores agendan citas, asignan intérpretes, gestionan clínicas, médicos y aseguradoras, y siguen cada caso desde la reserva hasta la facturación.',
        problema:
            'Un volumen alto de reservas con muchos actores por cita, donde un dato faltante (pagador, intérprete, reporte) frena el cobro.',
        decisiones: [
            [
                'Alertas de datos faltantes',
                'Cada reserva marca qué le falta (caso, pagador, intérprete, seguimiento, reporte) y los operadores pueden filtrar por eso. Convierte los bloqueos de cobro en una lista de trabajo visible en vez de descubrirlos al facturar.',
            ],
            [
                'Vista dual lista/calendario',
                'La misma fuente de datos en tabla operativa (para depurar y exportar) y en agenda semanal (para detectar choques y huecos de intérpretes).',
            ],
            [
                'Timeline de reclamos',
                'Las reservas se agrupan por caso de compensación con su historial de estados, para ver el recorrido completo de un paciente sin saltar entre registros.',
            ],
            [
                'Búsqueda global de notas con etiquetas',
                'Un buscador transversal con etiquetas acordadas (#NoShow, #DobleAgendado, #Rescheduled…) que convierte notas libres en información consultable.',
            ],
        ],
        impacto: [
            ['10+', 'devs liderados'],
            ['+36.000', 'reservas gestionadas en la plataforma'],
        ],
        galeria: [],
    },
    {
        id: 'boda',
        titulo: 'Invitación de Boda',
        tipo: 'Proyecto personal',
        periodo: 'Mar 2026',
        rol: 'Full-Stack Developer',
        tech: ['Astro', 'TypeScript', 'Firebase', 'Firestore', 'Cloud Functions', 'Vercel'],
        enlaces: [
            ['Demo', 'https://wedding-invitation-seven-brown.vercel.app'],
            ['Repositorio', 'https://github.com/Starloss/wedding-invitation'],
        ],
        resumen:
            'Invitación de boda interactiva con RSVP por código y fotos de los invitados, construida y desplegada en 1 semana.',
        contexto:
            'Una invitación web hecha para una boda real, que después convertí en una plantilla reutilizable con modo demo.',
        problema:
            'Confirmar asistencia por grupo con cupos limitados sin pedir cuentas a los invitados, y reunir en un solo lugar fotos y canciones del evento, todo en una semana.',
        decisiones: [
            [
                'RSVP por token, sin login',
                'Cada invitación lleva un código único que valida al grupo y su cupo en Firestore: los invitados confirman sin crear cuentas y el anfitrión controla cuántos asisten.',
            ],
            [
                'Astro mobile-first',
                'Casi todos abren el enlace desde el celular: sitio mayormente estático, con interactividad solo en la cuenta regresiva, el RSVP y la galería, para que cargue rápido.',
            ],
            [
                'Seguridad en reglas de Firebase',
                'Sin backend propio: las reglas de Firestore y Storage definen quién puede leer, confirmar o subir fotos. Permitió salir a producción en una semana sin un servidor que mantener.',
            ],
            [
                'Cloud Functions para automatizar',
                'Envío de invitaciones y recordatorios programados, para no perseguir confirmaciones a mano.',
            ],
        ],
        impacto: [['1 semana', 'diseñada, implementada y desplegada']],
        galeria: (
            [
                ['11', 'Portada de la invitación en escritorio', false],
                ['1', 'Portada de la invitación en móvil', true],
                ['3', 'Día, lugar y dirección del evento en móvil', true],
                ['4', 'Confirmación de asistencia con código de invitación', true],
                ['13', 'Galería de retratos de la pareja', false],
                ['8', 'Código QR para que los invitados suban fotos', true],
                ['18', 'Panel del anfitrión con invitaciones y confirmaciones', false],
                ['19', 'Formulario para crear una invitación con cupos', false],
            ] as [string, string, boolean][]
        ).map(([n, alt, vertical]) => ({
            src: `/projects/wedding-invitation-${n}.jpg`,
            alt,
            vertical,
        })),
    },
];

const VARIANTES = [
    {
        id: 'a',
        nombre: 'A · Editorial',
        idea: 'Una columna de lectura en un bloque: portada, contexto, decisiones numeradas, cifras de impacto y galería en cuadrícula al final.',
    },
    {
        id: 'b',
        nombre: 'B · Ficha lateral',
        idea: 'Dos columnas en escritorio: a la izquierda una ficha fija con rol, período, tech, enlaces, impacto e índice; a la derecha el relato y la galería. En móvil la ficha va arriba.',
    },
    {
        id: 'c',
        nombre: 'C · Galería primero',
        idea: 'Abre con un carrusel grande de capturas, sigue una franja de impacto como la del Home y el relato va en tarjetas.',
    },
] as const;

const TRANSICIONES = [
    {
        id: 'x',
        nombre: 'X · Morph de tarjeta',
        idea: 'La imagen y el título de la tarjeta se transforman en la portada y el título del Caso de estudio; el resto aparece con un fundido. La Escena no se mueve.',
    },
    {
        id: 'y',
        nombre: 'Y · Subida',
        idea: 'La página nueva sube desde abajo mientras la anterior se desvanece, como la cabina del Teleférico. La Escena no se mueve.',
    },
    {
        id: 'z',
        nombre: 'Z · Fundido',
        idea: 'Fundido cruzado corto entre páginas. Lo mínimo.',
    },
] as const;

// CSS de las view transitions por variante de transición.
const CSS_TRANSICION: Record<string, string> = {
    x: `
::view-transition-group(*) { animation-duration: 420ms; animation-timing-function: cubic-bezier(.2,.8,.2,1); }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 220ms; }
`,
    y: `
@keyframes ce-sube { from { transform: translateY(60px); opacity: 0; } }
@keyframes ce-baja { to { opacity: 0; } }
::view-transition-new(root) { animation: ce-sube 420ms cubic-bezier(.2,.8,.2,1) both; }
::view-transition-old(root) { animation: ce-baja 200ms ease both; }
`,
    z: `
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 200ms; }
`,
};

const fuente = "'Space Grotesk', system-ui, sans-serif";
const h = (t: T, size = 26): React.CSSProperties => ({
    fontFamily: fuente,
    fontWeight: 700,
    fontSize: size,
    margin: '0 0 12px',
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
const bloque = (t: T, ancho = 860): React.CSSProperties => ({
    width: `min(${ancho}px, calc(100% - 32px))`,
    margin: '0 auto 28px',
    padding: 24,
    borderRadius: 20,
    background: t.superficie,
    backdropFilter: 'blur(6px)',
    border: `1px solid ${t.borde}`,
    boxSizing: 'border-box',
    color: t.texto,
});
const boton = (t: T, primario: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    background: primario ? t.primario : 'transparent',
    color: primario ? t.sobrePrimario : t.texto,
    border: `1.5px solid ${primario ? t.primario : t.borde}`,
    marginRight: 8,
});

// Diagrama propio de BE: el ciclo de una reserva, sin nada de CORE.
const DiagramaBE: React.FC<{ t: T; nombre?: string }> = ({ t, nombre }) => {
    const pasos = ['Reserva', 'Asignación de intérprete', 'Servicio', 'Reporte', 'Facturación'];
    return (
        <div
            role="img"
            aria-label="Ciclo de una reserva: reserva, asignación de intérprete, servicio, reporte y facturación"
            style={{
                aspectRatio: '16/9',
                borderRadius: 14,
                background: t.opaca,
                border: `1px solid ${t.borde}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 8,
                padding: 16,
                boxSizing: 'border-box',
                viewTransitionName: nombre,
            }}
        >
            {pasos.map((p, i) => (
                <React.Fragment key={p}>
                    <span
                        style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: t.primario,
                            color: t.sobrePrimario,
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        {p}
                    </span>
                    {i < pasos.length - 1 && <span style={{ color: t.acento }}>→</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

const Portada: React.FC<{ c: Caso; t: T; morph: boolean }> = ({ c, t, morph }) =>
    c.galeria.length ? (
        <img
            src={c.galeria[0].src}
            alt={c.galeria[0].alt}
            style={{
                width: '100%',
                aspectRatio: '16/9',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: 14,
                display: 'block',
                viewTransitionName: morph ? `portada-${c.id}` : undefined,
            }}
        />
    ) : (
        <DiagramaBE t={t} nombre={morph ? `portada-${c.id}` : undefined} />
    );

const Galeria: React.FC<{ c: Caso; t: T; abrir: (i: number) => void }> = ({ c, t, abrir }) =>
    c.galeria.length ? (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gridAutoFlow: 'dense',
                gap: 10,
            }}
        >
            {c.galeria.map((img, i) => (
                <button
                    key={img.src}
                    onClick={() => abrir(i)}
                    style={{
                        padding: 0,
                        border: `1px solid ${t.borde}`,
                        borderRadius: 10,
                        overflow: 'hidden',
                        cursor: 'zoom-in',
                        background: 'transparent',
                        gridColumn: img.vertical ? 'span 1' : 'span 2',
                        gridRow: img.vertical ? 'span 2' : 'span 1',
                    }}
                >
                    <img
                        src={img.src}
                        alt={img.alt}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top',
                            display: 'block',
                            aspectRatio: img.vertical ? undefined : '2/1',
                        }}
                    />
                </button>
            ))}
        </div>
    ) : (
        <p style={{ color: t.suave, margin: 0 }}>
            Sin capturas: el sistema es interno. El diagrama de arriba resume el ciclo.
        </p>
    );

const Decisiones: React.FC<{ c: Caso; t: T; tarjetas?: boolean }> = ({ c, t, tarjetas }) => (
    <ol
        style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 14,
            gridTemplateColumns: tarjetas ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
        }}
    >
        {c.decisiones.map(([titulo, texto], i) => (
            <li
                key={titulo}
                style={{
                    display: 'flex',
                    gap: 12,
                    padding: tarjetas ? 16 : 0,
                    borderRadius: 14,
                    border: tarjetas ? `1px solid ${t.borde}` : 'none',
                }}
            >
                <span
                    style={{ fontFamily: fuente, fontWeight: 700, fontSize: 22, color: t.acento }}
                >
                    {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{titulo}</div>
                    <p
                        style={{
                            margin: '4px 0 0',
                            color: t.suave,
                            fontSize: 15,
                            lineHeight: 1.55,
                        }}
                    >
                        {texto}
                    </p>
                </div>
            </li>
        ))}
    </ol>
);

const Impacto: React.FC<{ c: Caso; t: T; columna?: boolean }> = ({ c, t, columna }) => (
    <div
        style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: columna ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
        }}
    >
        {c.impacto.map(([valor, texto]) => (
            <div
                key={valor}
                style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${t.borde}` }}
            >
                <div
                    style={{ fontFamily: fuente, fontWeight: 700, fontSize: 30, color: t.primario }}
                >
                    {valor}
                </div>
                <div style={{ fontSize: 14 }}>{texto}</div>
            </div>
        ))}
    </div>
);

const Encabezado: React.FC<{ c: Caso; t: T; morph: boolean; volver: () => void }> = ({
    c,
    t,
    morph,
    volver,
}) => (
    <>
        <button
            onClick={volver}
            style={{
                ...boton(t, false),
                border: 'none',
                padding: '0 0 12px',
                color: t.primario,
            }}
        >
            ← Proyectos
        </button>
        <div style={{ fontSize: 13, color: t.acento }}>{c.tipo}</div>
        <h1
            style={{
                ...h(t, 40),
                margin: '2px 0 8px',
                viewTransitionName: morph ? `titulo-${c.id}` : undefined,
                width: 'fit-content',
            }}
        >
            {c.titulo}
        </h1>
        <p style={{ fontSize: 18, margin: '0 0 12px', lineHeight: 1.5 }}>{c.resumen}</p>
    </>
);

const Meta: React.FC<{ c: Caso; t: T }> = ({ c, t }) => (
    <>
        <div style={{ fontSize: 14, color: t.suave, marginBottom: 8 }}>
            {c.periodo} · {c.rol}
        </div>
        <div style={{ marginBottom: 10 }}>
            {c.tech.map((x) => (
                <span key={x} style={chip(t)}>
                    {x}
                </span>
            ))}
        </div>
        {c.enlaces.map(([label, url], i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" style={boton(t, i === 0)}>
                {label} ↗
            </a>
        ))}
    </>
);

const Relato: React.FC<{ c: Caso; t: T }> = ({ c, t }) => (
    <>
        <h2 style={h(t)}>Contexto</h2>
        <p style={{ lineHeight: 1.6, margin: '0 0 8px' }}>{c.contexto}</p>
        <p style={{ lineHeight: 1.6, margin: 0 }}>
            <strong>Problema:</strong> {c.problema}
        </p>
    </>
);

const Siguiente: React.FC<{ c: Caso; t: T; ir: (id: Id) => void }> = ({ c, t, ir }) => {
    const i = CASOS.findIndex((x) => x.id === c.id);
    const ant = CASOS[(i + CASOS.length - 1) % CASOS.length];
    const sig = CASOS[(i + 1) % CASOS.length];
    return (
        <nav
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
        >
            <button onClick={() => ir(ant.id)} style={boton(t, false)}>
                ← {ant.titulo}
            </button>
            <button onClick={() => ir(sig.id)} style={boton(t, true)}>
                {sig.titulo} →
            </button>
        </nav>
    );
};

const Lightbox: React.FC<{ c: Caso; i: number; set: (i: number | null) => void }> = ({
    c,
    i,
    set,
}) => {
    const n = c.galeria.length;
    useEffect(() => {
        const k = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') set(null);
            if (e.key === 'ArrowRight') set((i + 1) % n);
            if (e.key === 'ArrowLeft') set((i + n - 1) % n);
        };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [i, n, set]);
    const img = c.galeria[i];
    const flecha: React.CSSProperties = {
        background: 'rgba(255,255,255,0.15)',
        color: '#fff',
        border: 'none',
        borderRadius: 999,
        width: 44,
        height: 44,
        fontSize: 20,
        cursor: 'pointer',
    };
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={img.alt}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 20,
                background: 'rgba(3,8,12,0.88)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 16,
            }}
        >
            <img
                src={img.src}
                alt={img.alt}
                style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 10 }}
            />
            <div style={{ color: '#e2e8f0', fontSize: 14, textAlign: 'center' }}>
                {img.alt} · {i + 1}/{n}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button style={flecha} onClick={() => set((i + n - 1) % n)} aria-label="Anterior">
                    ←
                </button>
                <button style={flecha} onClick={() => set(null)} aria-label="Cerrar">
                    ✕
                </button>
                <button style={flecha} onClick={() => set((i + 1) % n)} aria-label="Siguiente">
                    →
                </button>
            </div>
        </div>
    );
};

const Carrusel: React.FC<{ c: Caso; t: T; morph: boolean }> = ({ c, t, morph }) => {
    const [i, setI] = useState(0);
    if (!c.galeria.length)
        return <DiagramaBE t={t} nombre={morph ? `portada-${c.id}` : undefined} />;
    const img = c.galeria[i];
    return (
        <div>
            <div
                style={{
                    position: 'relative',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#000',
                    aspectRatio: '16/9',
                    viewTransitionName: morph && i === 0 ? `portada-${c.id}` : undefined,
                }}
            >
                <img
                    src={img.src}
                    alt={img.alt}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                    }}
                />
                {(['←', '→'] as const).map((f, k) => (
                    <button
                        key={f}
                        aria-label={k ? 'Siguiente' : 'Anterior'}
                        onClick={() =>
                            setI((i + (k ? 1 : c.galeria.length - 1)) % c.galeria.length)
                        }
                        style={{
                            position: 'absolute',
                            top: '50%',
                            [k ? 'right' : 'left']: 10,
                            transform: 'translateY(-50%)',
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            border: 'none',
                            background: 'rgba(255,255,255,0.85)',
                            cursor: 'pointer',
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div style={{ fontSize: 13, color: t.suave, margin: '8px 0' }}>
                {img.alt} · {i + 1}/{c.galeria.length}
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {c.galeria.map((g, k) => (
                    <button
                        key={g.src}
                        onClick={() => setI(k)}
                        aria-label={g.alt}
                        style={{
                            flex: '0 0 auto',
                            padding: 0,
                            border: `2px solid ${k === i ? t.primario : 'transparent'}`,
                            borderRadius: 8,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            background: 'transparent',
                        }}
                    >
                        <img
                            src={g.src}
                            alt=""
                            style={{ height: 48, display: 'block', objectFit: 'cover' }}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

// ---------- Páginas ----------

interface Props {
    c: Caso;
    t: T;
    morph: boolean;
    volver: () => void;
    ir: (id: Id) => void;
    abrir: (i: number) => void;
}

const PaginaA: React.FC<Props> = ({ c, t, morph, volver, ir, abrir }) => (
    <article style={bloque(t)}>
        <Encabezado c={c} t={t} morph={morph} volver={volver} />
        <Meta c={c} t={t} />
        <div style={{ margin: '20px 0 28px' }}>
            <Portada c={c} t={t} morph={morph} />
        </div>
        <Relato c={c} t={t} />
        <h2 style={{ ...h(t), marginTop: 28 }}>Decisiones clave</h2>
        <Decisiones c={c} t={t} />
        <h2 style={{ ...h(t), marginTop: 28 }}>Impacto</h2>
        <Impacto c={c} t={t} />
        <h2 style={{ ...h(t), marginTop: 28 }}>Galería</h2>
        <Galeria c={c} t={t} abrir={abrir} />
        <hr style={{ border: 'none', borderTop: `1px solid ${t.borde}`, margin: '28px 0 16px' }} />
        <Siguiente c={c} t={t} ir={ir} />
    </article>
);

const PaginaB: React.FC<Props> = ({ c, t, morph, volver, ir, abrir }) => {
    const [ancho, setAncho] = useState(window.innerWidth);
    useEffect(() => {
        const r = () => setAncho(window.innerWidth);
        window.addEventListener('resize', r);
        return () => window.removeEventListener('resize', r);
    }, []);
    const dos = ancho >= 900;
    return (
        <article
            style={{
                ...bloque(t, 1120),
                display: 'grid',
                gridTemplateColumns: dos ? '300px 1fr' : '1fr',
                gap: 32,
                alignItems: 'start',
            }}
        >
            <aside style={{ position: dos ? 'sticky' : 'static', top: 24 }}>
                <Encabezado c={c} t={t} morph={morph} volver={volver} />
                <Meta c={c} t={t} />
                <h2 style={{ ...h(t, 18), marginTop: 20 }}>Impacto</h2>
                <Impacto c={c} t={t} columna />
                {dos && (
                    <nav style={{ marginTop: 20, fontSize: 14, display: 'grid', gap: 6 }}>
                        {['Contexto', 'Decisiones clave', 'Galería'].map((s) => (
                            <a key={s} href="#top" style={{ color: t.primario }}>
                                {s}
                            </a>
                        ))}
                    </nav>
                )}
            </aside>
            <div>
                <Portada c={c} t={t} morph={morph} />
                <div style={{ height: 24 }} />
                <Relato c={c} t={t} />
                <h2 style={{ ...h(t), marginTop: 28 }}>Decisiones clave</h2>
                <Decisiones c={c} t={t} />
                <h2 style={{ ...h(t), marginTop: 28 }}>Galería</h2>
                <Galeria c={c} t={t} abrir={abrir} />
                <hr
                    style={{
                        border: 'none',
                        borderTop: `1px solid ${t.borde}`,
                        margin: '28px 0 16px',
                    }}
                />
                <Siguiente c={c} t={t} ir={ir} />
            </div>
        </article>
    );
};

const PaginaC: React.FC<Props> = ({ c, t, morph, volver, ir }) => (
    <>
        <article style={bloque(t, 1120)}>
            <Encabezado c={c} t={t} morph={morph} volver={volver} />
            <Carrusel c={c} t={t} morph={morph} />
            <div style={{ marginTop: 16 }}>
                <Meta c={c} t={t} />
            </div>
        </article>
        <section style={bloque(t, 1120)}>
            <h2 style={h(t)}>Impacto</h2>
            <Impacto c={c} t={t} />
        </section>
        <section style={bloque(t, 1120)}>
            <Relato c={c} t={t} />
            <h2 style={{ ...h(t), marginTop: 28 }}>Decisiones clave</h2>
            <Decisiones c={c} t={t} tarjetas />
            <hr
                style={{ border: 'none', borderTop: `1px solid ${t.borde}`, margin: '28px 0 16px' }}
            />
            <Siguiente c={c} t={t} ir={ir} />
        </section>
    </>
);

// ---------- Home simplificado: solo el bloque de Proyectos destacados ----------

const Proyectos: React.FC<{ t: T; modo: Modo; morph: boolean; ir: (id: Id) => void }> = ({
    t,
    modo,
    morph,
    ir,
}) => (
    <section style={{ ...bloque(t), marginTop: '30vh' }}>
        <h2 style={h(t, 30)}>Proyectos destacados</h2>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
            }}
        >
            {CASOS.map((c) => (
                <button
                    key={c.id}
                    onClick={() => ir(c.id)}
                    style={{
                        textAlign: 'left',
                        padding: 0,
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: `1px solid ${t.borde}`,
                        background: modo === 'dia' ? '#ffffff' : '#0f1d29',
                        color: t.texto,
                        cursor: 'pointer',
                        font: 'inherit',
                    }}
                >
                    {c.galeria.length ? (
                        <img
                            src={c.galeria[0].src}
                            alt=""
                            style={{
                                width: '100%',
                                aspectRatio: '16/10',
                                objectFit: 'cover',
                                objectPosition: 'top',
                                display: 'block',
                                viewTransitionName: morph ? `portada-${c.id}` : undefined,
                            }}
                        />
                    ) : (
                        <div style={{ aspectRatio: '16/10' }}>
                            <DiagramaBE t={t} nombre={morph ? `portada-${c.id}` : undefined} />
                        </div>
                    )}
                    <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 12, color: t.acento }}>{c.tipo}</div>
                        <div
                            style={{
                                fontFamily: fuente,
                                fontWeight: 700,
                                fontSize: 20,
                                width: 'fit-content',
                                viewTransitionName: morph ? `titulo-${c.id}` : undefined,
                            }}
                        >
                            {c.titulo}
                        </div>
                        <p style={{ fontSize: 14, margin: '6px 0 0', color: t.suave }}>
                            {c.resumen}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    </section>
);

// ---------- Prototipo ----------

export const CasoEstudioPrototype: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const v = VARIANTES.find((x) => x.id === params.get('v')) ?? VARIANTES[0];
    const tr = TRANSICIONES.find((x) => x.id === params.get('t')) ?? TRANSICIONES[0];
    const modo: Modo = params.get('modo') === 'noche' ? 'noche' : 'dia';
    const rm = params.get('rm') === '1';
    const t = TOKENS[modo];
    const caso = CASOS.find((c) => c.id === params.get('p'));
    const [foto, setFoto] = useState<number | null>(null);
    const [ultima, setUltima] = useState('—');

    useEffect(() => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap';
        document.head.appendChild(l);
        return () => l.remove();
    }, []);

    const set = (cambios: Record<string, string | null>) => {
        const next = new window.URLSearchParams(params);
        for (const [k, val] of Object.entries(cambios)) {
            if (val === null) next.delete(k);
            else next.set(k, val);
        }
        setParams(next, { replace: true });
    };

    // Navegación entre Home y Caso de estudio, con view transition si hay soporte y no hay rm.
    const navegar = (p: Id | null) => {
        const aplicar = () => {
            flushSync(() => {
                setFoto(null);
                set({ p });
            });
            window.scrollTo(0, 0);
        };
        const d = document as typeof window.document & {
            startViewTransition?: (cb: () => void) => unknown;
        };
        if (rm || !d.startViewTransition) {
            setUltima(
                rm ? 'sin animación (reduced motion)' : 'sin animación (navegador sin soporte)',
            );
            aplicar();
            return;
        }
        setUltima(`${tr.nombre} → ${p ?? 'home'}`);
        d.startViewTransition(aplicar);
    };

    const morph = tr.id === 'x' && !rm;
    const props = caso && {
        c: caso,
        t,
        morph,
        volver: () => navegar(null),
        ir: (id: Id) => navegar(id),
        abrir: (i: number) => setFoto(i),
    };

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif' }}>
            <style>{CSS_TRANSICION[tr.id]}</style>
            {/* La Escena queda fija y con nombre propio, así no participa del fundido */}
            <div style={{ position: 'fixed', inset: 0, viewTransitionName: 'escena' }}>
                <Escena modo={modo} alt={1} />
            </div>
            <main style={{ position: 'relative', padding: '24px 0 200px' }}>
                {props ? (
                    v.id === 'a' ? (
                        <PaginaA {...props} />
                    ) : v.id === 'b' ? (
                        <PaginaB {...props} />
                    ) : (
                        <PaginaC {...props} />
                    )
                ) : (
                    <Proyectos t={t} modo={modo} morph={morph} ir={(id) => navegar(id)} />
                )}
            </main>
            {caso && foto !== null && <Lightbox c={caso} i={foto} set={setFoto} />}

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
                    zIndex: 30,
                    viewTransitionName: 'barra',
                }}
            >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24' }}>PROTOTIPO · Caso de estudio</strong>
                    <span style={{ color: '#94a3b8' }}>Página:</span>
                    {VARIANTES.map((x) => (
                        <button
                            key={x.id}
                            onClick={() => set({ v: x.id })}
                            style={pill(x.id === v.id)}
                        >
                            {x.nombre}
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
                    <span style={{ color: '#94a3b8' }}>Transición:</span>
                    {TRANSICIONES.map((x) => (
                        <button
                            key={x.id}
                            onClick={() => set({ t: x.id })}
                            style={pill(x.id === tr.id)}
                        >
                            {x.nombre}
                        </button>
                    ))}
                    <button
                        onClick={() => set({ modo: modo === 'dia' ? 'noche' : 'dia' })}
                        style={pill(false, true)}
                    >
                        {modo === 'dia' ? '☀ Día' : '☾ Noche'}
                    </button>
                    <button onClick={() => set({ rm: rm ? '0' : '1' })} style={pill(false, true)}>
                        {rm ? '⏸ Reduced motion' : '▶ Con movimiento'}
                    </button>
                </div>
                <div style={{ marginTop: 6, color: '#cbd5e1' }}>
                    {v.idea} <span style={{ color: '#94a3b8' }}>· {tr.idea}</span>
                </div>
                <code style={{ display: 'block', marginTop: 4, color: '#94a3b8', fontSize: 11 }}>
                    vista={caso ? caso.id : 'home'} · página={v.id} · transición={tr.id} · modo=
                    {modo} · rm={String(rm)} · última navegación: {ultima}
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
