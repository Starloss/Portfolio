// La Escena WebGL encima de la SVG (ADR 0003). Entra con un fundido cruzado; si el vigilante de FPS
// la ve lenta, se funde de vuelta a la SVG, y si falla (contexto perdido, texturas), vuelve enseguida.
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTheme } from '@lib/theme';

import { sceneFrame } from '../camera';
import { useDocumentHidden, useElementViewport, useSceneCovered } from '../environment';
import { pageFit, usePageLayout } from '../Scene';

import { useBoveda } from '../prototype-boveda/store';

import { EscenaClient } from './client';
import type { FallbackReason } from './protocol';

export type { FallbackReason } from './protocol';

// Lo que dura el fundido cruzado (scene.css, .scene-gl > canvas).
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
    const engineRef = useRef<EscenaClient | null>(null);
    const viewport = useElementViewport(boxRef);
    const page = usePageLayout(true, viewport);
    const hidden = useDocumentHidden();
    const covered = useSceneCovered();
    const paused = hidden || covered;
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState<FallbackReason | null>(null);
    const fallBack = useEffectEvent((reason: FallbackReason) => onFallback(reason));

    useEffect(() => {
        let engine: EscenaClient;
        try {
            engine = new EscenaClient(canvasRef.current!, {
                dpr: Math.min(window.devicePixelRatio || 1, 2),
                watch,
            });
        } catch {
            // Nada llegó a verse: vuelve a la SVG sin fundido.
            fallBack('init-failed');
            return;
        }
        engineRef.current = engine;
        engine.onFirstFrame = () => setVisible(true);
        // El vigilante de FPS corre en el Worker: si la ve lenta, llega como 'slow'.
        engine.onFailed = (reason) => setLeaving(reason);
        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [watch]);

    const boveda = useBoveda();
    useEffect(() => {
        engineRef.current?.setBoveda(
            boveda && {
                ...boveda,
                minX: page?.column ? page.column.right / viewport.width : 0.5,
            },
        );
    }, [boveda, page, viewport, watch]);

    // Las mismas medidas que la Escena SVG. El tema va antes que el tamaño: así se rasteriza
    // primero el tema que se ve.
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;
        const { sink, moon } = pageFit(viewport, page, night);
        void engine.setNight(night);
        engine.setLayout({ viewport, frame: sceneFrame(viewport), sink, moon });
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

    // Solo la lentitud se despide con un fundido: un canvas que falló se quita enseguida.
    useEffect(() => {
        if (!leaving) return;
        const t = window.setTimeout(
            () => fallBack(leaving),
            leaving === 'slow' && visible ? FADE_MS : 0,
        );
        return () => window.clearTimeout(t);
    }, [leaving, visible]);

    return (
        <div ref={boxRef} className="scene-gl" aria-hidden="true">
            <canvas ref={canvasRef} style={{ opacity: visible && !leaving ? 1 : 0 }} />
        </div>
    );
};
