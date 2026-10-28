/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@lib/theme';
import { Home } from '@app/pages/Home';

import { renderWithProviders } from './render';

// Test para forzar rama catch de localStorage.getItem lanzando excepción
describe('ThemeProvider ramas extra', () => {
    it('maneja excepción al leer localStorage', () => {
        const getItemOrig = window.localStorage.getItem.bind(window.localStorage);
        const matchMediaOrig = window.matchMedia;
        (window.localStorage as any).getItem = () => {
            throw new Error('fail');
        };
        // Sin preferencia guardada, el tema sale de la media query: aquí, oscuro.
        window.matchMedia = ((query: string) => ({
            ...matchMediaOrig(query),
            matches: true,
        })) as any;
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
        window.matchMedia = matchMediaOrig;
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
    it('no marca ninguna sección mientras ninguna cruza la pantalla', () => {
        renderWithProviders(<Home />);
        expect(document.querySelector('[aria-current="page"]')).toBeNull();
    });
});
