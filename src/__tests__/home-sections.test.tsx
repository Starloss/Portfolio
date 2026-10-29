import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@app/App';
import { ThemeProvider } from '@lib/theme';

const renderAt = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </MemoryRouter>,
    );

const section = (name: RegExp) => screen.getByRole('region', { name });

describe('Home: orden de las secciones', () => {
    it('Hero → Impacto → Experiencia → Proyectos destacados → Skills → Contacto', () => {
        const { container } = renderAt('/');
        const ids = Array.from(container.querySelectorAll('main section[id]'), (s) => s.id);
        expect(ids).toEqual(['hero', 'impact', 'experience', 'projects', 'skills', 'contact']);
    });

    it('cada sección tiene su título en el idioma de la URL', () => {
        renderAt('/en');
        for (const name of ['Impact', 'Experience', 'Featured projects', 'Skills', 'Contact']) {
            expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
        }
    });
});

describe('Franja de Impacto', () => {
    // La Empresa se nombra de una sola forma en todo el sitio (GLOSSARY.md), también en el enlace.
    it('muestra las 4 Cifras clave, cada una como enlace a su respaldo', () => {
        renderAt('/');
        const links = within(section(/Impacto/)).getAllByRole('link');
        expect(links).toHaveLength(4);
        expect(links[0]).toHaveTextContent(/^\d+\+años de experienciaVer en Trayectoria →$/);
        expect(links[0]).toHaveAttribute('href', '#experience');
        expect(links[1]).toHaveTextContent(
            '10+devs lideradosVer en CORE Care and Health Systems →',
        );
        expect(links[1]).toHaveAttribute('href', '#experience-core');
        expect(links[2]).toHaveTextContent('−80%tiempo de booking hoteleroVer en SuperWallet →');
        expect(links[2]).toHaveAttribute('href', '/projects/superwallet');
        expect(links[3]).toHaveTextContent(
            '100%entregas a tiempoVer en CORE Care and Health Systems →',
        );
        expect(links[3]).toHaveAttribute('href', '#experience-core');
    });

    it('en inglés los enlaces dicen "See" y conservan el idioma', () => {
        renderAt('/en');
        const links = within(section(/Impact/)).getAllByRole('link');
        expect(links[0]).toHaveTextContent(/See Career →$/);
        expect(links[2]).toHaveAttribute('href', '/en/projects/superwallet');
    });
});

describe('Experiencia', () => {
    it('es una lista válida, de la más reciente a la más antigua', () => {
        renderAt('/');
        const list = within(section(/Experiencia/)).getByRole('list', { name: /Experiencias/ });
        expect(Array.from(list.children).every((child) => child.tagName === 'LI')).toBe(true);
        const items = within(list)
            .getAllByRole('listitem')
            .filter((li) => li.parentElement === list);
        expect(items.map((li) => li.id)).toEqual([
            'experience-xhype',
            'experience-core',
            'experience-wocoon',
            'experience-daxos',
            'experience-300-dev',
        ]);
    });

    it('cada Experiencia muestra sus 2 Logros más importantes', () => {
        const { container } = renderAt('/');
        const core = container.querySelector('#experience-core') as HTMLElement;
        expect(
            within(core).getByText('Lead Developer · CORE Care and Health Systems'),
        ).toBeInTheDocument();
        const achievements = within(core).getByRole('list', { name: 'Logros' });
        expect(
            within(achievements)
                .getAllByRole('listitem')
                .map((li) => li.textContent),
        ).toEqual([
            'Lidero y mentoreo a un equipo de más de 10 devs, aumentando su productividad en 60%.',
            'Facilité workshops logrando 100% entregas a tiempo y satisfacción del cliente.',
        ]);
        for (const li of container.querySelectorAll('#experience li[id^="experience-"]')) {
            const list = within(li as HTMLElement).getByRole('list', { name: 'Logros' });
            expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        }
    });

    it('una Experiencia con Proyecto de trabajo enlaza a su Caso de estudio', () => {
        const { container } = renderAt('/');
        const xhype = container.querySelector('#experience-xhype') as HTMLElement;
        expect(
            within(xhype).getByRole('link', { name: 'Proyecto: SuperWallet →' }),
        ).toHaveAttribute('href', '/projects/superwallet');
        const daxos = container.querySelector('#experience-daxos') as HTMLElement;
        expect(within(daxos).queryByRole('link')).not.toBeInTheDocument();
    });
});

