// Prototipo #40: la Escena WebGL encima de la Escena SVG. Sin detección previa ni vigilante de FPS:
// se activa en escritorio sin reduced-motion, o siempre con ?escena=webgl. ?escena=svg la apaga y
// ?escala= cambia la resolución interna.
import React, { useEffect, useRef, useState } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from '@lib/motion';
import { useTheme } from '@lib/theme';

import { mountainSink, moonPosition, sceneFrame } from '../camera';
import { useDocumentHidden, useSceneCovered } from '../environment';
import { skyline } from '../geometry';
import { usePageLayout } from '../Scene';

import { EscenaGL } from './engine';

const params = () => new URLSearchParams(window.location.search);

// Del tamaño de la ventana y no del canvas: ogl le fija el tamaño en px al canvas.
function useWindowViewport() {
    const [size, setSize] = useState(() => ({ width: innerWidth, height: innerHeight }));
    useEffect(() => {
        const update = () =>
            setSize((prev) =>
                prev.width === innerWidth && prev.height === innerHeight
                    ? prev
                    : { width: innerWidth, height: innerHeight },
            );
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return size;
}

export const SceneGL: React.FC = () => {
    const { theme } = useTheme();
    const night = theme === 'dark';
    const mobile = useMediaQuery('(max-width: 767px)');
    const reduced = usePrefersReducedMotion();
    const forced = params().get('escena');
    const enabled = forced === 'webgl' || (forced !== 'svg' && !mobile && !reduced);

    const canvas = useRef<HTMLCanvasElement>(null);
    const engine = useRef<EscenaGL | null>(null);
    const viewport = useWindowViewport();
    const page = usePageLayout(enabled, viewport);
    const hidden = useDocumentHidden();
    const covered = useSceneCovered();
    const paused = hidden || covered;
    const [visible, setVisible] = useState(false);
    const [fps, setFps] = useState(0);

    useEffect(() => {
        if (!enabled || !canvas.current) return;
        const scale = Number(params().get('escala')) || 1;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
        let instance: EscenaGL;
        try {
            instance = new EscenaGL(canvas.current, dpr);
        } catch (error) {
            console.error('Escena WebGL:', error);
            return;
        }
        engine.current = instance;
        instance.onFirstFrame = () => setVisible(true);
        (window as unknown as { __escena: unknown }).__escena = instance.stats;
        const timer = window.setInterval(() => setFps(instance.stats.fps), 500);
        return () => {
            window.clearInterval(timer);
            instance.destroy();
            engine.current = null;
            setVisible(false);
        };
    }, [enabled]);

    // El tema de entrada se fija sin atardecer; los cambios posteriores sí lo hacen.
    const started = useRef(false);
    useEffect(() => {
        const e = engine.current;
        if (!e) return;
        const frame = sceneFrame(viewport);
        const sink = page?.column ? mountainSink(viewport, page.column, skyline(night)) : 0;
        const moon = page?.column
            ? moonPosition(viewport, page.column, page.headerBottom)
            : { x: viewport.width - 90, y: 140 };
        e.setLayout({ viewport, frame, sink, moon });
        if (!started.current) {
            started.current = true;
            void e.init(night);
        } else {
            void e.setNight(night);
        }
    }, [enabled, viewport, page, night]);

    useEffect(() => {
        const e = engine.current;
        if (!e) return;
        if (paused) e.stop();
        else e.start();
    }, [enabled, paused]);

    // Cuando la WebGL ya se ve, la SVG de abajo deja de pintarse.
    useEffect(() => {
        if (!visible) return;
        const t = window.setTimeout(() => (document.documentElement.dataset.escena = 'webgl'), 700);
        return () => {
            window.clearTimeout(t);
            delete document.documentElement.dataset.escena;
        };
    }, [visible]);

    if (!enabled) return null;
    return (
        <>
            <canvas
                ref={canvas}
                aria-hidden="true"
                className="scene-gl"
                style={{ opacity: visible ? 1 : 0 }}
            />
            <div className="scene-gl-fps" aria-hidden="true">
                {fps.toFixed(0)} fps · {viewport.width}×{viewport.height}
            </div>
        </>
    );
};
