// La Escena WebGL encima de la SVG (ADR 0003). Entra con un fundido cruzado y, si el vigilante de
// FPS la ve lenta o se pierde el contexto, se funde de vuelta a la SVG.
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTheme } from '@lib/theme';

import { mountainSink, moonPosition, sceneFrame } from '../camera';
import { useDocumentHidden, useElementViewport, useSceneCovered } from '../environment';
import { skyline } from '../geometry';
import { usePageLayout } from '../Scene';

import { EscenaGL } from './engine';
import { createWatchdog } from './watchdog';

export type FallbackReason = 'slow' | 'context-lost' | 'init-failed';

// Lo que dura el fundido cruzado (scene.css, .scene-gl).
const FADE_MS = 600;

export const SceneGL: React.FC<{
    /** Con `?escena=webgl` no hay vigilante: lo usan CI y las pruebas manuales. */
    watch: boolean;
    onFallback: (reason: FallbackReason) => void;
}> = ({ watch, onFallback }) => {
    const { theme } = useTheme();
    const night = theme === 'dark';
    const boxRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<EscenaGL | null>(null);
    const viewport = useElementViewport(boxRef);
    const page = usePageLayout(true, viewport);
    const hidden = useDocumentHidden();
    const covered = useSceneCovered();
    const paused = hidden || covered;
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState<FallbackReason | null>(null);
    const fallBack = useEffectEvent((reason: FallbackReason) => onFallback(reason));

    useEffect(() => {
        let engine: EscenaGL;
        try {
            engine = new EscenaGL(canvasRef.current!, Math.min(window.devicePixelRatio || 1, 2));
        } catch {
            // Nada llegó a verse: vuelve a la SVG sin fundido.
            fallBack('init-failed');
            return;
        }
        engineRef.current = engine;
        const watchdog = createWatchdog(performance.now());
        engine.onFirstFrame = () => setVisible(true);
        engine.onLost = () => setLeaving('context-lost');
        if (watch) {
            engine.onFrame = (now) => {
                if (watchdog.frame(now) === 'fallback') {
                    engine.stop();
                    setLeaving('slow');
                }
            };
        }
        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [watch]);

    // Las mismas medidas que la Escena SVG: hundimiento de la montaña y luna fuera del texto.
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.setLayout({
            viewport,
            frame: sceneFrame(viewport),
            sink: page?.column ? mountainSink(viewport, page.column, skyline(night)) : 0,
            moon: page?.column
                ? moonPosition(viewport, page.column, page.headerBottom)
                : { x: viewport.width - 90, y: 140 },
        });
        void engine.setNight(night);
        // `watch` recrea el motor: el nuevo también necesita sus medidas.
    }, [viewport, page, night, watch]);

    useEffect(() => {
        const engine = engineRef.current;
        if (!engine || leaving) return;
        if (paused) engine.stop();
        else engine.start();
    }, [paused, leaving, watch]);

    // Con la WebGL ya a la vista, la SVG de abajo deja de pintarse; al irse, vuelve antes del fundido.
    useEffect(() => {
        if (!visible || leaving) return;
        const root = document.documentElement;
        const t = window.setTimeout(() => (root.dataset.escena = 'webgl'), FADE_MS);
        return () => {
            window.clearTimeout(t);
            delete root.dataset.escena;
        };
    }, [visible, leaving]);

    useEffect(() => {
        if (!leaving) return;
        const t = window.setTimeout(() => fallBack(leaving), visible ? FADE_MS : 0);
        return () => window.clearTimeout(t);
    }, [leaving, visible]);

    return (
        <div ref={boxRef} className="scene-gl" aria-hidden="true">
            <canvas ref={canvasRef} style={{ opacity: visible && !leaving ? 1 : 0 }} />
        </div>
    );
};
