import React from 'react';
import { useI18n } from '@lib/i18n';
import {
    SITE_AUTHOR,
    SITE_EXPERIENCE,
    SITE_HEADLINE,
    SITE_LOCATION,
    SITE_ROLE,
} from '@app/config/site';

export const Hero: React.FC = () => {
    const { t } = useI18n();
    return (
        <section aria-label="hero" className="text-center space-y-3 py-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-800 dark:text-white">
                {t('hero_greeting')} <span className="text-brand-400">{SITE_AUTHOR}</span>
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
                <span className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 border border-brand-300/80 dark:bg-brand-500/15 dark:text-brand-200 dark:border-brand-400/40">
                    {SITE_ROLE}
                </span>
                <span className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800/90 dark:text-slate-100 dark:border-slate-700">
                    {SITE_EXPERIENCE}
                </span>
            </div>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                {SITE_HEADLINE}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                {SITE_LOCATION}
            </p>
        </section>
    );
};
