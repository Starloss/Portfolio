import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { ThemeProvider } from '@lib/theme';
import { useCoverScene } from '@app/scene/environment';
import { Scene } from '@app/scene/Scene';

interface Setup {
    night?: boolean;
    mobile?: boolean;
    reducedMotion?: boolean;
    height?: number;
}

// La Escena lee del entorno el tema (Día/Noche), el ancho (escritorio/móvil) y reduced-motion.
function renderScene({ night = false, mobile = false, reducedMotion = false, height }: Setup = {}) {
    document.documentElement.classList.toggle('dark', night);
    // En móvil, el tamaño de un teléfono: la Avenida Bolívar dibuja lo que entra a lo ancho.
    if (mobile) {
        vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(844);
    }
    const original = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        ...original(query),
        matches:
            (query.includes('max-width') && mobile) ||
            (query.includes('prefers-reduced-motion') && reducedMotion),
    }));
    const { container } = render(
        <ThemeProvider>
            <Scene height={height} />
        </ThemeProvider>,
    );
    const scene = container.firstElementChild as HTMLElement;
    return {
        scene,
        svgElements: () => scene.querySelectorAll('svg, svg *').length,
        animated: () => scene.querySelectorAll('[data-anim]').length,
        has: (part: string) => scene.querySelector(`[data-part="${part}"]`) !== null,
        hasLayer: (layer: string) => scene.querySelector(`[data-layer="${layer}"]`) !== null,
        shift: (layer: string) =>
            (scene.querySelector(`[data-layer="${layer}"]`) as HTMLElement).style.transform,
        animations: () =>
            new Set(
                Array.from(scene.querySelectorAll('[data-anim]'), (el) =>
                    el.getAttribute('data-anim'),
                ),
            ),
    };
}

const cleanupScene = () => {
    cleanup();
    vi.restoreAllMocks();
};

afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
});

describe('Presupuesto de la Escena', () => {
    it('en escritorio de Noche no pasa de 600 elementos SVG ni de 12 animados', () => {
        const { svgElements, animated } = renderScene({ night: true });
        expect(svgElements()).toBeGreaterThan(0);
        expect(svgElements()).toBeLessThanOrEqual(600);
        expect(animated()).toBeGreaterThan(0);
        expect(animated()).toBeLessThanOrEqual(12);
    });

    it('en móvil de Noche no pasa de 300 elementos SVG ni de 4 animados', () => {
        const { svgElements, animated } = renderScene({ night: true, mobile: true });
        expect(svgElements()).toBeLessThanOrEqual(300);
        expect(animated()).toBeGreaterThan(0);
        expect(animated()).toBeLessThanOrEqual(4);
    });

    it('en escritorio de Día tampoco pasa los límites', () => {
        const { svgElements, animated } = renderScene();
        expect(svgElements()).toBeLessThanOrEqual(600);
        expect(animated()).toBeLessThanOrEqual(12);
    });
});

describe('Día y Noche', () => {
    it('de Noche monta las ventanas encendidas, el halo y la baliza', () => {
        const { has } = renderScene({ night: true });
        for (const part of ['windows', 'halo', 'beacon']) {
            expect(has(part)).toBe(true);
        }
        expect(has('macaws')).toBe(false);
    });

    it('de Día monta las guacamayas y nada de lo exclusivo de Noche', () => {
        const { has } = renderScene();
        expect(has('macaws')).toBe(true);
        for (const part of ['windows', 'halo', 'beacon']) {
            expect(has(part)).toBe(false);
        }
    });

    it('los cuatro Hitos y las tres crestas están en los dos modos', () => {
        for (const night of [false, true]) {
            const { has } = renderScene({ night });
            for (const part of ['humboldt', 'towers', 'telepherique', 'far-ridge', 'avila']) {
                expect(has(part)).toBe(true);
            }
            cleanupScene();
        }
    });
});

