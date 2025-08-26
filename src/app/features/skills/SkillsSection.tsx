import React from 'react';
import { useI18n } from '@lib/i18n';

import { SKILL_CATEGORIES } from './data';

export const SkillsSection: React.FC = () => {
  const { t } = useI18n();
  return (
    <section id="skills" className="space-y-6" aria-label={t('skills_aria')}>
      <h2 className="text-2xl font-semibold flex items-center gap-3">
        {t('skills_title')} <span className="h-px grow bg-slate-700" />
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {SKILL_CATEGORIES.map((cat) => (
          <div key={cat.name} className="space-y-2">
            <h3 className="text-sm uppercase tracking-wide text-slate-400">{cat.name}</h3>
            <ul
              className="flex flex-wrap gap-2"
              aria-label={`${t('skills_list_prefix')} ${cat.name}`}
            >
              {cat.items.map((item) => (
                <li
                  key={item}
                  className="text-[10px] uppercase tracking-wide bg-slate-800/80 px-2 py-1 rounded-full text-slate-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
