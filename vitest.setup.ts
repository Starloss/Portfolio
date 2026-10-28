import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';

// Las animaciones de motion se resuelven al instante en los tests.
MotionGlobalConfig.skipAnimations = true;

afterEach(() => cleanup());

// jsdom no trae matchMedia ni IntersectionObserver. Valores por defecto inertes: cada test puede
// reemplazarlos (p. ej. para simular prefers-reduced-motion o una sección visible).
if (typeof window !== 'undefined') {
    if (!window.matchMedia) {
        window.matchMedia = (query: string) =>
            ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: () => {},
                removeEventListener: () => {},
                addListener: () => {},
                removeListener: () => {},
                dispatchEvent: () => false,
            }) as MediaQueryList;
    }
    if (!('IntersectionObserver' in window)) {
        class InertIntersectionObserver {
            observe() {}
            unobserve() {}
            disconnect() {}
            takeRecords() {
                return [];
            }
        }
        Object.defineProperty(window, 'IntersectionObserver', {
            value: InertIntersectionObserver,
            writable: true,
            configurable: true,
        });
    }
}