describe('Escritorio y móvil', () => {
    it('en escritorio hay 6 capas: cielo, nubes, cresta lejana, Ávila, ciudad y Torres', () => {
        const { hasLayer } = renderScene();
        for (const layer of ['sky', 'clouds', 'far-ridge', 'avila', 'city', 'towers']) {
            expect(hasLayer(layer)).toBe(true);
        }
    });

    it('en móvil hay 3 capas, sin nubes ni guacamayas, y las Torres van en la ciudad', () => {
        const { hasLayer, has } = renderScene({ mobile: true });
        expect(['sky', 'avila', 'city'].every(hasLayer)).toBe(true);
        expect(['clouds', 'far-ridge', 'towers'].some(hasLayer)).toBe(false);
        expect(has('macaws')).toBe(false);
        expect(has('towers')).toBe(true);
        expect(has('far-ridge')).toBe(true);
    });

    it('en móvil solo se animan las cabinas y las estrellas', () => {
        const { animations } = renderScene({ night: true, mobile: true });
        expect([...animations()].sort()).toEqual(['cabin', 'twinkle']);
    });
});

describe('prefers-reduced-motion', () => {
    it('no hay nada animado, ni en escritorio ni en móvil', () => {
        expect(renderScene({ night: true, reducedMotion: true }).animated()).toBe(0);
        cleanupScene();
        expect(renderScene({ night: true, mobile: true, reducedMotion: true }).animated()).toBe(0);
    });

    it('la Escena queda en el encuadre del Hero y no se mueve con el scroll', () => {
        // Encuadre del Hero: cámara a 0,8 con una ventana de 1000 px; cada capa baja
        // profundidad × 0,8 × 1000 (cresta lejana 0,35, Ávila 0,55, ciudad 0,8, Torres 0,9).
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000);
        const { shift } = renderScene({ reducedMotion: true });
        const before = ['far-ridge', 'avila', 'city', 'towers'].map(shift);
        expect(before).toEqual([
            'translateY(280.0px)',
            'translateY(440.0px)',
            'translateY(640.0px)',
            'translateY(720.0px)',
        ]);
        act(() => {
            window.scrollY = 2000;
            window.dispatchEvent(new Event('scroll'));
        });
        expect(['far-ridge', 'avila', 'city', 'towers'].map(shift)).toEqual(before);
        window.scrollY = 0;
    });
});

describe('Caso de estudio', () => {
    it('la Escena queda fija sobre las nubes: cada capa hundida según su profundidad', () => {
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000);
        const { shift, scene } = renderScene({ height: 1 });
        expect(shift('far-ridge')).toBe('translateY(350.0px)');
        expect(shift('avila')).toBe('translateY(550.0px)');
        expect(shift('city')).toBe('translateY(800.0px)');
        expect(shift('towers')).toBe('translateY(900.0px)');
        const clouds = scene.querySelector('[data-layer="clouds"]') as HTMLElement;
        expect(clouds.style.transform).toBe('translateY(100.0px)');
        expect(clouds.style.opacity).toBe('1');
    });
});

describe('Accesibilidad y pausa', () => {
    it('la Escena es decorativa: oculta a lectores de pantalla y sin elementos con foco', () => {
        const { scene } = renderScene({ night: true });
        expect(scene).toHaveAttribute('aria-hidden', 'true');
        expect(scene.querySelectorAll('a, button, input, [tabindex]').length).toBe(0);
    });

    it('se pausa con la pestaña oculta y sigue al volver', () => {
        const { scene } = renderScene({ night: true });
        expect(scene).not.toHaveAttribute('data-paused');
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(scene).toHaveAttribute('data-paused');
        visibility.mockReturnValue('visible');
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(scene).not.toHaveAttribute('data-paused');
    });

    it('se pausa mientras algo la tapa a pantalla completa, como el visor de la galería', () => {
        const Viewer: React.FC<{ open: boolean }> = ({ open }) => {
            useCoverScene(open);
            return null;
        };
        const { scene } = renderScene({ night: true });
        const viewer = render(<Viewer open />);
        expect(scene).toHaveAttribute('data-paused');
        viewer.rerender(<Viewer open={false} />);
        expect(scene).not.toHaveAttribute('data-paused');
    });
});
