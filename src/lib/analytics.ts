import type { Locale } from '@/content';

// Señales de interés medidas con Umami (ver docs/adr/0002). El script vive en index.html y solo
// cuenta en el dominio de producción; aquí no se carga nada.
//
// Se llama a `umami.track` en vez de usar los atributos `data-umami-event`: con ellos el script
// cancela el clic de un enlace y navega a mano, y eso anula el atributo `download` del CV.

declare global {
    interface Window {
        umami?: { track: (event: string, data?: Record<string, string>) => unknown };
    }
}

export type ContactChannel = 'email' | 'linkedin';

const track = (event: string, data: Record<string, string>) => {
    try {
        window.umami?.track(event, data);
    } catch {
        // Medir nunca debe romper un clic.
    }
};

export const trackCvDownload = (lang: Locale) => track('cv-download', { lang });

export const trackContact = (channel: ContactChannel) => track('contact', { channel });

// Eventos técnicos de la Escena (ADR 0003). No son Señales de interés: dicen qué versión recibió
// el visitante y cuándo el vigilante la devolvió a la SVG.
export const trackEscena = (version: string, reason: string) =>
    track('escena', { version, reason });

export const trackEscenaFallback = (reason: string) => track('escena-caida', { reason });
