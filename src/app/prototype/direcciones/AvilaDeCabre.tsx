import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/hanken-grotesk';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { formatHour, formatTemperature, useCaracasClock, useClima } from '@lib/clima';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, projectPath, switchLocalePath } from '@lib/locale-path';
import { useTheme } from '@lib/theme';

import { ProjectCover } from '../../features/projects/ProjectCover';

// PROTOTIPO (research/impeccable, mapa #104). Dirección "El Ávila de Cabré": Manuel Cabré pintó
// el Ávila toda su vida, a cada hora. La Escena se tiñe con la luz de la hora real de Caracas
// (amanecer, mediodía, hora dorada, crepúsculo, noche), con bruma atmosférica y grano de lienzo; el
// contenido cuelga en salas de museo, y la entrada es una cartela junto al cuadro.

const FONT = "'Hanken Grotesk Variable', system-ui, sans-serif";

/** La luz de Cabré según la hora de Caracas: un velo de color y la bruma de las capas lejanas. */
function luzDeLaHora(hour: number) {
    if (hour >= 5 && hour < 7)
        return { velo: 'linear-gradient(#f3a3a0 0%, #f7c98f 55%, #f9e0b0 100%)', bruma: '#f7d6c0' };
    if (hour >= 7 && hour < 10)
        return { velo: 'linear-gradient(#f9e7c4 0%, #fff2d8 100%)', bruma: '#fbf0de' };
    if (hour >= 10 && hour < 15)
        return { velo: 'linear-gradient(#dff1ff 0%, #fffbe8 100%)', bruma: '#eef6fb' };
    if (hour >= 15 && hour < 18)
        return { velo: 'linear-gradient(#f6b860 0%, #f08a4b 60%, #e0603f 100%)', bruma: '#f6c08a' };
    if (hour >= 18 && hour < 19.5)
        return { velo: 'linear-gradient(#5b4b9a 0%, #b56a9e 55%, #f09a7a 100%)', bruma: '#c79ab8' };
    return { velo: 'linear-gradient(#1b2a6b 0%, #27346e 100%)', bruma: '#2f3d73' };
}

const GRAIN =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.25 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>\")";

/** El velo de la hora, la bruma y el lienzo, sobre toda la Escena. */
const LuzDeCabre: React.FC = () => {
    const clock = useCaracasClock();
    const { velo, bruma } = luzDeLaHora(clock.hour + clock.minute / 60);
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
            <div
                className="absolute inset-0 opacity-60 mix-blend-soft-light"
                style={{ background: velo }}
            />
            <div
                className="absolute inset-x-0 bottom-0 h-[45%] opacity-20"
                style={{ background: `linear-gradient(transparent, ${bruma} 70%, transparent)` }}
            />
            <div
                className="absolute inset-0 opacity-15 mix-blend-multiply"
                style={{ backgroundImage: GRAIN }}
            />
        </div>
    );
};

const Arrow: React.FC<{ rotate?: number }> = ({ rotate = 0 }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ transform: `rotate(${rotate}deg)`, flex: 'none' }}
    >
        <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
);

/** Una sala del museo: el muro de yeso, con el título a la izquierda y el texto de sala al lado. */
const Sala: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
    id,
    title,
    children,
}) => (
    <section
        id={id}
        aria-label={title}
        className="relative z-10 scroll-mt-14 bg-[var(--yeso)] text-[var(--tinta)]"
        style={{ backgroundImage: GRAIN, backgroundBlendMode: 'multiply' }}
    >
        <div className="mx-5 border-t border-[var(--tinta)]/25 md:mx-[7vw]" />
        <div className="grid gap-8 px-5 py-16 md:grid-cols-[1fr_2fr] md:gap-16 md:px-[7vw] md:py-24">
            <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-light leading-[1] tracking-[-0.025em] md:sticky md:top-24 md:self-start">
                {title}
            </h2>
            <div className="max-w-[44rem]">{children}</div>
        </div>
    </section>
);

