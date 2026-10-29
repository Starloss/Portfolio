import fs from 'node:fs';

import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@app/App';
import { trackContact } from '@lib/analytics';
import { ThemeProvider } from '@lib/theme';

// Señales de interés (GLOSSARY.md) medidas con Umami: ver docs/adr/0002.

const renderAt = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </MemoryRouter>,
    );

// jsdom no sabe navegar: el clic llega a React y luego se cancela, antes de que intente abrir el
// PDF o el correo.
const click = (el: HTMLElement) => {
    const cancel = (e: Event) => e.preventDefault();
    window.addEventListener('click', cancel, { once: true });
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

const withUmami = () => {
    const track = vi.fn();
    window.umami = { track };
    return track;
};

afterEach(() => {
    delete window.umami;
});

describe('Script de Umami', () => {
    const html = fs.readFileSync('index.html', 'utf8');

    it('se carga diferido y solo cuenta en el dominio de producción', () => {
        const tag = html.match(/<script[^>]*cloud\.umami\.is[^>]*>/)?.[0] ?? '';
        expect(tag).toContain(' defer');
        expect(tag).toContain('data-website-id="b76f28fd-a425-4d9c-95f1-26dc246fef0d"');
        expect(tag).toContain('data-domains="www.diegorangel.dev"');
    });

    it('no se usan los atributos data-umami-event, que anulan el download del CV', () => {
        const { container } = renderAt('/');
        expect(container.querySelector('[data-umami-event]')).toBeNull();
    });
});

describe('Señales de interés', () => {
    it('cada enlace al CV mide su descarga con el idioma del CV', () => {
        const track = withUmami();
        renderAt('/en');
        const links = screen.getAllByRole('link', { name: /Download CV|CV/ });
        const cvLinks = links.filter((l) => l.getAttribute('href') === '/cv-diego-rangel-en.pdf');
        expect(cvLinks.length).toBeGreaterThanOrEqual(3);
        for (const link of cvLinks) click(link);
        expect(track).toHaveBeenCalledTimes(cvLinks.length);
        expect(track).toHaveBeenCalledWith('cv-download', { lang: 'en' });
    });

    it('Contacto mide los clics al correo y a LinkedIn, pero no a GitHub', () => {
        const track = withUmami();
        renderAt('/');
        const contact = screen.getByRole('region', { name: /Contacto/ });
        click(within(contact).getByRole('link', { name: /@/ }));
        click(within(contact).getByRole('link', { name: 'LinkedIn' }));
        click(within(contact).getByRole('link', { name: 'GitHub' }));
        expect(track.mock.calls).toEqual([
            ['contact', { channel: 'email' }],
            ['contact', { channel: 'linkedin' }],
        ]);
    });

    it('sin el script de Umami (bloqueado o fuera de producción) los clics siguen funcionando', () => {
        renderAt('/');
        const contact = screen.getByRole('region', { name: /Contacto/ });
        expect(() => click(within(contact).getByRole('link', { name: 'LinkedIn' }))).not.toThrow();
    });

    it('un error de Umami nunca rompe el clic', () => {
        window.umami = {
            track: () => {
                throw new Error('umami caído');
            },
        };
        expect(() => trackContact('email')).not.toThrow();
    });
});
