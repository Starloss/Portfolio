import React from 'react';
import { useI18n } from '@lib/i18n';

import { EXPERIENCE } from './data';

export const ExperienceSection: React.FC = () => {
  const { t, locale } = useI18n();
  return (
    <section id="experience" className="space-y-6" aria-label={t('experience_aria')}>
      <h2 className="text-2xl font-semibold flex items-center gap-3">
        {t('experience_title')} <span className="h-px grow bg-slate-700" />
      </h2>
      <ul className="space-y-8" aria-label="lista de experiencias">
        {EXPERIENCE.map((item) => {
          const period = locale === 'en' && item.period_en ? item.period_en : item.period;
          const location = locale === 'en' && item.location_en ? item.location_en : item.location;
          const bullets = locale === 'en' && item.bullets_en ? item.bullets_en : item.bullets;
          return (
            <li
              key={item.company + item.period}
              className="group rounded-lg border border-slate-800 p-5 bg-slate-900/40"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-lg font-semibold text-brand-400">
                  {item.role} · {item.company}
                </h3>
                <span className="text-xs text-slate-400">{period}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{location}</p>
              {item.tech && (
                <ul className="flex flex-wrap gap-1.5 mt-3" aria-label={t('experience_tech_aria')}>
                  {item.tech.map((tch) => (
                    <li
                      key={tch}
                      className="text-[10px] uppercase tracking-wide bg-slate-800/80 px-2 py-1 rounded-full text-slate-300"
                    >
                      {tch}
                    </li>
                  ))}
                </ul>
              )}
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-300">
                {bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
