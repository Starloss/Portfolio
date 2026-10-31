import React from 'react';
import { trackCvDownload } from '@lib/analytics';
import { useI18n } from '@lib/i18n';
import { cvPath } from '@lib/locale-path';
import { IndicadorColumna, IndicadorEsquina } from '../scene/prototype-indicador/Indicador';

/** Hero sin panel, en la franja de cielo de la Escena. */
export const Hero: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile } = content;
    return (
        <section id="hero" aria-label="hero" className="relative space-y-5 pt-12 text-center md:pt-20">
            <IndicadorEsquina />
            {/* Columna de texto hasta la línea de ubicación: la Escena la mantiene sobre cielo libre. */}
            <div data-hero-text className="mx-auto w-fit max-w-full space-y-3">
                <h1 className="text-4xl tracking-tight text-ink md:text-6xl">
                    {hero.greeting} <span className="text-ink">{profile.name}</span>
                </h1>
                <p>
                    <span className="inline-block rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink md:text-sm">
                        {profile.role}
                    </span>
                </p>
                <p className="mx-auto max-w-xl text-lg text-ink">{hero.valueProposition}</p>
                <p className="mx-auto max-w-xl text-sm text-ink">{hero.location}</p>
                <IndicadorColumna />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                <a
                    href={cvPath(locale)}
                    download
                    onClick={() => trackCvDownload(locale)}
                    className="rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                    {t('hero_cta_cv')}
                </a>
                <a
                    href="#contact"
                    className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary"
                >
                    {t('hero_cta_contact')}
                </a>
            </div>
        </section>
    );
};
