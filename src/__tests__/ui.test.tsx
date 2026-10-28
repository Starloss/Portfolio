import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '@app/components/ui/Badge';
import { Heading } from '@app/components/ui/Heading';
import { Section } from '@app/components/ui/Section';
import { I18nProvider, useI18n } from '@lib/i18n';
import { ThemeProvider, useTheme } from '@lib/theme';

describe('UI primitives', () => {
    it('Badge variants', () => {
        const { rerender } = render(<Badge data-testid="badge">Default</Badge>);
        const badge = screen.getByTestId('badge');
        expect(badge.className).toMatch(/bg-slate-200/);
        rerender(
            <Badge variant="outline" data-testid="badge">
                Outline
            </Badge>,
        );
        expect(badge.className).toMatch(/border/);
    });

    it('Heading levels y visuallyHidden', () => {
        const { rerender } = render(<Heading level={1}>H1</Heading>);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1');
        rerender(<Heading level={3}>H3</Heading>);
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3');
        rerender(
            <Heading level={4} visuallyHidden>
                Hidden
            </Heading>,
        );
        const hidden = screen.getByText('Hidden');
        expect(hidden.className).toMatch(/sr-only/);
    });

    it('Section con y sin título y adorno', () => {
        const { rerender } = render(
            <Section title="Titulo" titleRightAdornment={<span data-testid="adorno">*</span>}>
                <p>contenido</p>
            </Section>,
        );
        expect(screen.getByRole('heading', { name: 'Titulo' })).toBeInTheDocument();
        expect(screen.getByTestId('adorno')).toBeInTheDocument();
        rerender(
            <Section>
                <p>solo contenido</p>
            </Section>,
        );
        expect(screen.queryByRole('heading', { name: 'Titulo' })).not.toBeInTheDocument();
    });
});

describe('ThemeProvider toggling y persistencia', () => {
    it('toggle alterna clase dark y guarda en localStorage', () => {
        const ThemeConsumer: React.FC = () => {
            const { theme, toggleTheme } = useTheme();
            return (
                <div>
                    <span data-testid="th">{theme}</span>
                    <button onClick={toggleTheme}>to</button>
                </div>
            );
        };
        const setItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        const span = screen.getByTestId('th');
        const button = screen.getByText('to');
        const root = document.documentElement;
        const initial = span.textContent;
        fireEvent.click(button);
        expect(span.textContent).not.toBe(initial);
        expect(setItemSpy).toHaveBeenCalled();
        // Toggle aplica/quita clase dark
        if (span.textContent === 'dark') {
            expect(root.classList.contains('dark')).toBe(true);
        } else {
            expect(root.classList.contains('dark')).toBe(false);
        }
    });
    it('ignora valor inválido en localStorage y cae a media query', () => {
        window.localStorage.setItem('theme', 'weird');
        // @ts-expect-error mock
        window.matchMedia = () => ({ matches: true });
        const Consumer: React.FC = () => {
            const { theme } = useTheme();
            return <span data-testid="th2">{theme}</span>;
        };
        render(
            <ThemeProvider>
                <Consumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('th2').textContent).toBe('dark');
    });
    it('cubre rama sin matchMedia', () => {
        // @ts-expect-error delete
        delete window.matchMedia;
        const Consumer: React.FC = () => {
            const { theme } = useTheme();
            return <span data-testid="th3">{theme}</span>;
        };
        render(
            <ThemeProvider>
                <Consumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('th3').textContent).toBe('dark');
    });
});

describe('i18n fallback', () => {
    it('devuelve la key si no existe traducción', () => {
        const MissingKey: React.FC = () => {
            const { t } = useI18n();
            return <span data-testid="txt">{t('clave_inexistente_xyz')}</span>;
        };
        render(
            <I18nProvider locale="es">
                <MissingKey />
            </I18nProvider>,
        );
        expect(screen.getByTestId('txt').textContent).toBe('clave_inexistente_xyz');
    });
    it('lanza error al usar hook fuera del provider', () => {
        const Err: React.FC = () => {
            // Simula uso indebido
            expect(() => useI18n()).toThrow();
            return null;
        };
        render(<Err />);
    });
});
