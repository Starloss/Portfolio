import React, { useEffect, useRef, useState } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, switchLocalePath } from '@lib/locale-path';
import { useTheme } from '@lib/theme';

import { LOCALES } from '@/content';

interface MainHeaderProps {
    activeId?: string;
    isHome?: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ activeId, isHome = false }) => {
    const { t, locale } = useI18n();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        function onClick(event: MouseEvent) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        window.addEventListener('click', onClick);
        return () => window.removeEventListener('click', onClick);
    }, [menuOpen]);

    const navItems: { id: string; label: string }[] = [
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

    const buildHref = (id: string) => (isHome ? `#${id}` : `${localizedPath(locale, '/')}#${id}`);

    const controlButtonClass =
        'h-9 min-w-9 px-2.5 inline-flex items-center justify-center rounded-xl border border-slate-300/90 bg-white/80 text-slate-700 shadow-sm hover:bg-white hover:border-brand-300 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-brand-400';

    return (
        <header
            className={`sticky top-0 z-50 px-4 md:px-6 py-3 bg-slate-100/90 dark:bg-slate-900/80 border-b border-slate-200/70 dark:border-slate-800 transition-colors ${scrolled ? 'shadow-sm' : ''}`}
        >
            <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
                <div className="flex-1 flex items-center gap-4">
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMenuOpen((open) => !open)}
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
                                    {isHome ? (
                                        <a
                                            href={buildHref(item.id)}
                                            onClick={() => setMenuOpen(false)}
                                            className={`${activeId === item.id ? linkActive : linkInactive} ${linkBase}`}
                                            aria-current={activeId === item.id ? 'page' : undefined}
                                        >
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link
                                            to={buildHref(item.id)}
                                            onClick={() => setMenuOpen(false)}
                                            className={`${activeId === item.id ? linkActive : linkInactive} ${linkBase}`}
                                            aria-current={activeId === item.id ? 'page' : undefined}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
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
                        className={controlButtonClass}
                    >
                        {theme === 'dark' ? (
                            <FiSun className="w-4 h-4" />
                        ) : (
                            <FiMoon className="w-4 h-4" />
                        )}
                    </button>
                    <nav
                        aria-label={t('language')}
                        className="flex items-center text-xs font-semibold"
                    >
                        {LOCALES.map((l, i) => (
                            <React.Fragment key={l}>
                                {i > 0 && (
                                    <span aria-hidden="true" className="px-1 text-slate-400">
                                        /
                                    </span>
                                )}
                                {l === locale ? (
                                    <span
                                        aria-current="true"
                                        className="px-1.5 py-1 text-brand-700 dark:text-brand-300"
                                    >
                                        {l.toUpperCase()}
                                    </span>
                                ) : (
                                    <Link
                                        to={`${switchLocalePath(location.pathname)}${location.hash}`}
                                        hrefLang={l}
                                        lang={l}
                                        className={`${linkInactive} ${linkBase} py-1`}
                                    >
                                        {l.toUpperCase()}
                                    </Link>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                    <a
                        href={cvPath(locale)}
                        download
                        className="text-xs px-3 h-9 inline-flex items-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-brand-500 border-brand-400 bg-brand-500 text-white hover:bg-brand-400"
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
                                {isHome ? (
                                    <a
                                        href={buildHref(item.id)}
                                        onClick={() => setMenuOpen(false)}
                                        className={`block w-full text-left ${
                                            activeId === item.id ? linkActive : linkInactive
                                        } ${linkBase}`}
                                        aria-current={activeId === item.id ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </a>
                                ) : (
                                    <Link
                                        to={buildHref(item.id)}
                                        onClick={() => setMenuOpen(false)}
                                        className={`block w-full text-left ${
                                            activeId === item.id ? linkActive : linkInactive
                                        } ${linkBase}`}
                                        aria-current={activeId === item.id ? 'page' : undefined}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </header>
    );
};
