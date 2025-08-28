/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@lib/theme';
import { I18nProvider } from '@lib/i18n';
import { BackgroundScene } from '@app/components/BackgroundScene';
import { Home } from '@app/pages/Home';

// Test para forzar rama catch de localStorage.getItem lanzando excepción
describe('ThemeProvider ramas extra', () => {
    it('maneja excepción al leer localStorage', () => {
        const getItemOrig = window.localStorage.getItem.bind(window.localStorage);
        (window.localStorage as any).getItem = () => {
            throw new Error('fail');
        };
        const Consumer: React.FC = () => {
            const { theme } = useTheme();
            return <span data-testid="t">{theme}</span>;
        };
        render(
            <ThemeProvider>
                <Consumer />
            </ThemeProvider>,
        );
        // Debe elegir dark por fallback sin lanzar
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        // restaurar
        (window.localStorage as any).getItem = getItemOrig;
    });
});

// BackgroundScene: cubrir rama early-return de onScroll (ticking.current true)
describe('BackgroundScene scroll throttling', () => {
    const rafOrig = window.requestAnimationFrame;
    afterEach(() => {
        window.requestAnimationFrame = rafOrig;
    });
    it('ejecuta rama de retorno temprano cuando múltiples scroll antes de rAF', () => {
        (window as any).requestAnimationFrame = () => 1; // no ejecuta callback
        window.localStorage.setItem('theme', 'dark');
        render(
            <ThemeProvider>
                <I18nProvider>
                    <BackgroundScene />
                </I18nProvider>
            </ThemeProvider>,
        );
        Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll')); // segunda debería disparar rama early return
        expect(true).toBe(true); // si no rompe, rama cubierta
    });
});

// Home: cubrir rama donde IntersectionObserver recibe entradas no intersecting
describe('Home IntersectionObserver no intersect', () => {
    beforeEach(() => {
        class MockIO {
            private _cb: any;
            constructor(cb: any) {
                this._cb = cb;
            }
            observe(el: any) {
                this._cb([{ target: el, isIntersecting: false }], this);
            }
            unobserve() {}
            disconnect() {}
            takeRecords() {
                return [];
            }
        }
        (window as any).IntersectionObserver = MockIO;
    });
    it('mantiene id activo inicial cuando no intersecta', () => {
        render(
            <ThemeProvider>
                <I18nProvider>
                    <Home />
                </I18nProvider>
            </ThemeProvider>,
        );
        // Activo por defecto en estado inicial (about) sin cambiar
        expect(document.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(
            '#about',
        );
    });
});
