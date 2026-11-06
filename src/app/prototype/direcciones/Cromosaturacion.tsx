import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/epilogue';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { formatHour, formatTemperature, useCaracasClock, useClima } from '@lib/clima';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, projectPath, switchLocalePath } from '@lib/locale-path';
import { usePrefersReducedMotion } from '@lib/motion';
import { useTheme } from '@lib/theme';

import { ProjectCover } from '../../features/projects/ProjectCover';

// PROTOTIPO (research/impeccable, mapa #104). Dirección "Cromosaturación": el mundo de Carlos
// Cruz-Diez, el del piso de Maiquetía que cruza todo el que sale de Venezuela. La Escena se ve a
// través de franjas de inducción cromática que se desplazan con el scroll (Physichromie), y cada
// sección es una cámara de color saturado a todo el ancho, como sus Cromosaturaciones.

const FONT = "'Epilogue Variable', system-ui, sans-serif";

const CHAMBERS = {
    impact: { bg: '#e3262f', ink: '#0b0b0b' },
    experience: { bg: '#00a651', ink: '#0b0b0b' },
    projects: { bg: '#0057b8', ink: '#ffffff' },
    skills: { bg: '#f5f3ee', ink: '#0b0b0b' },
    contact: { bg: '#ffd400', ink: '#0b0b0b' },
} as const;

type ChamberId = keyof typeof CHAMBERS;

/** Franjas finas de rojo, verde y azul sobre la Escena; se corren con el scroll. */
const InductionField: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = usePrefersReducedMotion();
    useEffect(() => {
        if (reduce) return;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                ref.current?.style.setProperty('--shift', `${window.scrollY * 0.12}px`);
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, [reduce]);
    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 opacity-45 mix-blend-hard-light dark:opacity-30"
            style={{
                backgroundImage:
                    'repeating-linear-gradient(90deg, #e3262f 0 2px, transparent 2px 7px, #00a651 7px 9px, transparent 9px 14px, #0057b8 14px 16px, transparent 16px 21px)',
                backgroundPositionX: 'var(--shift, 0px)',
                maskImage:
                    'linear-gradient(to bottom, black 0%, transparent 38%, transparent 62%, black 100%)',
            }}
        />
    );
};

