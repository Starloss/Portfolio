// El sol, la luna, las estrellas y la franja de ocaso de la Escena SVG. El giro es una animación del
// compositor (solo transform y opacity): nada corre cuadro a cuadro en el hilo principal.
import React, { useLayoutEffect, useMemo, useRef } from 'react';

import type { Viewport } from './camera';
import { useCaracasSky } from './environment';
import { DAY, NIGHT, NIGHT_LIGHTS } from './palette';
import {
    BOVEDA_SECONDS,
    bovedaKeyframes,
    moonPath,
    moonRotation,
    PIVOT,
    restOf,
    restTransform,
    starField,
    type SkyLayout,
} from './vault';

const DURATION = BOVEDA_SECONDS * 1000;
const TWINKLE_DELAY = 1.7;

export const BovedaCeleste: React.FC<{
    night: boolean;
    layout: SkyLayout;
    viewport: Viewport;
    /** Con reduced-motion no gira nada ni titila: solo un fundido. */
    animate: boolean;
    twinkleGroups: number;
}> = ({ night, layout, viewport, animate, twinkleGroups }) => {
    const sky = useCaracasSky();
    const rest = restOf(sky, night);
    const stars = useMemo(() => starField(viewport, twinkleGroups), [viewport, twinkleGroups]);

    const sunRef = useRef<HTMLDivElement>(null);
    const moonRef = useRef<HTMLDivElement>(null);
    const starsRef = useRef<HTMLDivElement>(null);
    const sweepRef = useRef<HTMLDivElement>(null);
    const runningRef = useRef<Animation[]>([]);
    const wasNightRef = useRef(night);

    // Lo que hace falta del último render dentro del efecto, que solo corre al cambiar de tema.
    const liveRef = useRef({ sky, layout, viewport, animate });
    useLayoutEffect(() => {
        liveRef.current = { sky, layout, viewport, animate };
    });

    useLayoutEffect(() => {
        if (wasNightRef.current === night) return;
        wasNightRef.current = night;
        // Si cambia en pleno giro, vuelve por el mismo camino: así nada salta.
        const turning = runningRef.current.filter((a) => a.playState === 'running');
        if (turning.length > 0) {
            turning.forEach((animation) => animation.reverse());
            return;
        }
        const { sky: now, layout: l, viewport: v, animate: on } = liveRef.current;
        if (!on) return;
        const keys = bovedaKeyframes(night, restOf(now, night), restOf(now, !night), l, v);
        const play = (el: Element | null, frames: Keyframe[]) =>
            typeof el?.animate === 'function'
                ? [el.animate(frames, { duration: DURATION, easing: 'linear' })]
                : [];
        runningRef.current = [
            ...play(sunRef.current, keys.sun),
            ...play(moonRef.current, keys.moon),
            ...play(starsRef.current, keys.stars),
            ...play(sweepRef.current, keys.sweep),
        ];
    }, [night]);

    // Si pide menos movimiento en pleno giro, se corta.
    useLayoutEffect(() => {
        if (animate) return;
        runningRef.current.forEach((animation) => animation.cancel());
        runningRef.current = [];
    }, [animate]);

    const { size } = layout;
    const pivot = { left: viewport.width * PIVOT.x, top: viewport.height * PIVOT.y };
    return (
        <>
            <div
                ref={sweepRef}
                className="scene-sweep"
                aria-hidden="true"
                style={{
                    ...pivot,
                    background: `linear-gradient(to bottom, ${DAY.skyBottom} 47%, #ffcf9a 48.6%, #f28a5a 50%, #4a2f66 51.2%, ${NIGHT.skyTop} 53%)`,
                }}
            />
            <div
                ref={starsRef}
                className="scene-stars"
                data-part="stars"
                style={{ ...pivot, opacity: night ? 1 : 0 }}
            >
                <svg width="1" height="1" aria-hidden="true">
                    {stars.map((d, group) => (
                        <path
                            // Los grupos de titileo son constantes: el índice es una key estable.
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={group}
                            d={d}
                            stroke={NIGHT_LIGHTS.star}
                            strokeWidth={group === 0 ? 2.6 : 1.8}
                            strokeLinecap="round"
                            data-anim={animate && night ? 'twinkle' : undefined}
                            style={{ animationDelay: `${group * TWINKLE_DELAY}s` }}
                        />
                    ))}
                </svg>
            </div>
            <div
                ref={sunRef}
                className="scene-astro scene-sun"
                data-part="sun"
                style={{
                    width: size,
                    height: size,
                    transform: restTransform(rest.sun.f, layout, viewport),
                    opacity: !night && rest.sun.visible ? 1 : 0,
                    boxShadow: `0 0 ${size}px ${size / 2}px rgba(255, 225, 150, 0.4)`,
                }}
            />
            <div
                ref={moonRef}
                className="scene-astro"
                data-part="moon"
                style={{
                    width: size,
                    height: size,
                    transform: restTransform(rest.moon.f, layout, viewport),
                    opacity: night && rest.moon.visible ? 1 : 0,
                }}
            >
                <svg viewBox="-1 -1 2 2" width={size} height={size} aria-hidden="true">
                    <g transform={`rotate(${moonRotation(rest.moon.tilt).toFixed(1)})`}>
                        <circle r="1" fill="#fff" opacity="0.07" />
                        <path d={moonPath(rest.moon.fraction)} fill={NIGHT_LIGHTS.moon} />
                    </g>
                </svg>
            </div>
        </>
    );
};
