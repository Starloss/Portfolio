import { describe, it, expect } from 'vitest';

import { buildSiteArtifacts, ogImages } from '@/build/artifacts';

const INDEX_HTML = `<!doctype html>
<html lang="es">
    <head>
        <meta charset="UTF-8" />
        <title>Diego Rangel</title>
        <meta name="description" content="Portfolio personal" />
        <script type="module" src="/assets/index.js"></script>
    </head>
    <body><div id="root"></div></body>
</html>`;

const files = buildSiteArtifacts({
    indexHtml: INDEX_HTML,
    siteUrl: 'https://www.diegorangel.dev',
    today: new Date(2026, 9, 27),
});

const headOf = (html: string) => html.slice(0, html.indexOf('</head>'));

describe('<head> por ruta e idioma', () => {
    it('escribe un index.html por cada ruta e idioma', () => {
        expect(
            Object.keys(files)
                .filter((f) => f.endsWith('.html'))
                .sort(),
        ).toEqual([
            'en.html',
            'en/projects/be-booking-engine.html',
            'en/projects/superwallet.html',
            'en/projects/wedding-invitation.html',
            'index.html',
            'projects/be-booking-engine.html',
            'projects/superwallet.html',
            'projects/wedding-invitation.html',
        ]);
    });

    it('la Home en español lleva su título, descripción, canonical y hreflang', () => {
        const head = headOf(files['index.html']);
        expect(head).toContain('<html lang="es">');
        expect(head).toContain('<title>Diego Rangel · Full-Stack Lead Developer</title>');
        expect(head).toContain(
            '<meta name="description" content="Lidero equipos que construyen productos web y móviles rápidos, escalables y medibles. Caracas, Venezuela · Remoto." />',
        );
        expect(head).toContain('<link rel="canonical" href="https://www.diegorangel.dev/" />');
        expect(head).toContain(
            '<link rel="alternate" hreflang="en" href="https://www.diegorangel.dev/en" />',
        );
        expect(head).toContain(
            '<link rel="alternate" hreflang="x-default" href="https://www.diegorangel.dev/" />',
        );
        expect(head).not.toContain('Portfolio personal');
        expect(head).toContain('<script type="module" src="/assets/index.js"></script>');
    });

    it('un Caso de estudio en inglés usa el título del Proyecto y su resumen', () => {
        const head = headOf(files['en/projects/wedding-invitation.html']);
        expect(head).toContain('<html lang="en">');
        expect(head).toContain('<title>Wedding Invitation · Case study · Diego Rangel</title>');
        expect(head).toContain(
            '<meta property="og:description" content="Interactive wedding invitation with code-based RSVP and guest photo uploads, built and shipped in 1 week." />',
        );
        expect(head).toContain(
            '<meta property="og:url" content="https://www.diegorangel.dev/en/projects/wedding-invitation" />',
        );
        expect(head).toContain('<meta property="og:locale" content="en_US" />');
        expect(head).toContain('<meta property="og:locale:alternate" content="es_ES" />');
    });

    it('cada página enlaza su imagen OG, con texto alternativo y tamaño', () => {
        const home = headOf(files['index.html']);
        expect(home).toContain(
            '<meta property="og:image" content="https://www.diegorangel.dev/og/es/home.png" />',
        );
        expect(home).toContain(
            '<meta property="og:image:alt" content="Diego Rangel · Full-Stack Lead Developer" />',
        );
        expect(home).toContain('<meta property="og:image:width" content="1200" />');
        expect(home).toContain('<meta property="og:image:height" content="630" />');
        expect(home).toContain('<meta name="twitter:card" content="summary_large_image" />');

        const caseStudy = headOf(files['en/projects/wedding-invitation.html']);
        expect(caseStudy).toContain(
            '<meta property="og:image" content="https://www.diegorangel.dev/og/en/projects/wedding-invitation.png" />',
        );
        expect(caseStudy).toContain(
            '<meta property="og:image:alt" content="Wedding Invitation · Case study · Diego Rangel" />',
        );
        expect(caseStudy).toContain('<meta name="twitter:card" content="summary_large_image" />');
        expect(caseStudy).not.toContain('content="summary"');
    });

    it('la Home lleva el JSON-LD de Person y los Casos de estudio no', () => {
        const jsonLd = files['en.html'].match(
            /<script type="application\/ld\+json">(.*?)<\/script>/s,
        );
        expect(JSON.parse(jsonLd![1])).toEqual({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Diego Rangel',
            jobTitle: 'Full-Stack Lead Developer',
            url: 'https://www.diegorangel.dev/en',
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'Caracas',
                addressCountry: 'VE',
            },
            sameAs: [
                'https://www.linkedin.com/in/diego-rangel-de-ornelas',
                'https://github.com/Starloss',
            ],
        });
        expect(files['projects/superwallet.html']).not.toContain('application/ld+json');
    });
});

describe('Imágenes OG', () => {
    const images = ogImages(new Date(2026, 9, 27));

    it('hay una por página e idioma: la Home y los 3 Casos de estudio', () => {
        expect(images.map((i) => i.file).sort()).toEqual([
            'og/en/home.png',
            'og/en/projects/be-booking-engine.png',
            'og/en/projects/superwallet.png',
            'og/en/projects/wedding-invitation.png',
            'og/es/home.png',
            'og/es/projects/be-booking-engine.png',
            'og/es/projects/superwallet.png',
            'og/es/projects/wedding-invitation.png',
        ]);
    });

    it('la de la Home lleva el nombre y el rol', () => {
        const home = images.find((i) => i.file === 'og/es/home.png')!;
        expect(home.card).toEqual({ title: 'Diego Rangel', label: 'Full-Stack Lead Developer' });
    });

    it('la de un Caso de estudio lleva el Proyecto, "Caso de estudio" en su idioma y la tech', () => {
        const es = images.find((i) => i.file === 'og/es/projects/superwallet.png')!;
        const en = images.find((i) => i.file === 'og/en/projects/superwallet.png')!;
        expect(es.card.title).toBe('SuperWallet');
        expect(es.card.label).toBe('Caso de estudio');
        expect(en.card.label).toBe('Case study');
        expect(es.card.detail).toBe('React · TypeScript · Prisma · Nest');
    });
});

describe('sitemap y robots', () => {
    it('el sitemap lista las 8 URLs con sus alternativas', () => {
        const sitemap = files['sitemap.xml'];
        expect(sitemap.match(/<url>/g)).toHaveLength(8);
        expect(sitemap).toContain('<loc>https://www.diegorangel.dev/projects/superwallet</loc>');
        expect(sitemap).toContain(
            '<xhtml:link rel="alternate" hreflang="en" href="https://www.diegorangel.dev/en/projects/superwallet" />',
        );
    });

    it('robots.txt permite todo y apunta al sitemap', () => {
        expect(files['robots.txt']).toBe(
            'User-agent: *\nAllow: /\n\nSitemap: https://www.diegorangel.dev/sitemap.xml\n',
        );
    });
});
