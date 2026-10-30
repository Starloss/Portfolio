import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';

// Las animaciones de motion se resuelven al instante en los tests.
MotionGlobalConfig.skipAnimations = true;

afterEach(() => cleanup());

// jsdom no trae matchMedia, IntersectionObserver ni scrollIntoView, y su scrollTo y su getContext
// solo avisan que no están implementados (sin canvas no hay WebGL: la Escena se queda en SVG).
// Valores por defecto inertes: cada test puede reemplazarlos (p. ej. para simular
// prefers-reduced-motion o una sección visible).
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
    Element.prototype.scrollIntoView ??= () => {};
    window.scrollTo = () => {};
    HTMLCanvasElement.prototype.getContext = () => null;
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
