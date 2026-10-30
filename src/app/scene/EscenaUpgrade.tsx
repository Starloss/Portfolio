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

interface Upgrade {
    SceneGL: typeof SceneGLType;
    watch: boolean;
    rememberFallback: () => void;
}

// Una decisión por visita: volver a la Home no repite la detección ni el evento, y después de una
// caída la WebGL no vuelve hasta la próxima visita.
let decision: Promise<Upgrade | null> | null = null;

function decide(): Promise<Upgrade | null> {
    decision ??= import('./gl/detect')
        .then(async ({ chooseEscena, readSignals, rememberFallback }) => {
            const choice = chooseEscena(readSignals());
            trackEscena(choice.version, choice.reason);
            if (choice.version !== 'webgl') return null;
            const { SceneGL } = await import('./gl/SceneGL');
            return { SceneGL, watch: choice.reason !== 'forced', rememberFallback };
        })
        // Un chunk que no llega (red caída, deploy nuevo) deja la Escena SVG, que ya está.
        .catch(() => null);
    return decision;
}

export const EscenaUpgrade: React.FC = () => {
    const [upgrade, setUpgrade] = useState<Upgrade | null>(null);

    useEffect(() => {
        let active = true;
        const stop = whenIdleAfterLoad(() => {
            void decide().then((result) => {
                if (active) setUpgrade(result);
            });
        });
        return () => {
            active = false;
            stop();
        };
    }, []);

    if (!upgrade) return null;
    const { SceneGL, watch, rememberFallback } = upgrade;
    const onFallback = (reason: FallbackReason) => {
        trackEscenaFallback(reason);
        // Forzada con ?escena=webgl es una prueba: esa caída no se recuerda.
        if (watch) rememberFallback();
        decision = Promise.resolve(null);
        setUpgrade(null);
    };
    return <SceneGL watch={watch} onFallback={onFallback} />;
};
