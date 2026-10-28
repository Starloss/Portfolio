import React, { useCallback, useSyncExternalStore } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';

/** Una media query que reacciona en vivo, sin recargar. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            if (typeof window.matchMedia !== 'function') return () => {};
            const list = window.matchMedia(query);
            list.addEventListener?.('change', onChange);
            return () => list.removeEventListener?.('change', onChange);
        },
        [query],
    );
    return useSyncExternalStore(
        subscribe,
        () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
        () => false,
    );
}

// `useReducedMotion()` de motion no reacciona si la preferencia cambia con la página abierta.
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

// Las features de motion llegan en un chunk aparte: hasta entonces la Escena queda estática en el
// encuadre del Hero.
const loadFeatures = () => import('./motion-features').then((m) => m.default);

/** motion diferido y alineado con prefers-reduced-motion. */
export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const reduce = usePrefersReducedMotion();
    return (
        <LazyMotion features={loadFeatures} strict>
            <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>{children}</MotionConfig>
        </LazyMotion>
    );
};
