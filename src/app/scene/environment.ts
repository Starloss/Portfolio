// Lo que la Escena lee del entorno además del tema y las media queries.
import { useEffect, useSyncExternalStore } from 'react';

import type { Viewport } from './camera';

const onResize = (onChange: () => void) => {
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
};

export function useViewport(): Viewport {
    const width = useSyncExternalStore(onResize, () => window.innerWidth);
    const height = useSyncExternalStore(onResize, () => window.innerHeight);
    return { width, height };
}

const onVisibilityChange = (onChange: () => void) => {
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
};

export const useDocumentHidden = () =>
    useSyncExternalStore(onVisibilityChange, () => document.visibilityState === 'hidden');

// Algo que tapa la Escena a pantalla completa (el visor de la galería) la pausa mientras está abierto.
let covers = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Marca la Escena como tapada mientras `active` sea verdadero. */
export function useCoverScene(active: boolean) {
    useEffect(() => {
        if (!active) return;
        covers++;
        notify();
        return () => {
            covers--;
            notify();
        };
    }, [active]);
}

const onCoverChange = (onChange: () => void) => {
    listeners.add(onChange);
    return () => {
        listeners.delete(onChange);
    };
};

export const useSceneCovered = () => useSyncExternalStore(onCoverChange, () => covers > 0);
