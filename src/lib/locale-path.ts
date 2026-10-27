import type { Locale } from '@/content';

// El idioma vive en la URL: español en la raíz, inglés bajo /en.
const EN_PREFIX = '/en';

/** Ruta de `path` (siempre en su forma en español, p. ej. "/projects/x") en el idioma pedido. */
export function localizedPath(locale: Locale, path: string): string {
    if (locale === 'es') return path;
    return path === '/' ? EN_PREFIX : `${EN_PREFIX}${path}`;
}

export function localeOfPath(pathname: string): Locale {
    return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? 'en' : 'es';
}

/** La misma página en el otro idioma. */
export function switchLocalePath(pathname: string): string {
    if (localeOfPath(pathname) === 'en') return pathname.slice(EN_PREFIX.length) || '/';
    return localizedPath('en', pathname);
}

/** Rutas de la app en su forma en español: la Home y un Caso de estudio por Proyecto. */
export const routePaths = (projectIds: string[]) => [
    '/',
    ...projectIds.map((id) => `/projects/${id}`),
];

export const cvPath = (locale: Locale) => `/cv-diego-rangel-${locale}.pdf`;
