/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { Home } from '@app/pages/Home';

import { renderWithProviders } from './render';

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

    const setup = () => renderWithProviders(<Home />);

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
        expect(header.className).toMatch(/shadow-xs/);
    });

    it('toggle de tema actualiza la clase dark', () => {
        setup();
        const themeBtn = screen.getByRole('button', { name: /Oscuro|Dark|Claro|Light/i });
        const root = document.documentElement;
        const hadDark = root.classList.contains('dark');
        vi.useFakeTimers();
        fireEvent.click(themeBtn);
        vi.advanceTimersByTime(3600);
        vi.useRealTimers();
        expect(root.classList.contains('dark')).toBe(!hadDark);
    });
});