const TopBar: React.FC = () => {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const { pathname, search } = useLocation();
    const links = [
        ['impact', t('impact_title')],
        ['experience', t('experience_title')],
        ['projects', t('projects_title')],
        ['skills', t('skills_title')],
        ['contact', t('contact_title')],
    ];
    return (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center gap-6 px-5 py-3 text-[var(--tinta)] md:px-[7vw]">
            <span className="absolute inset-0 -z-10 bg-[var(--yeso)]/85 backdrop-blur-[2px]" />
            <a href="#hero" className="font-semibold">
                Diego Rangel
            </a>
            <nav
                aria-label={locale === 'es' ? 'Salas' : 'Rooms'}
                className="hidden flex-1 md:block"
            >
                <ul className="flex justify-center gap-7 text-[0.95rem] font-light">
                    {links.map(([id, label]) => (
                        <li key={id}>
                            <a href={`#${id}`} className="underline-offset-[6px] hover:underline">
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <span className="flex-1 md:hidden" />
            <button type="button" onClick={toggleTheme} className="text-sm hover:underline">
                {theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
            </button>
            <Link
                to={`${switchLocalePath(pathname)}${search}`}
                className="text-sm font-semibold hover:underline"
            >
                {locale === 'es' ? 'EN' : 'ES'}
            </Link>
        </header>
    );
};

export const AvilaDeCabre: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile, keyFigures, experiences, projects, featuredProjects, skills } = content;
    const clock = useCaracasClock();
    const clima = useClima();
    const tecnica = locale === 'es' ? 'Óleo sobre la hora real' : 'Oil on real time';

    return (
        <div
            style={{ fontFamily: FONT }}
            className="[--yeso:#eee8dd] [--tinta:#28241f] [--tenue:#5c554b] [--acento:#a2402a] dark:[--yeso:#1d1b18] dark:[--tinta:#ede7dc] dark:[--tenue:#b5ad9f] dark:[--acento:#e59a6c] selection:bg-[#a2402a] selection:text-white [&_:is(h1,h2,h3)]:[font-family:inherit]"
        >
            <LuzDeCabre />
            <TopBar />
            <main>
                {/* Primer viewport: el cuadro entero; la cartela cuelga abajo a la izquierda. */}
                <section
                    id="hero"
                    aria-label={profile.name}
                    className="relative z-10 flex min-h-[100svh] flex-col justify-end px-5 pb-16 md:px-[7vw]"
                >
                    <div className="max-w-[26rem] bg-[var(--yeso)] p-6 text-[var(--tinta)] shadow-[0_14px_32px_-10px_rgba(20,15,10,0.45)]">
                        <h1 className="text-[2.6rem] font-semibold leading-none tracking-[-0.02em]">
                            {profile.name}
                        </h1>
                        <p className="mt-2 text-base">
                            {profile.role}
                            <br />
                            <span className="text-[var(--tenue)]">{hero.location}</span>
                        </p>
                        <p className="mt-4 text-lg leading-snug">{hero.valueProposition}</p>
                        <p className="mt-4 border-t border-[var(--tinta)]/20 pt-3 text-sm italic tabular-nums text-[var(--tenue)]">
                            {tecnica} · Caracas {formatHour(clock, locale)}
                            {clima &&
                                ` · ${formatTemperature(clima.temperatura, locale)} · ${t(`clima_${clima.estado}`)}`}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                            <a
                                href={cvPath(locale)}
                                download
                                onClick={() => trackCvDownload(locale)}
                                className="inline-flex items-center gap-2 bg-[var(--acento)] px-5 py-3 font-semibold text-white hover:brightness-110 dark:text-[#1d1b18]"
                            >
                                {t('hero_cta_cv')}
                                <Arrow rotate={90} />
                            </a>
                            <a
                                href="#contact"
                                className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
                            >
                                {t('hero_cta_contact')}
                                <Arrow />
                            </a>
                        </div>
                    </div>
                </section>

                <div className="space-y-[70vh] pb-[45vh] pt-[45vh]">
                    <Sala id="impact" title={t('impact_title')}>
                        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                            {keyFigures.map((f) => (
                                <div key={f.label}>
                                    <dt className="text-[clamp(3rem,6vw,4.75rem)] font-extralight leading-none tracking-[-0.03em] tabular-nums text-[var(--acento)]">
                                        {f.value}
                                    </dt>
                                    <dd className="mt-2 text-lg">
                                        {f.label} ·{' '}
                                        {f.backing.kind === 'project' && f.backing.id ? (
                                            <Link
                                                to={localizedPath(
                                                    locale,
                                                    projectPath(f.backing.id),
                                                )}
                                                className="text-[var(--tenue)] underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </Link>
                                        ) : (
                                            <a
                                                href="#experience"
                                                className="text-[var(--tenue)] underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </a>
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Sala>

                    <Sala id="experience" title={t('experience_title')}>
                        <ol className="space-y-10">
                            {experiences.map((e) => {
                                const project = projects.find((p) => p.experienceId === e.id);
                                return (
                                    <li key={e.id}>
                                        <h3 className="text-2xl font-normal tracking-tight">
                                            {e.role} · {e.company}
                                        </h3>
                                        <p className="mt-1 text-sm italic tabular-nums text-[var(--tenue)]">
                                            {e.period}
                                        </p>
                                        <ul className="mt-3 space-y-1.5 text-lg leading-relaxed">
                                            {e.achievements.slice(0, 2).map((a) => (
                                                <li key={a}>{a}</li>
                                            ))}
                                        </ul>
                                        {project && (
                                            <Link
                                                to={localizedPath(locale, projectPath(project.id))}
                                                className="mt-2 inline-flex items-center gap-2 font-semibold text-[var(--acento)] underline-offset-4 hover:underline"
                                            >
                                                {project.title}
                                                <Arrow />
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </Sala>

                    <Sala id="projects" title={t('projects_title')}>
                        <ul className="space-y-14">
                            {featuredProjects.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        to={localizedPath(locale, projectPath(p.id))}
                                        className="group block"
                                    >
                                        <div className="border-[10px] border-[#2a2520] shadow-[0_18px_36px_-14px_rgba(20,15,10,0.5)] dark:border-[#0e0d0b]">
                                            <ProjectCover
                                                project={p}
                                                sizes="(min-width: 768px) 44rem, 100vw"
                                                lazy
                                            />
                                        </div>
                                        <h3 className="mt-5 flex items-center gap-2 text-2xl font-normal group-hover:underline group-hover:underline-offset-4">
                                            {p.title}
                                            <Arrow />
                                        </h3>
                                        <p className="mt-1 text-lg leading-relaxed text-[var(--tenue)]">
                                            {p.caseStudy.summary}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Sala>

                    <Sala id="skills" title={t('skills_title')}>
                        <dl className="space-y-6">
                            {skills.map((s) => (
                                <div key={s.name}>
                                    <dt className="text-lg font-semibold">{s.name}</dt>
                                    <dd className="mt-1 text-lg leading-relaxed text-[var(--tenue)]">
                                        {s.items.join(' · ')}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Sala>

                    <Sala id="contact" title={t('contact_title')}>
                        <p className="text-2xl font-light leading-snug">{t('contact_phrase')}</p>
                        <a
                            href={`mailto:${profile.email}`}
                            onClick={() => trackContact('email')}
                            className="mt-6 block break-words text-[clamp(1.6rem,4vw,3rem)] font-normal tracking-[-0.02em] text-[var(--acento)] underline decoration-1 underline-offset-8"
                        >
                            {profile.email}
                        </a>
                        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-lg">
                            <li>
                                <a
                                    href={profile.linkedin}
                                    onClick={() => trackContact('linkedin')}
                                    className="inline-flex items-center gap-2 hover:underline"
                                >
                                    LinkedIn <Arrow rotate={-45} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href={profile.github}
                                    className="inline-flex items-center gap-2 hover:underline"
                                >
                                    GitHub <Arrow rotate={-45} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href={cvPath(locale)}
                                    download
                                    onClick={() => trackCvDownload(locale)}
                                    className="inline-flex items-center gap-2 hover:underline"
                                >
                                    {t('cv_button')} <Arrow rotate={90} />
                                </a>
                            </li>
                        </ul>
                    </Sala>
                </div>
            </main>
        </div>
    );
};
