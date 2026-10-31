import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme, type Theme } from '@lib/theme';

const Consumer: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button type="button" data-testid="theme" onClick={toggleTheme}>
            {theme}
        </button>
    );
};

const root = document.documentElement;
const KEY = 'tema-elegido';

/** Monta como la página ya cargada: el script de index.html dejó el tema inicial en <html>. */
function setup({ hourTheme, dark = hourTheme === 'dark' }: { hourTheme: Theme; dark?: boolean }) {
    root.dataset.temaHora = hourTheme;
    root.classList.toggle('dark', dark);
    render(
        <ThemeProvider>
            <Consumer />
        </ThemeProvider>,
    );
    return screen.getByTestId('theme');
}

describe('ThemeProvider', () => {
    const track = vi.fn<(event: string, data?: Record<string, string>) => unknown>();

    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
        track.mockClear();
        window.umami = { track };
    });

    afterEach(() => {
        delete window.umami;
        delete root.dataset.temaHora;
        delete root.dataset.horaForzada;
        root.classList.remove('dark');
        window.history.replaceState(null, '', '/');
        vi.restoreAllMocks();
    });

    it.each(['light', 'dark'] as const)('parte del tema que dejó el script: %s', (theme) => {
        expect(setup({ hourTheme: theme }).textContent).toBe(theme);
        expect(root.classList.contains('dark')).toBe(theme === 'dark');
    });

    it('montar no guarda nada', () => {
        setup({ hourTheme: 'dark' });
        expect(window.sessionStorage.getItem(KEY)).toBeNull();
        expect(window.localStorage.getItem('theme')).toBeNull();
    });

    it('el toggle cambia el tema y lo guarda solo para esta visita', () => {
        const button = setup({ hourTheme: 'light' });
        fireEvent.click(button);
        expect(button.textContent).toBe('dark');
        expect(root.classList.contains('dark')).toBe(true);
        expect(window.sessionStorage.getItem(KEY)).toBe('dark');
        expect(window.localStorage.getItem('theme')).toBeNull();
        expect(track).toHaveBeenCalledWith('tema-elegido', { tema: 'dark' });
    });

    it('volver al tema de la hora borra la elección, sin contarla', () => {
        const button = setup({ hourTheme: 'light' });
        fireEvent.click(button);
        track.mockClear();
        fireEvent.click(button);
        expect(button.textContent).toBe('light');
        expect(window.sessionStorage.getItem(KEY)).toBeNull();
        expect(track).not.toHaveBeenCalled();
    });

    it('una elección de antes de recargar se puede deshacer con un clic', () => {
        window.sessionStorage.setItem(KEY, 'dark');
        const button = setup({ hourTheme: 'light', dark: true });
        fireEvent.click(button);
        expect(button.textContent).toBe('light');
        expect(window.sessionStorage.getItem(KEY)).toBeNull();
    });

    it('con la hora forzada no cuenta la elección, aunque se haya navegado sin ?hora=', () => {
        root.dataset.horaForzada = '';
        const button = setup({ hourTheme: 'light' });
        fireEvent.click(button);
        expect(button.textContent).toBe('dark');
        expect(track).not.toHaveBeenCalled();
    });

    it('un ?hora= inválido no impide contar la elección', () => {
        window.history.replaceState(null, '', '/?hora=25:00');
        fireEvent.click(setup({ hourTheme: 'light' }));
        expect(track).toHaveBeenCalledWith('tema-elegido', { tema: 'dark' });
    });

    it('sin sessionStorage el toggle sigue funcionando', () => {
        const blocked = () => {
            throw new Error('bloqueado');
        };
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
        const button = setup({ hourTheme: 'light' });
        fireEvent.click(button);
        expect(button.textContent).toBe('dark');
        fireEvent.click(button);
        expect(button.textContent).toBe('light');
    });
});
