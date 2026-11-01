import React from 'react';
import {
    CLIMA_SOURCE,
    formatHour,
    formatTemperature,
    useCaracasClock,
    useClima,
    type Estado,
} from '@lib/clima';
import { useI18n } from '@lib/i18n';

const ICONS: Record<Estado, string> = {
    despejado:
        'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
    parcial:
        'M8 4v2M3 9h2M4.5 5.5 6 7M11 7a4 4 0 0 0-6 4M8 19h9a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0 2 6Z',
    nublado: 'M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18Z',
    lluvia: 'M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 14ZM8 18l-1 3M12 18l-1 3M16 18l-1 3',
    tormenta: 'M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 14ZM13 12l-3 5h4l-3 5',
};

const Separator: React.FC = () => <span aria-hidden="true">·</span>;

/**
 * El Indicador: la hora y el Clima de Caracas. Lleva superficie propia, así que no depende del cielo.
 * Sin `aria-live`: un lector de pantalla no tiene por qué anunciar cada minuto.
 */
export const CaracasIndicator: React.FC = () => {
    const { t, locale } = useI18n();
    const clock = useCaracasClock();
    const clima = useClima();
    return (
        <p className="-mt-2">
            <span
                data-indicador
                className="inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink md:text-sm"
            >
                <span className="sr-only">{t('indicator_prefix')}</span>
                {clima && (
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d={ICONS[clima.estado]} />
                    </svg>
                )}
                <time dateTime={formatHour(clock, 'es')}>{formatHour(clock, locale)}</time>
                {clima && (
                    <>
                        <Separator />
                        <span>{formatTemperature(clima.temperatura, locale)}</span>
                        <Separator />
                        <span>{t(`clima_${clima.estado}`)}</span>
                        <Separator />
                        <a
                            href={CLIMA_SOURCE.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-normal underline underline-offset-2"
                        >
                            {CLIMA_SOURCE.name}
                        </a>
                    </>
                )}
            </span>
        </p>
    );
};
