import React, { useEffect, useState } from 'react';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';

import { Hero } from '../components/Hero';
import { BackgroundScene } from '../components/BackgroundScene';
import { MainHeader } from '../components/MainHeader';
import { ProjectsList } from '../features/projects/ProjectsList';
import { SkillsSection } from '../features/skills/SkillsSection';
import { ExperienceSection } from '../features/experience/ExperienceSection';
import { ContactSection } from '../features/contact/ContactSection';

// Página Home con todo el contenido previo de App
export const Home: React.FC = () => {
    const { t } = useI18n();
    const [activeId, setActiveId] = useState<string>('about');

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined')
            return;
        const ids = ['about', 'skills', 'experience', 'projects', 'contact'];
        const observer = new window.IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '0px 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] },
        );
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const scrollToHashSection = () => {
            const hash = window.location.hash;
            if (!hash) return;
            const id = hash.replace('#', '');
            if (!id) return;
            const section = document.getElementById(id);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        const rafId = window.requestAnimationFrame(() => {
            window.setTimeout(scrollToHashSection, 0);
        });

        window.addEventListener('hashchange', scrollToHashSection);
        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener('hashchange', scrollToHashSection);
        };
    }, []);

    return (
        <>
            <BackgroundScene />
            <MainHeader activeId={activeId} isHome />
            <Hero />
            <main className="max-w-5xl mx-auto space-y-24 pb-24 px-6 md:px-8 py-8 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/55 backdrop-blur supports-[backdrop-filter]:bg-slate-100/55 dark:supports-[backdrop-filter]:bg-slate-900/45">
                <section id="about" className="space-y-4" aria-label={t('about_aria')}>
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-white">
                        {t('about_title')}{' '}
                        <span className="h-px grow bg-slate-300 dark:bg-slate-700" />
                    </h2>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                        {t('professional_summary')}
                    </p>
                </section>
                <SkillsSection />
                <ExperienceSection />
                <section id="projects" className="space-y-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-white">
                        {t('projects_title')}{' '}
                        <span className="h-px grow bg-slate-300 dark:bg-slate-700" />
                    </h2>
                    <ProjectsList />
                </section>
                <ContactSection />
            </main>
            <footer className="text-center text-xs text-slate-600 dark:text-slate-500 pb-10">
                © {currentYear()}
            </footer>
        </>
    );
};