/** El borde de una cámara: el color se deshace en franjas hacia la Escena. */
const ChamberEdge: React.FC<{ color: string; flip?: boolean }> = ({ color, flip }) => (
    <div
        aria-hidden="true"
        className="h-16"
        style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 10px)`,
            maskImage: `linear-gradient(${flip ? 'to top' : 'to bottom'}, transparent, black)`,
        }}
    />
);

const Chamber: React.FC<{ id: ChamberId; title: string; children: React.ReactNode }> = ({
    id,
    title,
    children,
}) => {
    const { bg, ink } = CHAMBERS[id];
    return (
        <section id={id} aria-label={title} className="relative z-10 scroll-mt-16">
            <ChamberEdge color={bg} />
            <div style={{ background: bg, color: ink }} className="px-5 py-14 md:px-[6vw] md:py-20">
                <h2 className="text-[clamp(2.75rem,8vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.035em]">
                    {title}
                </h2>
                <div className="mt-10">{children}</div>
            </div>
            <ChamberEdge color={bg} flip />
        </section>
    );
};

const Arrow: React.FC<{ rotate?: number }> = ({ rotate = 0 }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ transform: `rotate(${rotate}deg)`, flex: 'none' }}
    >
        <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
);

const TopBar: React.FC = () => {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const { pathname, search } = useLocation();
    const labels: Record<ChamberId, string> = {
        impact: t('impact_title'),
        experience: t('experience_title'),
        projects: t('projects_title'),
        skills: t('skills_title'),
        contact: t('contact_title'),
    };
    return (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center gap-4 bg-[#0b0b0b] px-4 py-2 text-white md:px-[6vw]">
            <a href="#hero" className="font-extrabold tracking-tight">
                Diego Rangel
            </a>
            <nav aria-label={locale === 'es' ? 'Secciones' : 'Sections'} className="flex-1">
                <ul className="flex items-center justify-end gap-1 md:justify-center md:gap-5">
                    {(Object.keys(CHAMBERS) as ChamberId[]).map((id) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className="group flex items-center gap-2 py-1 text-sm"
                            >
                                <span
                                    className="block h-4 w-4 md:h-2.5 md:w-6"
                                    style={{ background: CHAMBERS[id].bg }}
                                    aria-hidden="true"
                                />
                                <span className="sr-only md:not-sr-only md:text-white/80 md:group-hover:text-white">
                                    {labels[id]}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <button
                type="button"
                onClick={toggleTheme}
                className="hidden text-sm text-white/80 hover:text-white sm:block"
            >
                {theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
            </button>
            <Link
                to={`${switchLocalePath(pathname)}${search}`}
                className="text-sm font-bold text-white/80 hover:text-white"
            >
                {locale === 'es' ? 'EN' : 'ES'}
            </Link>
        </header>
    );
};

export const Cromosaturacion: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile, keyFigures, experiences, projects, featuredProjects, skills } = content;
    const clock = useCaracasClock();
    const clima = useClima();

    return (
        <div
            style={{ fontFamily: FONT }}
            className="selection:bg-[#ffd400] selection:text-black [&_:is(h1,h2,h3)]:[font-family:inherit]"
        >
            <InductionField />
            <TopBar />
            <main className="relative">
                {/* Primer viewport: arriba, una franja negra cortada por líneas de color con el nombre,
                    como una Inducción cromática; abajo, la Escena con el Ávila. */}
                <section
                    id="hero"
                    aria-label={profile.name}
                    className="relative z-10 flex min-h-[100svh] flex-col justify-start pt-10"
                >
                    <div
                        className="relative bg-[#0b0b0b] px-5 pb-10 pt-8 text-white md:px-[6vw]"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(90deg, transparent 0 22px, rgba(227,38,47,0.85) 22px 24px, transparent 24px 46px, rgba(0,166,81,0.85) 46px 48px, transparent 48px 70px, rgba(0,87,184,0.95) 70px 72px)',
                        }}
                    >
                        <h1 className="text-[clamp(3.5rem,14vw,10.5rem)] font-extrabold leading-[0.82] tracking-[-0.04em]">
                            {profile.name}
                        </h1>
                        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                            <div className="max-w-[34rem] bg-[#0b0b0b] pr-4">
                                <p className="text-sm font-bold uppercase tracking-wider text-white/70">
                                    {profile.role} · {hero.location}
                                </p>
                                <p className="mt-2 text-xl leading-snug md:text-2xl">
                                    {hero.valueProposition}
                                </p>
                                <p className="mt-3 text-sm tabular-nums text-white/75">
                                    Caracas {formatHour(clock, locale)}
                                    {clima &&
                                        ` · ${formatTemperature(clima.temperatura, locale)} · ${t(`clima_${clima.estado}`)}`}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={cvPath(locale)}
                                    download
                                    onClick={() => trackCvDownload(locale)}
                                    className="inline-flex items-center gap-3 bg-[#ffd400] px-6 py-4 text-lg font-extrabold text-black hover:bg-white"
                                >
                                    {t('hero_cta_cv')}
                                    <Arrow rotate={90} />
                                </a>
                                <a
                                    href="#contact"
                                    className="inline-flex items-center gap-2 bg-[#0b0b0b] px-4 py-4 font-bold text-white underline-offset-4 hover:underline"
                                >
                                    {t('hero_cta_contact')}
                                    <Arrow />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-[60vh] py-[50vh]">
                    <Chamber id="impact" title={t('impact_title')}>
                        <ul className="space-y-6 md:space-y-2">
                            {keyFigures.map((f) => (
                                <li
                                    key={f.label}
                                    className="flex flex-wrap items-baseline gap-x-5 border-t-2 border-black/80 pt-3"
                                >
                                    <span className="text-[clamp(3.25rem,10vw,7.5rem)] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                                        {f.value}
                                    </span>
                                    <span className="text-xl font-semibold md:text-2xl">
                                        {f.label}
                                    </span>
                                    <span className="text-base">
                                        {f.backing.kind === 'project' && f.backing.id ? (
                                            <Link
                                                to={localizedPath(
                                                    locale,
                                                    projectPath(f.backing.id),
                                                )}
                                                className="underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </Link>
                                        ) : (
                                            <a
                                                href="#experience"
                                                className="underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </a>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Chamber>

                    <Chamber id="experience" title={t('experience_title')}>
                        <ol>
                            {experiences.map((e) => {
                                const project = projects.find((p) => p.experienceId === e.id);
                                return (
                                    <li
                                        key={e.id}
                                        className="grid gap-2 border-t-2 border-black/80 py-6 md:grid-cols-[14rem_1fr] md:gap-8"
                                    >
                                        <p className="font-semibold tabular-nums">{e.period}</p>
                                        <div className="max-w-[42rem]">
                                            <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                                                {e.role} · {e.company}
                                            </h3>
                                            <ul className="mt-2 space-y-1 text-lg leading-relaxed">
                                                {e.achievements.slice(0, 2).map((a) => (
                                                    <li key={a}>{a}</li>
                                                ))}
                                            </ul>
                                            {project && (
                                                <Link
                                                    to={localizedPath(
                                                        locale,
                                                        projectPath(project.id),
                                                    )}
                                                    className="mt-3 inline-flex items-center gap-2 font-extrabold underline-offset-4 hover:underline"
                                                >
                                                    {project.title}
                                                    <Arrow />
                                                </Link>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </Chamber>

                    <Chamber id="projects" title={t('projects_title')}>
                        <ul className="grid gap-12 md:grid-cols-2">
                            {featuredProjects.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        to={localizedPath(locale, projectPath(p.id))}
                                        className="group block"
                                    >
                                        <div
                                            className="p-2"
                                            style={{
                                                backgroundImage:
                                                    'repeating-linear-gradient(90deg, #ffffff 0 3px, #e3262f 3px 6px, #ffd400 6px 9px)',
                                            }}
                                        >
                                            <ProjectCover
                                                project={p}
                                                sizes="(min-width: 768px) 45vw, 100vw"
                                                lazy
                                            />
                                        </div>
                                        <h3 className="mt-4 flex items-center gap-3 text-3xl font-extrabold tracking-tight group-hover:underline group-hover:underline-offset-8">
                                            {p.title}
                                            <Arrow />
                                        </h3>
                                        <p className="mt-2 max-w-[38rem] text-lg leading-relaxed text-white/90">
                                            {p.caseStudy.summary}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Chamber>

                    <Chamber id="skills" title={t('skills_title')}>
                        <dl className="grid gap-8 md:grid-cols-3">
                            {skills.map((s) => (
                                <div key={s.name} className="border-t-2 border-black/80 pt-3">
                                    <dt className="text-xl font-extrabold">{s.name}</dt>
                                    <dd className="mt-2 leading-relaxed">{s.items.join(' · ')}</dd>
                                </div>
                            ))}
                        </dl>
                    </Chamber>

                    <Chamber id="contact" title={t('contact_title')}>
                        <p className="max-w-[40rem] text-2xl font-semibold leading-snug">
                            {t('contact_phrase')}
                        </p>
                        <a
                            href={`mailto:${profile.email}`}
                            onClick={() => trackContact('email')}
                            className="mt-8 block break-words text-[clamp(1.75rem,6vw,4.5rem)] font-extrabold leading-none tracking-[-0.03em] underline decoration-4 underline-offset-8 hover:decoration-[#e3262f]"
                        >
                            {profile.email}
                        </a>
                        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-lg font-bold">
                            <li>
                                <a
                                    href={profile.linkedin}
                                    onClick={() => trackContact('linkedin')}
                                    className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                                >
                                    LinkedIn <Arrow rotate={-45} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href={profile.github}
                                    className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                                >
                                    GitHub <Arrow rotate={-45} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href={cvPath(locale)}
                                    download
                                    onClick={() => trackCvDownload(locale)}
                                    className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                                >
                                    {t('cv_button')} <Arrow rotate={90} />
                                </a>
                            </li>
                        </ul>
                    </Chamber>
                </div>
            </main>
        </div>
    );
};
