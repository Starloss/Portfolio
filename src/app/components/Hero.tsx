import React from 'react';
import { useI18n } from '@lib/i18n';
import { cvPath } from '@lib/locale-path';

export const Hero: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile } = content;
    return (
        <section id="hero" aria-label="hero" className="text-center space-y-3 py-10">
            {/* Columna de texto hasta la línea de ubicación: la Escena la mantiene sobre cielo libre. */}
            <div data-hero-text className="mx-auto w-fit max-w-full space-y-3">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {hero.greeting}{' '}
                    <span className="text-brand-800 dark:text-brand-400">{profile.name}</span>
                </h1>
                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
                    <span className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 border border-brand-300/80 dark:bg-brand-500/15 dark:text-brand-200 dark:border-brand-400/40">
                        {profile.role}
                    </span>
                </div>
                <p className="mt-2 text-lg text-slate-800 dark:text-slate-300 max-w-xl mx-auto">
                    {hero.valueProposition}
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-300 max-w-xl mx-auto">
                    {hero.location}
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
                <a
                    href={cvPath(locale)}
                    download
                    className="text-sm px-4 py-2 rounded-xl border border-brand-400 bg-brand-500 text-white hover:bg-brand-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    {t('hero_cta_cv')}
                </a>
                <a
                    href="#contact"
                    className="text-sm px-4 py-2 rounded-xl border border-slate-300 bg-white/80 text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                >
                    {t('hero_cta_contact')}
                </a>
            </div>
        </section>
    );
};
