import React, { useLayoutEffect, useRef, useState } from 'react';
import { m, useScroll, useTransform, type MotionStyle, type MotionValue } from 'motion/react';
import { useMediaQuery, usePrefersReducedMotion } from '@lib/motion';
import { useTheme } from '@lib/theme';

import {
    cabinPoint,
    CAMERA_JOURNEY,
    cloudsAt,
    HERO_HEIGHT,
    layerShift,
    MOON_SIZE,
    moonPosition,
    mountainSink,
    sceneFrame,
    toScreen,
    type SceneFrame,
    type TextColumn,
    type Viewport,
} from './camera';
import { useDocumentHidden, useElementViewport, useSceneCovered } from './environment';
import { skyline } from './geometry';
import { DAY, NIGHT, NIGHT_LIGHTS, paletteVars, VARS } from './palette';
import { Avila, CabinShape, City, FarRidge, HaloGradient, Macaws, Stars, Towers } from './parts';
import './scene.css';

const MOBILE_QUERY = '(max-width: 767px)';

// Cuánto se oscurece el cielo arriba de todo con la cámara sobre las nubes; poco, para que el
// texto del Hero siga contrastando.
export const SKY_DARKENING = 0.3;
export const CABIN_WIDTH = 12;

type StyledPart = 'farRidge' | 'avila' | 'city' | 'towers' | 'clouds' | 'skyHigh' | 'cabin';
type PartStyles = Record<StyledPart, MotionStyle>;

const px = (n: number) => `${n.toFixed(1)}px`;

/** Estilos de cada capa con la cámara a una altura dada, como valores de CSS. */
function stylesAt(height: number, sink: number, viewport: Viewport, frame: SceneFrame) {
    const shift = (layer: 'farRidge' | 'avila' | 'city' | 'towers') =>
        `translateY(${px(layerShift(layer, height, viewport.height, sink))})`;
    const clouds = cloudsAt(height, viewport.height);
    const cabin = cabinPoint(height);
    const cabinOnScreen = toScreen(frame, cabin.x, cabin.y);
    return {
        farRidge: shift('farRidge'),
        avila: shift('avila'),
        city: shift('city'),
        towers: shift('towers'),
        clouds: `translateY(${px(clouds.y)})`,
        cloudsOpacity: clouds.opacity,
        skyHigh: height * SKY_DARKENING,
        cabin: `translate(${px(cabinOnScreen.x - (CABIN_WIDTH / 2) * frame.scale)}, ${px(cabinOnScreen.y)})`,
    };
}

function toPartStyles(s: {
    [K in keyof ReturnType<typeof stylesAt>]: ReturnType<typeof stylesAt>[K] | MotionValue;
}): PartStyles {
    return {
        farRidge: { transform: s.farRidge },
        avila: { transform: s.avila },
        city: { transform: s.city },
        towers: { transform: s.towers },
        clouds: { transform: s.clouds, opacity: s.cloudsOpacity },
        skyHigh: { opacity: s.skyHigh },
        cabin: { transform: s.cabin },
    };
}

// Cada capa liga solo transform (como string) u opacity al progreso de scroll de la página, con
// rangos fijos: así motion puede pasar el movimiento al compositor. Los valores se fijan al montar,
// por eso este componente se vuelve a montar si cambia el tamaño de la Escena o el hundimiento.
const journey = CAMERA_JOURNEY;