describe('Proyectos destacados', () => {
    it('hay una tarjeta-enlace por Proyecto destacado, con su tipo', () => {
        renderAt('/');
        const cards = within(section(/Proyectos destacados/)).getAllByRole('link');
        expect(cards.map((c) => c.getAttribute('href'))).toEqual([
            '/projects/superwallet',
            '/projects/be-booking-engine',
            '/projects/wedding-invitation',
        ]);
        expect(cards[0]).toHaveTextContent('Proyecto de trabajo · XHype');
        expect(cards[1]).toHaveTextContent('Proyecto de trabajo · CORE Care and Health Systems');
        expect(cards[2]).toHaveTextContent('Proyecto personal');
    });

    it('las tarjetas con capturas muestran la primera en WebP, con medidas', () => {
        renderAt('/en');
        const [superwallet] = within(section(/Featured projects/)).getAllByRole('link');
        const img = within(superwallet).getByRole('img');
        expect(img).toHaveAttribute('src', '/projects/superwallet-1-1280.webp');
        // 960 es lo que pide un móvil de ~412 px a DPR 1,75: sin él bajaría el de 1280.
        expect(img).toHaveAttribute(
            'srcset',
            '/projects/superwallet-1-640.webp 640w, /projects/superwallet-1-960.webp 960w, /projects/superwallet-1-1280.webp 1280w',
        );
        expect(img).toHaveAttribute('width', '1280');
        expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('la tarjeta de BE muestra su primera captura: la lista de reservas', () => {
        renderAt('/en');
        const [, be] = within(section(/Featured projects/)).getAllByRole('link');
        expect(within(be).getByRole('img')).toHaveAttribute(
            'alt',
            'Booking list with missing-data alerts',
        );
    });
});

describe('Skills', () => {
    it('agrupa los chips por categoría', () => {
        renderAt('/');
        const skills = section(/Habilidades/);
        for (const name of ['Front', 'Back', 'DevOps', 'Habilidades blandas']) {
            expect(within(skills).getByRole('heading', { name })).toBeInTheDocument();
        }
    });
});

describe('Contacto', () => {
    it('tiene la frase y botones directos, sin formulario', () => {
        renderAt('/');
        const contact = section(/Contacto/);
        expect(
            within(contact).getByText(
                '¿Buscas a alguien que lidere tu próximo producto? Escríbeme.',
            ),
        ).toBeInTheDocument();
        expect(within(contact).queryByRole('textbox')).not.toBeInTheDocument();
        const links = within(contact).getAllByRole('link');
        expect(links[0].getAttribute('href')).toMatch(/^mailto:/);
        expect(links.map((l) => l.textContent)).toEqual([
            expect.stringContaining('@'),
            'LinkedIn',
            'GitHub',
            'Descargar CV',
        ]);
        expect(links[3]).toHaveAttribute('href', '/cv-diego-rangel-es.pdf');
    });

    it('en inglés la frase y el CV están en inglés', () => {
        renderAt('/en');
        const contact = section(/Contact/);
        expect(
            within(contact).getByText(
                'Looking for someone to lead your next product? Get in touch.',
            ),
        ).toBeInTheDocument();
        expect(within(contact).getByRole('link', { name: 'Download CV' })).toHaveAttribute(
            'href',
            '/cv-diego-rangel-en.pdf',
        );
    });
});

describe('Entrada de los bloques', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const reduceMotion = (reduce: boolean) => {
        const original = window.matchMedia;
        vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
            ...original(query),
            matches: query.includes('prefers-reduced-motion') && reduce,
        }));
    };

    it('sin reduced-motion, un bloque arranca oculto hasta entrar en pantalla', () => {
        reduceMotion(false);
        renderAt('/');
        expect(section(/Impacto/).style.opacity).toBe('0');
    });

    it('con reduced-motion, los bloques aparecen sin animación', () => {
        reduceMotion(true);
        renderAt('/');
        expect(section(/Impacto/).style.opacity).toBe('');
        expect(section(/Contacto/).style.transform).toBe('');
    });

    it('al volver de un Caso de estudio, Proyectos destacados ya está visible y en pantalla', async () => {
        reduceMotion(false);
        // Se registra a qué elemento se llevó la pantalla.
        const original = Element.prototype.scrollIntoView;
        const scrolled: Element[] = [];
        Element.prototype.scrollIntoView = function (this: Element) {
            scrolled.push(this);
        };
        try {
            renderAt('/projects/superwallet');
            await userEvent.click(screen.getByRole('link', { name: '← Proyectos' }));
            const projects = section(/Proyectos destacados/);
            // Sin el fundido de entrada: el morph inverso necesita la tarjeta visible desde el primer cuadro.
            expect(projects.style.opacity).toBe('');
            expect(scrolled).toContain(projects);
            expect(section(/Impacto/).style.opacity).toBe('0');
        } finally {
            Element.prototype.scrollIntoView = original;
        }
    });
});
