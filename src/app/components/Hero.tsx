import React from 'react';
import { useI18n } from '@lib/i18n';
import { SITE_AUTHOR, SITE_HEADLINE, SITE_LOCATION } from '@app/config/site';

export const Hero: React.FC = () => {
  const { t } = useI18n();
  return (
    <section aria-label="hero" className="text-center space-y-3 py-10">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-800 dark:text-white">
        {t('hero_greeting')} <span className="text-brand-400">{SITE_AUTHOR}</span>
      </h1>
      <p className="mt-2 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
        {SITE_HEADLINE}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{SITE_LOCATION}</p>
    </section>
  );
};
