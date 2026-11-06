import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/archivo/wdth.css';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { formatHour, formatTemperature, useCaracasClock, useClima } from '@lib/clima';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, projectPath, switchLocalePath } from '@lib/locale-path';
import { useTheme } from '@lib/theme';

import { ProjectCover } from '../../features/projects/ProjectCover';

// PROTOTIPO (research/impeccable, mapa #104). Dirección "Línea Ávila–Bolívar": la página es una
// línea del Metro de Caracas, con la gramática de su señalética (Leufert y Nedo, 1983). Baja del
// Humboldt a la Avenida Bolívar como el Viaje de cámara; cada sección es una estación. El contenido
// va en placas de señalética planas, en una columna a la izquierda: la Escena queda a la vista.

const FONT = "'Archivo Variable', system-ui, sans-serif";
const RAIL = '#d7261e';
const SIGN_YELLOW = '#ffcd00';

const STATIONS = [
    { id: 'hero', es: 'Ávila', en: 'Ávila' },
    { id: 'impact', es: 'Impacto', en: 'Impact' },
    { id: 'experience', es: 'Experiencia', en: 'Experience' },
    { id: 'projects', es: 'Proyectos', en: 'Projects' },
    { id: 'skills', es: 'Habilidades', en: 'Skills' },
    { id: 'contact', es: 'Bolívar', en: 'Bolívar' },
] as const;

function useCurrentStation() {
    const [current, setCurrent] = useState<string>('hero');
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
            },
            { rootMargin: '-45% 0px -50% 0px' },
        );
        for (const s of STATIONS) {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, []);
    return current;
}

const Arrow: React.FC<{ dir?: 'down' | 'right' | 'up-right'; size?: number }> = ({
    dir = 'right',
    size = 18,
}) => {
    const rotate = { right: 0, down: 90, 'up-right': -45 }[dir];
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ transform: `rotate(${rotate}deg)`, flex: 'none' }}
        >
            <path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
    );
};

