// Lo único de la Escena WebGL que va en la carga inicial (ADR 0003): con la página ya cargada y el
// navegador ocioso, trae la detección en su propio chunk y, solo si conviene, la versión WebGL.
import React, { useEffect, useState } from 'react';
import { trackEscena, trackEscenaFallback } from '@lib/analytics';

import type { FallbackReason, SceneGL as SceneGLType } from './gl/SceneGL';

function whenIdleAfterLoad(run: () => void): () => void {
    let cancel = () => {};
    const idle = () => {
        if (typeof window.requestIdleCallback === 'function') {
            const id = window.requestIdleCallback(run, { timeout: 3000 });
            cancel = () => window.cancelIdleCallback(id);
        } else {
            const id = window.setTimeout(run, 200);
            cancel = () => window.clearTimeout(id);
        }
    };
    if (document.readyState === 'complete') {
        idle();
        return () => cancel();
    }
    window.addEventListener('load', idle, { once: true });
    return () => {
        window.removeEventListener('load', idle);
        cancel();
    };
}

interface Loaded {
    SceneGL: typeof SceneGLType;
    watch: boolean;
    rememberFallback: () => void;
}

export const EscenaUpgrade: React.FC = () => {
    const [loaded, setLoaded] = useState<Loaded | null>(null);

    useEffect(() => {
        let active = true;
        const stop = whenIdleAfterLoad(async () => {
            const { chooseEscena, readSignals, rememberFallback } = await import('./gl/detect');
            const choice = chooseEscena(readSignals());
            trackEscena(choice.version, choice.reason);
            if (choice.version !== 'webgl' || !active) return;
            const { SceneGL } = await import('./gl/SceneGL');
            if (active) {
                setLoaded({ SceneGL, watch: choice.reason !== 'forced', rememberFallback });
            }
        });
        return () => {
            active = false;
            stop();
        };
    }, []);

    if (!loaded) return null;
    const { SceneGL, watch, rememberFallback } = loaded;
    const onFallback = (reason: FallbackReason) => {
        trackEscenaFallback(reason);
        // Forzada con ?escena=webgl es una prueba: esa caída no se recuerda.
        if (watch) rememberFallback();
        setLoaded(null);
    };
    return <SceneGL watch={watch} onFallback={onFallback} />;
};
