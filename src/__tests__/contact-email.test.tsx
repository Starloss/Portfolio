import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@app/App';
import { ThemeProvider } from '@lib/theme';

// El mailto no avisa si abrió algo: sin app de correo registrada, el clic no hace nada visible.
// Por eso la dirección se copia y, si la página no pierde el foco, se avisa que quedó copiada.

const EMAIL = 'contact@diegorangel.dev';
const COPIED = /la dirección quedó copiada/i;

const renderHome = () =>
    render(
        <MemoryRouter initialEntries={['/']}>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </MemoryRouter>,
    );

// jsdom no sabe abrir el correo: el clic llega a React y luego se cancela.
const clickEmail = () => {
    const link = document.querySelector<HTMLAnchorElement>(`a[href="mailto:${EMAIL}"]`)!;
    const cancel = (e: Event) => e.preventDefault();
    window.addEventListener('click', cancel, { once: true });
    act(() => {
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
};

const withClipboard = (writeText: (text: string) => Promise<void>) => {
    const spy = vi.fn(writeText);
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: spy },
        configurable: true,
    });
    return spy;
};

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
});

describe('Correo de Contacto', () => {
    it('copia la dirección al hacer clic y, si no se abrió una app de correo, lo avisa', async () => {
        const writeText = withClipboard(() => Promise.resolve());
        renderHome();
        clickEmail();
        expect(writeText).toHaveBeenCalledWith(EMAIL);
        expect(screen.queryByText(COPIED)).not.toBeInTheDocument();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(screen.getByText(COPIED)).toBeInTheDocument();
    });

    it('si la página pierde el foco (se abrió la app de correo), no avisa nada', async () => {
        withClipboard(() => Promise.resolve());
        renderHome();
        clickEmail();
        fireEvent.blur(window);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(screen.queryByText(COPIED)).not.toBeInTheDocument();
    });

    it('sin portapapeles no dice que copió', async () => {
        withClipboard(() => Promise.reject(new Error('denied')));
        renderHome();
        clickEmail();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(screen.queryByText(COPIED)).not.toBeInTheDocument();
    });

    it('si el portapapeles tarda, una pérdida de foco posterior todavía cuenta', async () => {
        let resolve = () => {};
        withClipboard(() => new Promise<void>((r) => (resolve = r)));
        renderHome();
        clickEmail();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        fireEvent.blur(window);
        await act(async () => resolve());
        expect(screen.queryByText(COPIED)).not.toBeInTheDocument();
    });

    it('un segundo clic deja sin efecto el aviso pendiente del primero', async () => {
        const pending: Array<() => void> = [];
        withClipboard(() => new Promise<void>((r) => pending.push(r)));
        renderHome();
        clickEmail();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        clickEmail();
        fireEvent.blur(window);
        await act(async () => pending[0]());
        expect(screen.queryByText(COPIED)).not.toBeInTheDocument();
    });
});