const JourneyStyles: React.FC<{
    sink: number;
    viewport: Viewport;
    frame: SceneFrame;
    children: (styles: PartStyles) => React.ReactNode;
}> = ({ sink, viewport, frame, children }) => {
    const { scrollYProgress } = useScroll();
    const frames = journey.height.map((h) => stylesAt(h, sink, viewport, frame));
    const values = <K extends keyof (typeof frames)[number]>(key: K) => frames.map((f) => f[key]);
    const styles = toPartStyles({
        farRidge: useTransform(scrollYProgress, journey.progress, values('farRidge')),
        avila: useTransform(scrollYProgress, journey.progress, values('avila')),
        city: useTransform(scrollYProgress, journey.progress, values('city')),
        towers: useTransform(scrollYProgress, journey.progress, values('towers')),
        clouds: useTransform(scrollYProgress, journey.progress, values('clouds')),
        cloudsOpacity: useTransform(scrollYProgress, journey.progress, values('cloudsOpacity')),
        skyHigh: useTransform(scrollYProgress, journey.progress, values('skyHigh')),
        cabin: useTransform(scrollYProgress, journey.progress, values('cabin')),
    });
    return <>{children(styles)}</>;
};

export interface PageLayout {
    column: TextColumn | null;
    headerBottom: number;
}

// Mide en coordenadas del documento la columna de texto del Hero hasta la línea de ubicación y el
// borde inferior de la cabecera: de ellos dependen el hundimiento de la montaña y la luna.
function measurePage(): PageLayout {
    const y = window.scrollY;
    const text = document.querySelector('[data-hero-text]')?.getBoundingClientRect();
    const header = document.querySelector('header')?.getBoundingClientRect();
    return {
        column:
            text && text.width > 0
                ? { left: text.left, right: text.right, top: text.top + y, bottom: text.bottom + y }
                : null,
        headerBottom: header ? header.bottom + y : 0,
    };
}

const samePage = (a: PageLayout | null, b: PageLayout) => JSON.stringify(a) === JSON.stringify(b);