/** La franja de señalética de arriba: el mapa de la línea es la navegación. */
const LineStrip: React.FC<{ current: string }> = ({ current }) => {
    const { locale, t } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const { pathname, search } = useLocation();
    return (
        <header className="fixed inset-x-0 top-0 z-50 bg-[#141414] text-white">
            <div className="flex items-center gap-4 px-4 py-2.5 lg:px-[4vw]">
                <a href="#hero" className="flex items-center gap-2 font-bold tracking-tight">
                    <span className="h-3 w-8" style={{ background: RAIL }} aria-hidden="true" />
                    <span className="hidden sm:inline">Línea Ávila–Bolívar</span>
                </a>
                <nav aria-label={locale === 'es' ? 'Estaciones' : 'Stations'} className="flex-1">
                    <ol className="relative mx-auto flex max-w-3xl items-center justify-between">
                        <span
                            className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2"
                            style={{ background: RAIL }}
                            aria-hidden="true"
                        />
                        {STATIONS.map((s) => {
                            const active = s.id === current;
                            return (
                                <li key={s.id} className="relative">
                                    <a
                                        href={`#${s.id}`}
                                        aria-current={active ? 'location' : undefined}
                                        className="group flex items-center gap-2"
                                    >
                                        <span
                                            className="block h-4 w-4 rounded-full border-[3px] transition-transform"
                                            style={{
                                                borderColor: RAIL,
                                                background: active ? SIGN_YELLOW : '#fff',
                                                transform: active ? 'scale(1.35)' : undefined,
                                            }}
                                        />
                                        <span
                                            className={`hidden bg-[#141414] pr-2 text-sm lg:inline ${active ? 'font-bold text-white' : 'text-white/70 group-hover:text-white'}`}
                                        >
                                            {s[locale]}
                                        </span>
                                        <span className="sr-only lg:hidden">{s[locale]}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ol>
                </nav>
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="hidden px-1 text-sm text-white/80 underline-offset-4 hover:text-white hover:underline sm:block"
                >
                    {theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
                </button>
                <Link
                    to={`${switchLocalePath(pathname)}${search}`}
                    className="text-sm font-bold text-white/80 hover:text-white"
                >
                    {locale === 'es' ? 'EN' : 'ES'}
                </Link>
            </div>
        </header>
    );
};

/** El letrero de una estación: es el título de la sección, con su número de parada. */
const StationSign: React.FC<{ n: number; children: React.ReactNode; terminal?: boolean }> = ({
    n,
    children,
    terminal,
}) => (
    <h2
        className="relative flex items-stretch bg-[#141414] text-white"
        style={{ fontVariationSettings: "'wdth' 80" }}
    >
        <span
            className="grid w-14 flex-none place-items-center text-2xl font-black tabular-nums"
            style={{ background: RAIL }}
        >
            {n}
        </span>
        <span className="flex flex-1 items-center justify-between gap-4 px-4 py-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            {children}
            {!terminal && (
                <span className="flex items-center gap-1 text-sm font-semibold text-white/75">
                    <Arrow dir="down" size={14} />
                    Bolívar
                </span>
            )}
        </span>
    </h2>
);

/** Una estación: el punto sobre el riel, el letrero y la placa de información. */
const Station: React.FC<{
    id: string;
    n: number;
    title: string;
    terminal?: boolean;
    children: React.ReactNode;
}> = ({ id, n, title, terminal, children }) => (
    <section id={id} aria-label={title} className="relative scroll-mt-20">
        <span
            className="absolute top-3 h-6 w-6 rounded-full border-[5px] bg-white"
            style={{ left: '-2.4rem', borderColor: RAIL }}
            aria-hidden="true"
        />
        <StationSign n={n} terminal={terminal}>
            {title}
        </StationSign>
        <div className="bg-[var(--placa)] p-5 text-[var(--tinta)] md:p-7">{children}</div>
    </section>
);

/** El tablero del andén: la hora y el Clima reales de Caracas. */
const PlatformBoard: React.FC = () => {
    const { locale, t } = useI18n();
    const clock = useCaracasClock();
    const clima = useClima();
    return (
        <p
            className="inline-flex items-baseline gap-3 self-start bg-[#141414] px-4 py-2 text-lg font-bold tabular-nums"
            style={{ color: '#ffb000' }}
        >
            <span>{formatHour(clock, locale)}</span>
            {clima && (
                <>
                    <span aria-hidden="true">·</span>
                    <span>{formatTemperature(clima.temperatura, locale)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t(`clima_${clima.estado}`)}</span>
                </>
            )}
            <span className="text-sm font-semibold text-white/70">Caracas</span>
        </p>
    );
};

export const LineaAvilaBolivar: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile, keyFigures, experiences, projects, featuredProjects, skills } = content;
    const current = useCurrentStation();
    const linkOf = (b: (typeof keyFigures)[number]['backing']) =>
        b.kind === 'project' && b.id
            ? localizedPath(locale, projectPath(b.id))
            : b.kind === 'experience'
              ? '#experience'
              : '#experience';

    return (
        <div
            className="[&_:is(h1,h2,h3)]:[font-family:inherit] [--placa:#f4f4ef] [--tinta:#141414] [--tenue:#4a4a46] dark:[--placa:#0d0f14] dark:[--tinta:#eef0f2] dark:[--tenue:#a9aeb6] selection:bg-[#ffcd00] selection:text-black"
            style={{ fontFamily: FONT }}
        >
            <LineStrip current={current} />

            {/* El riel corre toda la página, a la izquierda de la columna. */}
            <main className="relative mx-4 max-w-[36rem] pl-10 lg:ml-[6vw]">
                <span
                    className="absolute bottom-0 left-3 top-[100svh] w-1.5"
                    style={{ background: RAIL }}
                    aria-hidden="true"
                />

                {/* Estación 1: el primer viewport es la Escena; la firma se apoya abajo. */}
                <section
                    id="hero"
                    aria-label={profile.name}
                    className="-ml-10 flex min-h-[100svh] flex-col justify-end gap-5 pb-20 pt-24"
                >
                    <h1
                        className="text-[clamp(3.5rem,13vw,7.5rem)] font-black leading-[0.86] tracking-[-0.03em] text-[#10110f] dark:text-[#f4f5f0]"
                        style={{ fontVariationSettings: "'wdth' 72" }}
                    >
                        {profile.name}
                    </h1>
                    <div className="max-w-[30rem] bg-[var(--placa)] p-5 text-[var(--tinta)]">
                        <p className="text-sm font-bold uppercase tracking-wide text-[var(--tenue)]">
                            {profile.role} · {hero.location}
                        </p>
                        <p className="mt-2 text-xl font-semibold leading-snug">
                            {hero.valueProposition}
                        </p>
                    </div>
                    <PlatformBoard />
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <a
                            href={cvPath(locale)}
                            download
                            onClick={() => trackCvDownload(locale)}
                            className="inline-flex items-center gap-3 px-5 py-3 text-lg font-extrabold text-black hover:brightness-95"
                            style={{ background: SIGN_YELLOW }}
                        >
                            {t('hero_cta_cv')}
                            <Arrow dir="down" />
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-2 bg-[#141414] px-4 py-3 font-bold text-white hover:bg-black"
                        >
                            {t('hero_cta_contact')}
                            <Arrow />
                        </a>
                    </div>
                </section>

                <div className="space-y-[55vh] pb-[45vh] md:space-y-[45vh]">
                    <Station id="impact" n={2} title={t('impact_title')}>
                        <dl className="divide-y divide-black/15 dark:divide-white/15">
                            {keyFigures.map((f) => (
                                <div
                                    key={f.label}
                                    className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 py-3"
                                >
                                    <dt
                                        className="text-right text-4xl font-black tabular-nums tracking-tight"
                                        style={{
                                            fontVariationSettings: "'wdth' 75",
                                            color: RAIL,
                                        }}
                                    >
                                        {f.value}
                                    </dt>
                                    <dd>
                                        <span className="block text-lg font-semibold">
                                            {f.label}
                                        </span>
                                        {linkOf(f.backing).startsWith('#') ? (
                                            <a
                                                href={linkOf(f.backing)}
                                                className="text-sm text-[var(--tenue)] underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </a>
                                        ) : (
                                            <Link
                                                to={linkOf(f.backing)}
                                                className="text-sm text-[var(--tenue)] underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </Link>
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Station>

                    <Station id="experience" n={3} title={t('experience_title')}>
                        <ol className="space-y-6">
                            {experiences.map((e) => {
                                const project = projects.find((p) => p.experienceId === e.id);
                                return (
                                    <li key={e.id}>
                                        <p className="text-sm font-semibold tabular-nums text-[var(--tenue)]">
                                            {e.period}
                                        </p>
                                        <h3 className="text-xl font-extrabold tracking-tight">
                                            {e.role} · {e.company}
                                        </h3>
                                        <ul className="mt-1 space-y-1 leading-relaxed">
                                            {e.achievements.slice(0, 2).map((a) => (
                                                <li key={a}>{a}</li>
                                            ))}
                                        </ul>
                                        {project && (
                                            <Link
                                                to={localizedPath(locale, projectPath(project.id))}
                                                className="mt-2 inline-flex items-center gap-1.5 font-bold underline-offset-4 hover:underline"
                                                style={{ color: RAIL }}
                                            >
                                                {project.title}
                                                <Arrow size={14} />
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </Station>

                    <Station id="projects" n={4} title={t('projects_title')}>
                        <ul className="space-y-8">
                            {featuredProjects.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        to={localizedPath(locale, projectPath(p.id))}
                                        className="group block"
                                    >
                                        <ProjectCover
                                            project={p}
                                            sizes="(min-width: 768px) 520px, 100vw"
                                            lazy
                                        />
                                        <h3 className="mt-3 flex items-center gap-2 text-2xl font-extrabold tracking-tight group-hover:underline group-hover:underline-offset-4">
                                            {p.title}
                                            <Arrow />
                                        </h3>
                                        <p className="mt-1 leading-relaxed text-[var(--tenue)]">
                                            {p.caseStudy.summary}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Station>

                    <Station id="skills" n={5} title={t('skills_title')}>
                        <dl className="space-y-3">
                            {skills.map((s) => (
                                <div key={s.name}>
                                    <dt className="font-extrabold">{s.name}</dt>
                                    <dd className="leading-relaxed text-[var(--tenue)]">
                                        {s.items.join(' · ')}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Station>

                    <Station id="contact" n={6} title={t('contact_title')} terminal>
                        <p className="text-xl font-semibold">{t('contact_phrase')}</p>
                        <ul className="mt-4 divide-y divide-black/15 dark:divide-white/15 text-lg font-bold">
                            {[
                                {
                                    href: `mailto:${profile.email}`,
                                    label: profile.email,
                                    onClick: () => trackContact('email'),
                                },
                                {
                                    href: profile.linkedin,
                                    label: 'LinkedIn',
                                    onClick: () => trackContact('linkedin'),
                                },
                                { href: profile.github, label: 'GitHub' },
                            ].map((c) => (
                                <li key={c.label}>
                                    <a
                                        href={c.href}
                                        onClick={c.onClick}
                                        className="flex items-center justify-between py-3 hover:underline hover:underline-offset-4"
                                    >
                                        {c.label}
                                        <Arrow dir="up-right" />
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a
                                    href={cvPath(locale)}
                                    download
                                    onClick={() => trackCvDownload(locale)}
                                    className="flex items-center justify-between py-3 hover:underline hover:underline-offset-4"
                                >
                                    {t('cv_button')}
                                    <Arrow dir="down" />
                                </a>
                            </li>
                        </ul>
                    </Station>
                </div>
            </main>
        </div>
    );
};
