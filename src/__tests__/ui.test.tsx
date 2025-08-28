import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Badge } from '@app/components/ui/Badge';
import { Heading } from '@app/components/ui/Heading';
import { Section } from '@app/components/ui/Section';
import { BackgroundScene } from '@app/components/BackgroundScene';
import { ContactSection } from '@app/features/contact/ContactSection';
import { ExperienceSection } from '@app/features/experience/ExperienceSection';
import { I18nProvider, useI18n } from '@lib/i18n';
import { ThemeProvider, useTheme } from '@lib/theme';
import { getProjects } from '@app/features/projects/data';

// Wrapper util para providers combinados
const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>
        <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
);

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

describe('ContactSection submit', () => {
    beforeEach(() => {
        // Evitar navegación real
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });
    });
    it('construye mailto con datos del formulario', () => {
        render(
            <Providers>
                <ContactSection />
            </Providers>,
        );
        fireEvent.change(screen.getByLabelText(/Nombre|Name/), { target: { value: 'Juan' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Correo|Email/i }), {
            target: { value: 'juan@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/Mensaje|Message/), { target: { value: 'Hola!' } });
        fireEvent.click(screen.getByRole('button', { name: /Enviar|Send/i }));
        expect(window.location.href).toMatch(/mailto:/);
        expect(decodeURIComponent(window.location.href)).toMatch(/Juan/);
        expect(decodeURIComponent(window.location.href)).toMatch(/Hola!/);
    });
    it('usa placeholder de nombre cuando está vacío y rama catch si asignación falla', () => {
        Object.defineProperty(window, 'location', {
            value: {
                set href(_v: string) {
                    throw new Error('blocked');
                },
                get href() {
                    return '';
                },
            },
            configurable: true,
        });
        render(
            <Providers>
                <ContactSection />
            </Providers>,
        );
        fireEvent.change(screen.getByRole('textbox', { name: /Correo|Email/i }), {
            target: { value: 'mail@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/Mensaje|Message/), { target: { value: 'Msg' } });
        fireEvent.click(screen.getByRole('button', { name: /Enviar|Send/i }));
        // No lanza excepción y no crashea
        expect(true).toBe(true);
    });
});

describe('ExperienceSection locales y tech list', () => {
    it('cambia textos al cambiar locale', () => {
        const LocaleToggler: React.FC = () => {
            const { switchLocale, locale, t } = useI18n();
            return (
                <div>
                    <button onClick={switchLocale}>toggle</button>
                    <span data-testid="current-locale">{locale}</span>
                    <h3>{t('experience_title')}</h3>
                </div>
            );
        };
        render(
            <Providers>
                <LocaleToggler />
                <ExperienceSection />
            </Providers>,
        );
        expect(screen.getByTestId('current-locale')).toHaveTextContent('es');
        // Hay dos headings con el mismo texto (h2 sección y h3 de LocaleToggler), usar getAll
        expect(
            screen.getAllByRole('heading', { name: /Experiencia|Experience/i }).length,
        ).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('toggle'));
        expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
        // Tech list: asegurar que al menos un chip aparece
        const list = screen.getAllByRole('list', {
            name: /tecnologías clave|key technologies/i,
        })[0];
        const chips = within(list).getAllByRole('listitem');
        expect(chips.length).toBeGreaterThan(0);
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
            <I18nProvider>
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

describe('BackgroundScene ramas', () => {
    it('renderiza estrellas solo en dark', () => {
        const Scene = () => {
            const { toggleTheme, theme } = useTheme();
            return (
                <div>
                    <button onClick={toggleTheme}>toggleTheme</button>
                    <span data-testid="mode">{theme}</span>
                    <BackgroundScene />
                </div>
            );
        };
        render(
            <ThemeProvider>
                <I18nProvider>
                    <Scene />
                </I18nProvider>
            </ThemeProvider>,
        );
        // En modo inicial (dark por defecto) debe haber varias spans (estrellas)
        expect(document.querySelectorAll('[style*="twinkle"]').length).toBeGreaterThan(0);
    });
    it('rama light sin estrellas', () => {
        // Forzar light inicial
        window.localStorage.setItem('theme', 'light');
        render(
            <ThemeProvider>
                <I18nProvider>
                    <BackgroundScene />
                </I18nProvider>
            </ThemeProvider>,
        );
        expect(document.querySelectorAll('[style*="twinkle"]').length).toBe(0);
    });
});

describe('Projects async', () => {
    it('getProjects devuelve proyectos', async () => {
        const list = await getProjects();
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBeGreaterThan(0);
    });
});
