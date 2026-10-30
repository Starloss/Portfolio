// Lo único de la Escena WebGL que va en la carga inicial (ADR 0003): con la página ya cargada y el
// navegador ocioso, trae la detección en su propio chunk y, solo si conviene, la versión WebGL.
import React, { useEffect, useState } from 'react';
import { trackEscena, trackEscenaFallback } from '@lib/analytics';
import { usePrefersReducedMotion } from '@lib/motion';

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

// Qué versión quedó y por qué, a la vista en <html data-escena-elegida data-escena-razon>: lo leen
// Playwright y quien depure.
const announce = (version: 'svg' | 'webgl', reason: string) => {
    document.documentElement.dataset.escenaElegida = version;
    document.documentElement.dataset.escenaRazon = reason;
};

function decide(): Promise<Upgrade | null> {
    decision ??= import('./gl/detect')
        .then(async ({ chooseEscena, readSignals, rememberFallback }) => {
            const choice = chooseEscena(await readSignals());
            trackEscena(choice.version, choice.reason);
            if (choice.version !== 'webgl') {
                announce('svg', choice.reason);
                return null;
            }
            const { SceneGL } = await import('./gl/SceneGL');
            announce('webgl', choice.reason);
            return { SceneGL, watch: choice.reason !== 'forced', rememberFallback };
        })
        // Un chunk que no llega (red caída, deploy nuevo) deja la Escena SVG, que ya está.
        .catch((error: unknown) => {
            console.error('Escena: no se pudo cargar la detección o la versión WebGL', error);
            announce('svg', 'load-failed');
            return null;
        });
    return decision;
}

export const EscenaUpgrade: React.FC = () => {
    const [upgrade, setUpgrade] = useState<Upgrade | null>(null);
    // Si en plena visita se pide menos movimiento, la WebGL se va: la SVG ya lo respeta. No es una
    // caída, así que no se registra ni se recuerda.
    const reduced = usePrefersReducedMotion();

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

    if (!upgrade || (reduced && upgrade.watch)) return null;
    const { SceneGL, watch, rememberFallback } = upgrade;
    const onFallback = (reason: FallbackReason) => {
        trackEscenaFallback(reason);
        // Forzada con ?escena=webgl es una prueba: esa caída no se recuerda, pero se avisa en la
        // consola, así el Lighthouse de escritorio no mide la SVG creyendo que mide la WebGL.
        if (watch) rememberFallback();
        else console.error(`Escena WebGL forzada: volvió a la SVG (${reason})`);
        announce('svg', reason);
        decision = Promise.resolve(null);
        setUpgrade(null);
    };
    return <SceneGL watch={watch} onFallback={onFallback} />;
};
