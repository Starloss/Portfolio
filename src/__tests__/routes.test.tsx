import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@app/App';
import { ThemeProvider } from '@lib/theme';

import { CONTENT } from '@/content';

const renderAt = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </MemoryRouter>,
    );

describe('El idioma sale de la URL', () => {
    it('la raíz está en español', () => {
        renderAt('/');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, soy');
        expect(document.documentElement.lang).toBe('es');
    });

    it('/en está en inglés', () => {
        renderAt('/en');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm");
        expect(
            screen.getByText(
                'I lead teams that build fast, scalable, measurable web and mobile products.',
            ),
        ).toBeInTheDocument();
        expect(document.documentElement.lang).toBe('en');
    });

    it('una ruta desconocida lleva a la Home del mismo idioma', () => {
        renderAt('/en/no-existe');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm");
    });

    it('el selector "ES / EN" lleva a la misma página en el otro idioma', async () => {
        renderAt('/en/projects/superwallet');
        expect(screen.getByRole('heading', { name: 'Key decisions' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('link', { name: 'ES' }));
        expect(screen.getByRole('heading', { name: 'Decisiones clave' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
    });

    it('"Descargar CV" apunta al PDF del idioma de la URL', () => {
        renderAt('/en');
        expect(screen.getAllByRole('link', { name: 'Download CV' })[0]).toHaveAttribute(
            'href',
            '/cv-diego-rangel-en.pdf',
        );
    });

    it('"Descargar CV" en español apunta al PDF en español', () => {
        renderAt('/');
        expect(screen.getAllByRole('link', { name: 'Descargar CV' })[0]).toHaveAttribute(
            'href',
            '/cv-diego-rangel-es.pdf',
        );
    });
});

describe('Home con el contenido nuevo', () => {
    it('ya no tiene "Sobre mí" ni el chip de años', () => {
        renderAt('/');
        expect(screen.queryByText('Sobre mí')).not.toBeInTheDocument();
        expect(screen.queryByText(/7\+ años/)).not.toBeInTheDocument();
    });

    it('muestra la Experiencia en XHype con su período', () => {
        renderAt('/en');
        const xhype = screen.getByRole('heading', { name: 'Senior Developer · XHype' });
        expect(xhype.closest('li')).toHaveTextContent('Aug 2025 – Apr 2026');
    });

    it('los enlaces a Proyectos conservan el idioma', () => {
        renderAt('/en');
        const projects = screen.getByRole('region', { name: 'Featured projects' });
        expect(
            within(projects).getAllByRole('link', { name: /Wedding Invitation/ })[0],
        ).toHaveAttribute('href', '/en/projects/wedding-invitation');
    });
});

describe('Caso de estudio', () => {
    it('muestra el problema y las decisiones en el idioma de la URL', () => {
        renderAt('/projects/wedding-invitation');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Invitación de Boda');
        expect(screen.getByText(/^Confirmar asistencia por grupo/)).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'RSVP por token, sin login' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: 'Portada de la invitación en escritorio' }),
        ).toBeInTheDocument();
    });

    it('BE - Booking Engine no muestra galería', () => {
        renderAt('/en/projects/be-booking-engine');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BE - Booking Engine');
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('un Proyecto inexistente muestra el aviso en el idioma de la URL', () => {
        renderAt('/en/projects/nada');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Project not found');
    });
});

describe('Galería del Caso de estudio', () => {
    it('una captura más angosta que 640 px se declara con su ancho real', async () => {
        const { container } = renderAt('/projects/wedding-invitation');
        // La primera captura (wedding-invitation-11) mide 1280 px: lleva los dos anchos.
        const current = () => container.querySelector('button img') as HTMLImageElement;
        expect(current().getAttribute('srcset')).toBe(
            '/projects/wedding-invitation-11-640.webp 640w, /projects/wedding-invitation-11-1280.webp 1280w',
        );
        // La siguiente (wedding-invitation-1) mide 371 px: no se agranda y va con su ancho real.
        await userEvent.click(screen.getByRole('button', { name: 'Siguiente imagen' }));
        expect(current().getAttribute('srcset')).toBe(
            '/projects/wedding-invitation-1-640.webp 371w',
        );
    });

    it('avanza y retrocede entre capturas con su texto alternativo', async () => {
        renderAt('/en/projects/superwallet');
        expect(
            screen.getByRole('img', { name: 'SuperWallet sign-up screen showing XHype cards' }),
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Next image' }));
        expect(
            screen.getByRole('img', { name: 'Wallet with USDT balance and supported tokens' }),
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));
        await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));
        expect(screen.getByRole('img', { name: 'Referral program dashboard' })).toBeInTheDocument();
    });

    it('abre el visor, navega con el teclado y lo cierra con Esc', async () => {
        renderAt('/projects/wedding-invitation');
        await userEvent.click(
            screen.getByRole('img', { name: 'Portada de la invitación en escritorio' }),
        );
        const viewer = screen.getByRole('dialog', { name: 'Invitación de Boda · galería' });
        expect(
            within(viewer).getByText('Portada de la invitación en escritorio · 1/8'),
        ).toBeInTheDocument();
        await userEvent.keyboard('{ArrowRight}');
        expect(
            within(viewer).getByText('Portada de la invitación en móvil · 2/8'),
        ).toBeInTheDocument();
        await userEvent.keyboard('{ArrowLeft}');
        await userEvent.click(
            within(viewer).getByRole('button', { name: 'Galería de retratos de la pareja' }),
        );
        expect(
            within(viewer).getByText('Galería de retratos de la pareja · 5/8'),
        ).toBeInTheDocument();
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('el botón de cerrar también cierra el visor', async () => {
        renderAt('/projects/wedding-invitation');
        await userEvent.click(
            screen.getByRole('img', { name: 'Portada de la invitación en escritorio' }),
        );
        await userEvent.click(screen.getByRole('button', { name: 'Cerrar galería' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

describe('Navegación desde un Caso de estudio', () => {
    it.each([false, true])(
        'omite anterior y siguiente para un Proyecto no destacado (sin destacados: %s)',
        (noFeaturedProjects) => {
            const originalProjects = CONTENT.projects;
            CONTENT.projects = originalProjects.map((p) => ({
                ...p,
                featured: !noFeaturedProjects && p.id !== 'superwallet' && p.featured,
            }));
            try {
                renderAt('/en/projects/superwallet');
                expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
                expect(
                    screen.queryByRole('link', { name: /Previous project/ }),
                ).not.toBeInTheDocument();
                expect(
                    screen.queryByRole('link', { name: /Next project/ }),
                ).not.toBeInTheDocument();
            } finally {
                CONTENT.projects = originalProjects;
            }
        },
    );

    it('el menú lleva a las secciones de la Home del mismo idioma', async () => {
        renderAt('/en/projects/be-booking-engine');
        await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
        const mobile = screen.getByRole('navigation', { name: 'mobile' });
        expect(within(mobile).getByRole('link', { name: 'Experience' })).toHaveAttribute(
            'href',
            '/en#experience',
        );
        await userEvent.click(within(mobile).getByRole('link', { name: 'Experience' }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm");
    });

    it('anterior y siguiente recorren los Proyectos destacados en orden', async () => {
        renderAt('/en/projects/be-booking-engine');
        await userEvent.click(screen.getByRole('link', { name: /Next project/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Wedding Invitation');
        await userEvent.click(screen.getByRole('link', { name: /Next project/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
        await userEvent.click(screen.getByRole('link', { name: /Previous project/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Wedding Invitation');
    });
});