export function usePageLayout(enabled: boolean, viewport: Viewport): PageLayout | null {
    const [page, setPage] = useState<PageLayout | null>(null);
    useLayoutEffect(() => {
        if (!enabled) return;
        const update = () => {
            const next = measurePage();
            // Medir antes del pintado es el punto: con un estado derivado en el render, la
            // Escena se dibujaría un cuadro sin la columna de texto y saltaría.
            // eslint-disable-next-line @eslint-react/set-state-in-effect
            setPage((prev) => (samePage(prev, next) ? prev : next));
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(update);
        observer.observe(document.body);
        return () => observer.disconnect();
    }, [enabled, viewport.width, viewport.height]);
    return enabled ? page : null;
}

export const CLOUDS = [
    { left: 8, top: 20, width: 28, drift: 6 },
    { left: 55, top: 12, width: 34, drift: -5 },
    { left: 30, top: 45, width: 40, drift: 4 },
];

/**
 * La Escena de Caracas detrás del contenido. Sin `height`, hace el Viaje de cámara con el
 * scroll de la página (Home), o queda en el encuadre del Hero con reduced-motion; con `height`,
 * queda fija a esa altura (Caso de estudio).
 */
export const Scene: React.FC<{ height?: number }> = ({ height }) => {
    const { theme } = useTheme();
    const night = theme === 'dark';
    const mobile = useMediaQuery(MOBILE_QUERY);
    const reduced = usePrefersReducedMotion();
    // El tamaño sale de la propia Escena (100vh): no cambia cuando el teléfono muestra u oculta la
    // barra del navegador, así el encuadre no salta mientras se hace scroll.
    const rootRef = useRef<HTMLDivElement>(null);
    const viewport = useElementViewport(rootRef);
    const hidden = useDocumentHidden();
    const covered = useSceneCovered();
    const paused = hidden || covered;
    const frame = sceneFrame(viewport);
    const journeyMode = height === undefined;
    const page = usePageLayout(journeyMode, viewport);

    const sink = page?.column ? mountainSink(viewport, page.column, skyline(night)) : 0;
    const moon = page?.column
        ? moonPosition(viewport, page.column, page.headerBottom)
        : { x: viewport.width - 90, y: 140 };
    const travels = journeyMode && !reduced;

    // Animan siempre las cabinas y las estrellas; nubes, guacamayas y ventanas solo en escritorio.
    const animate = !reduced;
    const animateDesktop = animate && !mobile;
    const svg = (children: React.ReactNode) => (
        <svg viewBox={frame.viewBox} preserveAspectRatio="xMidYMax slice">
            {children}
        </svg>
    );

    const layers = (styles: PartStyles) => (
        <>
            <div className="scene-layer" data-layer="sky">
                <div className="scene-sky" style={{ background: skyGradient(DAY) }} />
                <div
                    className="scene-sky scene-sky-night"
                    style={{ background: skyGradient(NIGHT), opacity: night ? 1 : 0 }}
                />
                <m.div className="scene-layer scene-sky-high" style={styles.skyHigh} />
                {svg(
                    <>
                        {night && (
                            <Stars
                                count={mobile ? 30 : 60}
                                groups={mobile ? 2 : 3}
                                animate={animate}
                            />
                        )}
                        {!night && !mobile && <Macaws animate={animateDesktop} />}
                    </>,
                )}
                {night && moon && (
                    <div
                        className="scene-moon scene-fade-in"
                        data-part="moon"
                        style={{
                            left: moon.x - MOON_SIZE / 2,
                            top: moon.y - MOON_SIZE / 2,
                            width: MOON_SIZE,
                            height: MOON_SIZE,
                            background: NIGHT_LIGHTS.moon,
                        }}
                    />
                )}
            </div>
            {!mobile && (
                <m.div className="scene-layer" data-layer="clouds" style={styles.clouds}>
                    {CLOUDS.map((cloud, i) => (
                        <div
                            // CLOUDS es constante y nunca cambia de orden: el índice es una key estable.
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={i}
                            className="scene-cloud"
                            data-anim={animateDesktop ? 'drift' : undefined}
                            style={
                                {
                                    left: `${cloud.left}vw`,
                                    top: `${cloud.top}vh`,
                                    width: `${cloud.width}vw`,
                                    height: `${cloud.width / 3.2}vw`,
                                    '--drift': `${cloud.drift}vw`,
                                } as React.CSSProperties
                            }
                        />
                    ))}
                </m.div>
            )}
            {!mobile && (
                <m.div className="scene-layer" data-layer="far-ridge" style={styles.farRidge}>
                    {svg(<FarRidge c={VARS} />)}
                </m.div>
            )}
            <m.div className="scene-layer" data-layer="avila" style={styles.avila}>
                {svg(
                    <>
                        <HaloGradient />
                        <Avila c={VARS} night={night} animate={animate} withFarRidge={mobile} />
                    </>,
                )}
                <m.div className="scene-cabin" data-part="visitor-cabin" style={styles.cabin}>
                    <svg
                        viewBox="-6 0 12 17"
                        width={CABIN_WIDTH * frame.scale}
                        height={17 * frame.scale}
                    >
                        <CabinShape c={VARS} />
                    </svg>
                </m.div>
            </m.div>
            <m.div className="scene-layer" data-layer="city" style={styles.city}>
                {svg(<City c={VARS} night={night} animate={animateDesktop} withTowers={mobile} />)}
            </m.div>
            {!mobile && (
                <m.div className="scene-layer" data-layer="towers" style={styles.towers}>
                    {svg(<Towers c={VARS} night={night} animate={animateDesktop} />)}
                </m.div>
            )}
        </>
    );

    return (
        <div
            ref={rootRef}
            className="scene"
            aria-hidden="true"
            data-paused={paused || undefined}
            style={paletteVars(night ? NIGHT : DAY)}
        >
            {travels ? (
                <JourneyStyles
                    key={`${sink}|${viewport.width}x${viewport.height}`}
                    sink={sink}
                    viewport={viewport}
                    frame={frame}
                >
                    {layers}
                </JourneyStyles>
            ) : (
                layers(toPartStyles(stylesAt(height ?? HERO_HEIGHT, sink, viewport, frame)))
            )}
        </div>
    );
};

export const skyGradient = (c: typeof DAY) =>
    `linear-gradient(to bottom, ${c.skyTop}, ${c.skyBottom})`;
