// Archivos que el post-build escribe en dist/: un index.html con su <head> por ruta e idioma,
// el sitemap y robots.txt. Es una función pura para poder probarla sin construir el sitio.
import { localizedPath, projectPath, routePaths } from '@lib/locale-path';

import { CONTENT, LOCALES, resolveContent, type Locale } from '@/content';

interface Options {
    /** El index.html que produce `vite build`. */
    indexHtml: string;
    siteUrl: string;
    today: Date;
}

const OG_LOCALE: Record<Locale, string> = { es: 'es_ES', en: 'en_US' };
const CASE_STUDY: Record<Locale, string> = { es: 'Caso de estudio', en: 'Case study' };

const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * "/" → "index.html", "/en/projects/x" → "en/projects/x.html". Vercel sirve "x.html" en "/x" con
 * `cleanUrls` (vercel.json), y los archivos estáticos tienen prioridad sobre el rewrite de la SPA.
 */
const fileOf = (path: string) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

interface Page {
    path: string;
    title: string;
    description: string;
    jsonLd?: object;
}

function pagesFor(locale: Locale, siteUrl: string, today: Date) {
    const content = resolveContent(locale, today);
    const { profile, hero } = content;
    const home: Page = {
        path: '/',
        title: `${profile.name} · ${profile.role}`,
        description: `${hero.valueProposition} ${hero.location}.`,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: profile.name,
            jobTitle: profile.role,
            url: `${siteUrl}${localizedPath(locale, '/')}`,
            address: { '@type': 'PostalAddress', addressLocality: 'Caracas', addressCountry: 'VE' },
            sameAs: [profile.linkedin, profile.github],
        },
    };
    const caseStudies: Page[] = content.projects.map((p) => ({
        path: projectPath(p.id),
        title: `${p.title} · ${CASE_STUDY[locale]} · ${profile.name}`,
        description: p.caseStudy.summary,
    }));
    return [home, ...caseStudies];
}

function headTags(page: Page, locale: Locale, siteUrl: string) {
    const url = (l: Locale) => `${siteUrl}${localizedPath(l, page.path)}`;
    const other: Locale = locale === 'es' ? 'en' : 'es';
    const tags = [
        `<link rel="canonical" href="${url(locale)}" />`,
        ...LOCALES.map((l) => `<link rel="alternate" hreflang="${l}" href="${url(l)}" />`),
        `<link rel="alternate" hreflang="x-default" href="${url('es')}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
        `<meta property="og:url" content="${url(locale)}" />`,
        `<meta property="og:locale" content="${OG_LOCALE[locale]}" />`,
        `<meta property="og:locale:alternate" content="${OG_LOCALE[other]}" />`,
        // Pasa a summary_large_image cuando lleguen las imágenes OG (Fase 2).
        `<meta name="twitter:card" content="summary" />`,
    ];
    if (page.jsonLd)
        tags.push(`<script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>`);
    return tags.map((t) => `        ${t}`).join('\n');
}

function renderPage(indexHtml: string, page: Page, locale: Locale, siteUrl: string) {
    return indexHtml
        .replace(/<html lang="[^"]*">/, `<html lang="${locale}">`)
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
        .replace(
            /<meta name="description" content="[^"]*" \/>/,
            `<meta name="description" content="${escapeHtml(page.description)}" />`,
        )
        .replace('</head>', `${headTags(page, locale, siteUrl)}\n    </head>`);
}

function sitemap(siteUrl: string) {
    const paths = routePaths(CONTENT.projects.map((p) => p.id));
    const urls = paths.flatMap((path) =>
        LOCALES.map((locale) => {
            const alternates = LOCALES.map(
                (l) =>
                    `    <xhtml:link rel="alternate" hreflang="${l}" href="${siteUrl}${localizedPath(l, path)}" />`,
            ).join('\n');
            return `  <url>\n    <loc>${siteUrl}${localizedPath(locale, path)}</loc>\n${alternates}\n  </url>`;
        }),
    );
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

export function buildSiteArtifacts({ indexHtml, siteUrl, today }: Options): Record<string, string> {
    const files: Record<string, string> = {};
    for (const locale of LOCALES) {
        for (const page of pagesFor(locale, siteUrl, today)) {
            files[fileOf(localizedPath(locale, page.path))] = renderPage(
                indexHtml,
                page,
                locale,
                siteUrl,
            );
        }
    }
    files['sitemap.xml'] = sitemap(siteUrl);
    files['robots.txt'] = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
    return files;
}
