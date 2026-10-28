import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { BackgroundScene } from '@app/components/BackgroundScene';
import { ThemeProvider } from '@lib/theme';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('BackgroundScene movimiento reducido', () => {
    it.each([false, true])('respeta prefers-reduced-motion: %s', (reducedMotion) => {
        const matchMedia = window.matchMedia;
        vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
            ...matchMedia(query),
            matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
        }));
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            callback(0);
            return 1;
        });
        vi.stubGlobal('innerHeight', 1000);
        vi.stubGlobal('scrollY', 500);
        vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(3000);

        const { container } = render(
            <ThemeProvider>
                <BackgroundScene />
            </ThemeProvider>,
        );
        const scrollTransforms = () =>
            Array.from(container.querySelectorAll<HTMLElement>('[style]'))
                .map((el) => el.style.transform)
                .filter((transform) => /^translateY\([\d.]+px\)$/.test(transform));
        const initialTransforms = scrollTransforms();

        act(() => {
            vi.stubGlobal('scrollY', 1800);
            window.dispatchEvent(new Event('scroll'));
        });

        expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
        if (reducedMotion) {
            expect(
                initialTransforms.every((t) => t === 'translateY(0px)' || t === 'translateY(60px)'),
            ).toBe(true);
            expect(scrollTransforms()).toEqual(initialTransforms);
        } else {
            expect(scrollTransforms()).not.toEqual(initialTransforms);
            expect(scrollTransforms()).toContain('translateY(72px)');
            expect(scrollTransforms()).toContain('translateY(15px)');
        }
    });
});
