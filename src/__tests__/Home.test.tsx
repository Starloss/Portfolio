/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Home } from '@app/pages/Home';
import { ThemeProvider } from '@lib/theme';
import { I18nProvider } from '@lib/i18n';

// Mock IntersectionObserver para cubrir rama de observer
// Mock minimal sin depender de tipos DOM específicos
class MockIO {
    private _cb: any;
    constructor(cb: any) {
        this._cb = cb;
    }
    observe(el: any) {
        this._cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
}

describe('Home interactions', () => {
    beforeEach(() => {
        (window as any).IntersectionObserver = MockIO;
    });

    const setup = () =>
        render(
            <ThemeProvider>
                <I18nProvider>
                    <Home />
                </I18nProvider>
            </ThemeProvider>,
        );

    it('abre y cierra el menú móvil y aplica sombra al hacer scroll', () => {
        setup();
        const toggleBtn = screen.getByRole('button', { name: /Abrir menú|Open menu/i });
        fireEvent.click(toggleBtn);
        expect(screen.getByRole('navigation', { name: /mobile/i })).toBeInTheDocument();
        // Clic fuera cierra
        fireEvent.click(document.body);
        expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument();
        // Scroll
        Object.defineProperty(window, 'scrollY', { value: 10, writable: true });
        fireEvent.scroll(window);
        const header = screen.getByRole('banner');
        expect(header.className).toMatch(/shadow-sm/);
    });

    it('toggle de tema y cambio de locale actualizan UI', () => {
        setup();
        const themeBtn = screen.getByRole('button', { name: /Oscuro|Dark|Claro|Light/i });
        const root = document.documentElement;
        const hadDark = root.classList.contains('dark');
        fireEvent.click(themeBtn);
        expect(root.classList.contains('dark')).toBe(!hadDark);
        const langBtn = screen.getByRole('button', { name: /EN|ES/ });
        const initial = langBtn.getAttribute('aria-label');
        fireEvent.click(langBtn);
        expect(langBtn.getAttribute('aria-label')).not.toBe(initial);
    });
});
