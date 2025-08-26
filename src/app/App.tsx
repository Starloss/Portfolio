import React from 'react';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';
import { useTheme } from '@lib/theme';

import { SITE_AUTHOR, SITE_HEADLINE, SITE_LOCATION } from './config/site';
import { ProjectsList } from './features/projects/ProjectsList';
import { SkillsSection } from './features/skills/SkillsSection';
import { ExperienceSection } from './features/experience/ExperienceSection';
import { ContactSection } from './features/contact/ContactSection';

export const App: React.FC = () => {
  const { t, switchLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <header className="px-6 pt-14 pb-10 text-center space-y-3 bg-slate-100/40 dark:bg-transparent transition-colors">
        <div className="flex justify-end gap-2 max-w-5xl mx-auto">
          <button
            onClick={toggleTheme}
            aria-label="toggle theme"
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
          </button>
          <button
            onClick={switchLocale}
            aria-label="cambiar idioma"
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            {t('lang_toggle')}
          </button>
          <a
            href="/cv.pdf"
            className="text-xs px-2 py-1 rounded bg-brand-500 text-white hover:bg-brand-400 transition"
            download
          >
            {t('cv_button')}
          </a>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {t('hero_greeting')} <span className="text-brand-400">{SITE_AUTHOR}</span>
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          {SITE_HEADLINE}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {SITE_LOCATION}
        </p>
        {/* Social links moved to contact section */}
      </header>
      <main className="px-6 max-w-5xl mx-auto space-y-24 pb-24">
        <section id="about" className="space-y-4" aria-label={t('about_aria')}>
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            {t('about_title')} <span className="h-px grow bg-slate-700" />
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">
            {t('professional_summary')}
          </p>
        </section>
        <SkillsSection />
        <ExperienceSection />
        <section id="projects" className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            {t('projects_title')} <span className="h-px grow bg-slate-700" />
          </h2>
          <ProjectsList />
        </section>
        <ContactSection />
      </main>
      <footer className="text-center text-xs text-slate-600 dark:text-slate-500 pb-10">
        © {currentYear()} {SITE_AUTHOR}
      </footer>
    </>
  );
};
