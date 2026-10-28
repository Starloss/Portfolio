// Lo que la Escena lee del entorno además del tema y las media queries.
import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react';

import type { Viewport } from './camera';

/** Tamaño de un elemento; hasta poder medirlo (o si mide 0, como en jsdom), el de la ventana. */
export function useElementViewport(ref: RefObject<HTMLElement | null>): Viewport {
    const [size, setSize] = useState<Viewport>(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
    }));
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            setSize((prev) =>
                prev.width === width && prev.height === height ? prev : { width, height },
            );
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return size;
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
