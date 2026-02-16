import React, { useEffect, useRef, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';
import { useTheme } from '@lib/theme';

import { Hero } from '../components/Hero';
import { BackgroundScene } from '../components/BackgroundScene';
import { ProjectsList } from '../features/projects/ProjectsList';
import { SkillsSection } from '../features/skills/SkillsSection';
import { ExperienceSection } from '../features/experience/ExperienceSection';
import { ContactSection } from '../features/contact/ContactSection';

// Página Home con todo el contenido previo de App
export const Home: React.FC = () => {
    const { t, switchLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeId, setActiveId] = useState<string>('about');
    const [scrolled, setScrolled] = useState(false);
    // Referencia del contenedor del menú móvil
    const mobileMenuRef = useRef<HTMLDivElement | null>(null);

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
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navItems: { id: string; label: string }[] = [
        { id: 'about', label: t('about_title') },
        { id: 'skills', label: t('skills_title') },
        { id: 'experience', label: t('experience_title') },
        { id: 'projects', label: t('projects_title') },
        { id: 'contact', label: t('contact_title') },
    ];

    const linkBase =
        'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1';
    const linkInactive = 'text-slate-700 dark:text-slate-300 hover:text-brand-600/90';
    const linkActive =
        'text-brand-700 dark:text-brand-300 font-semibold bg-brand-100/70 dark:bg-brand-400/10 px-2 py-1 rounded-full';

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        if (!menuOpen) return;
        function onClick(e: MouseEvent) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        window.addEventListener('click', onClick);
        return () => window.removeEventListener('click', onClick);
    }, [menuOpen]);
    return (
        <>
            <BackgroundScene />
            <header
                className={`sticky top-0 z-50 px-4 md:px-6 py-3 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-slate-100/60 dark:supports-[backdrop-filter]:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800 transition-colors ${scrolled ? 'shadow-sm' : ''}`}
            >
                <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-4">
                        {/* Botón móvil */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-expanded={menuOpen}
                                aria-label={menuOpen ? t('nav_menu_close') : t('nav_menu_open')}
                                className="p-2 rounded bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                            >
                                <span className="sr-only">
                                    {menuOpen ? t('nav_menu_close') : t('nav_menu_open')}
                                </span>
                                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                                    <span
                                        className={`h-0.5 w-full bg-current transition-transform ${
                                            menuOpen ? 'translate-y-1.5 rotate-45' : ''
                                        }`}
                                    />
                                    <span
                                        className={`h-0.5 w-full bg-current transition-opacity ${
                                            menuOpen ? 'opacity-0' : ''
                                        }`}
                                    />
                                    <span
                                        className={`h-0.5 w-full bg-current transition-transform ${
                                            menuOpen ? '-translate-y-1.5 -rotate-45' : ''
                                        }`}
                                    />
                                </div>
                            </button>
                        </div>
                        <nav aria-label="main" className="hidden md:block">
                            <ul className="flex flex-wrap gap-4 text-sm font-medium justify-start">
                                {navItems.map((item) => (
                                    <li key={item.id}>
                                        <a
                                            href={`#${item.id}`}
                                            onClick={() => setMenuOpen(false)}
                                            className={`${activeId === item.id ? linkActive : linkInactive} ${linkBase}`}
                                            aria-current={activeId === item.id ? 'page' : undefined}
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            aria-label={
                                theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')
                            }
                            className="px-2 py-1 rounded bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 flex items-center justify-center"
                        >
                            {theme === 'dark' ? (
                                <FiSun className="w-4 h-4" />
                            ) : (
                                <FiMoon className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={switchLocale}
                            aria-label={t('lang_toggle')}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 flex items-center justify-center"
                        >
                            <span
                                aria-hidden="true"
                                className={`fi text-base leading-none ${t('lang_toggle') === 'EN' ? 'fi-gb' : 'fi-es'}`}
                            />
                        </button>
                        <a
                            href="/cv.pdf"
                            className="text-xs px-2 py-1 rounded bg-brand-500 text-white hover:bg-brand-400 transition"
                            download
                        >
                            {t('cv_button')}
                        </a>
                    </div>
                </div>
                {menuOpen && (
                    <nav
                        aria-label="mobile"
                        className="md:hidden mt-3 animate-fade-in"
                        ref={mobileMenuRef}
                    >
                        <ul className="flex flex-col gap-2 text-sm font-medium items-start w-full">
                            {navItems.map((item) => (
                                <li key={item.id} className="w-full">
                                    <a
                                        href={`#${item.id}`}
                                        onClick={() => setMenuOpen(false)}
                                        className={`block w-full text-left ${
                                            activeId === item.id ? linkActive : linkInactive
                                        } ${linkBase}`}
                                        aria-current={activeId === item.id ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </header>
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
