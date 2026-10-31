import type { EscenaReason, EscenaVersion } from '@app/scene/gl/detect';
import type { FallbackReason } from '@app/scene/gl/protocol';
import type { Theme } from '@lib/theme';

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
export const trackEscena = (version: EscenaVersion, reason: EscenaReason) =>
    track('escena', { version, reason });

export const trackEscenaFallback = (reason: FallbackReason) => track('escena-caida', { reason });

// Evento técnico del Clima (ADR 0005): no se pudo obtener. Es la señal para cambiar de fuente.
export type ClimaFailure = 'red' | 'respuesta';
export const trackClimaCaida = (motivo: ClimaFailure) => track('clima-caida', { motivo });

// Evento técnico del tema (ADR 0004): el visitante cambió el que correspondía a la hora de Caracas.
export const trackTemaElegido = (tema: Theme) => track('tema-elegido', { tema });
