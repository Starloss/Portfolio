import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/geist';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { formatHour, formatTemperature, useCaracasClock, useClima } from '@lib/clima';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, projectPath, switchLocalePath } from '@lib/locale-path';
import { useTheme } from '@lib/theme';

import { ProjectCover } from '../../features/projects/ProjectCover';

// PROTOTIPO (research/impeccable, mapa #104, ticket "Prototipo de la UI sobria"). UI "Producto":
// el estándar de la categoría con la vara de las páginas de producto de Apple. Caracas es el
// producto: ocupa el primer viewport y dos capítulos enteros sin texto encima; el resto son
// secciones sólidas, sin tarjetas, con tipografía grande y mucho aire.

const FONT = "'Geist Variable', system-ui, sans-serif";

const Chevron: React.FC = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="inline-block">
        <path d="m3 1 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
);

const Bar: React.FC = () => {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const { pathname, search } = useLocation();
    const links = [
        ['experience', t('experience_title')],
        ['projects', t('projects_title')],
        ['contact', t('contact_title')],
    ];
    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--linea)] bg-[var(--fondo)]/80 backdrop-blur-xl">
            <div className="mx-auto flex h-12 max-w-[980px] items-center gap-6 px-5 text-[13px] text-[var(--tinta)]">
                <a href="#hero" className="font-semibold">
                    Diego Rangel
                </a>
                <nav aria-label={locale === 'es' ? 'Secciones' : 'Sections'} className="flex-1">
                    <ul className="hidden justify-center gap-7 sm:flex">
                        {links.map(([id, label]) => (
                            <li key={id}>
                                <a
                                    href={`#${id}`}
                                    className="text-[var(--tenue)] hover:text-[var(--tinta)]"
                                >
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="text-[var(--tenue)] hover:text-[var(--tinta)]"
                >
                    {theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
                </button>
                <Link
                    to={`${switchLocalePath(pathname)}${search}`}
                    className="text-[var(--tenue)] hover:text-[var(--tinta)]"
                >
                    {locale === 'es' ? 'EN' : 'ES'}
                </Link>
                <a
                    href={cvPath(locale)}
                    download
                    onClick={() => trackCvDownload(locale)}
                    className="rounded-full bg-[var(--acento)] px-3 py-1 font-medium text-white"
                >
                    CV
                </a>
            </div>
        </header>
    );
};

/** Una sección sólida: el título grande arriba y el contenido debajo, en la columna de 980 px. */
const Seccion: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
    id,
    title,
    children,
}) => (
    <section id={id} aria-label={title} className="relative z-10 scroll-mt-12 bg-[var(--fondo)]">
        <div className="mx-auto max-w-[980px] px-5 py-24 md:py-32">
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
                {title}
            </h2>
            <div className="mt-14">{children}</div>
        </div>
    </section>
);

/** Un capítulo de Caracas: la Escena sola, con su pie de foto. */
const Capitulo: React.FC<{ caption: React.ReactNode }> = ({ caption }) => (
    <div className="relative z-10 flex h-[100svh] items-end">
        <p className="mx-auto w-full max-w-[980px] px-5 pb-10 text-sm text-[var(--tinta-escena)]">
            {caption}
        </p>
    </div>
);

export const UiProducto: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile, keyFigures, experiences, projects, featuredProjects, skills } = content;
    const clock = useCaracasClock();
    const clima = useClima();
    const ahora = `Caracas, ${formatHour(clock, locale)}${clima ? ` · ${formatTemperature(clima.temperatura, locale)} · ${t(`clima_${clima.estado}`)}` : ''}`;

    return (
        <div
            style={{ fontFamily: FONT }}
            className="[--fondo:#fbfbfd] [--tinta:#1d1d1f] [--tenue:#6e6e73] [--linea:rgba(0,0,0,0.1)] [--acento:#1f6f4a] [--tinta-escena:#101010] dark:[--fondo:#000000] dark:[--tinta:#f5f5f7] dark:[--tenue:#a1a1a6] dark:[--linea:rgba(255,255,255,0.14)] dark:[--acento:#2f8f62] dark:[--tinta-escena:#f5f5f7] text-[var(--tinta)] antialiased [&_:is(h1,h2,h3)]:[font-family:inherit] selection:bg-[var(--acento)] selection:text-white"
        >
            <Bar />
            <main>
                {/* Primer viewport: Caracas, el nombre y una sola frase. */}
                <section
                    id="hero"
                    aria-label={profile.name}
                    className="relative z-10 flex min-h-[100svh] flex-col items-center px-5 pt-[16vh] text-center text-[var(--tinta-escena)]"
                >
                    <h1 className="text-[clamp(3.25rem,10vw,7rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                        {profile.name}
                    </h1>
                    <p className="mt-5 max-w-[40rem] text-[clamp(1.25rem,2.4vw,1.75rem)] font-medium leading-snug tracking-[-0.01em]">
                        {hero.valueProposition}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[17px]">
                        <a
                            href={cvPath(locale)}
                            download
                            onClick={() => trackCvDownload(locale)}
                            className="rounded-full bg-[var(--acento)] px-6 py-3 font-medium text-white hover:brightness-110"
                        >
                            {t('hero_cta_cv')}
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-1.5 font-medium hover:underline"
                        >
                            {t('hero_cta_contact')} <Chevron />
                        </a>
                    </div>
                    <p className="mt-auto pb-10 text-sm">
                        {profile.role} · {ahora}
                    </p>
                </section>

                <Seccion id="impact" title={t('impact_title')}>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-4">
                        {keyFigures.map((f) => (
                            <div key={f.label}>
                                <dt className="text-[clamp(2.75rem,5vw,4rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                                    {f.value}
                                </dt>
                                <dd className="mt-3 text-[17px] leading-snug">
                                    {f.label}
                                    <br />
                                    {f.backing.kind === 'project' && f.backing.id ? (
                                        <Link
                                            to={localizedPath(locale, projectPath(f.backing.id))}
                                            className="text-[var(--acento)] hover:underline"
                                        >
                                            {f.backing.label} <Chevron />
                                        </Link>
                                    ) : (
                                        <a
                                            href="#experience"
                                            className="text-[var(--acento)] hover:underline"
                                        >
                                            {f.backing.label} <Chevron />
                                        </a>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Seccion>

                <Capitulo caption={ahora} />

                <Seccion id="experience" title={t('experience_title')}>
                    <ol>
                        {experiences.map((e) => {
                            const project = projects.find((p) => p.experienceId === e.id);
                            return (
                                <li
                                    key={e.id}
                                    className="grid gap-3 border-t border-[var(--linea)] py-10 md:grid-cols-[16rem_1fr] md:gap-10"
                                >
                                    <div>
                                        <p className="text-[17px] font-semibold">{e.company}</p>
                                        <p className="text-sm tabular-nums text-[var(--tenue)]">
                                            {e.period}
                                        </p>
                                    </div>
                                    <div className="max-w-[38rem]">
                                        <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                                            {e.role}
                                        </h3>
                                        <ul className="mt-3 space-y-2 text-[17px] leading-relaxed text-[var(--tenue)]">
                                            {e.achievements.slice(0, 2).map((a) => (
                                                <li key={a}>{a}</li>
                                            ))}
                                        </ul>
                                        {project && (
                                            <Link
                                                to={localizedPath(locale, projectPath(project.id))}
                                                className="mt-4 inline-flex items-center gap-1.5 text-[17px] text-[var(--acento)] hover:underline"
                                            >
                                                {project.title} <Chevron />
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </Seccion>

                <Seccion id="projects" title={t('projects_title')}>
                    <ul className="space-y-24">
                        {featuredProjects.map((p) => (
                            <li key={p.id}>
                                <Link
                                    to={localizedPath(locale, projectPath(p.id))}
                                    className="group block"
                                >
                                    <div className="overflow-hidden rounded-[22px]">
                                        <ProjectCover
                                            project={p}
                                            sizes="(min-width: 1000px) 940px, 100vw"
                                            lazy
                                        />
                                    </div>
                                    <div className="mt-6 grid gap-2 md:grid-cols-[16rem_1fr] md:gap-10">
                                        <h3 className="text-3xl font-semibold tracking-[-0.025em]">
                                            {p.title}
                                        </h3>
                                        <p className="max-w-[38rem] text-[17px] leading-relaxed text-[var(--tenue)]">
                                            {p.caseStudy.summary}{' '}
                                            <span className="whitespace-nowrap text-[var(--acento)] group-hover:underline">
                                                {locale === 'es' ? 'Ver el caso' : 'See the case'}{' '}
                                                <Chevron />
                                            </span>
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Seccion>

                <Seccion id="skills" title={t('skills_title')}>
                    <dl className="grid gap-10 md:grid-cols-3">
                        {skills.map((s) => (
                            <div key={s.name}>
                                <dt className="text-[17px] font-semibold">{s.name}</dt>
                                <dd className="mt-2 text-[17px] leading-relaxed text-[var(--tenue)]">
                                    {s.items.join(', ')}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Seccion>

                <Capitulo caption={ahora} />

                <Seccion id="contact" title={t('contact_title')}>
                    <p className="max-w-[40rem] text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-snug tracking-[-0.02em]">
                        {t('contact_phrase')}
                    </p>
                    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-[17px]">
                        <a
                            href={`mailto:${profile.email}`}
                            onClick={() => trackContact('email')}
                            className="rounded-full bg-[var(--acento)] px-6 py-3 font-medium text-white hover:brightness-110"
                        >
                            {profile.email}
                        </a>
                        <a
                            href={profile.linkedin}
                            onClick={() => trackContact('linkedin')}
                            className="inline-flex items-center gap-1.5 text-[var(--acento)] hover:underline"
                        >
                            LinkedIn <Chevron />
                        </a>
                        <a
                            href={profile.github}
                            className="inline-flex items-center gap-1.5 text-[var(--acento)] hover:underline"
                        >
                            GitHub <Chevron />
                        </a>
                        <a
                            href={cvPath(locale)}
                            download
                            onClick={() => trackCvDownload(locale)}
                            className="inline-flex items-center gap-1.5 text-[var(--acento)] hover:underline"
                        >
                            {t('cv_button')} <Chevron />
                        </a>
                    </div>
                    <p className="mt-16 text-sm text-[var(--tenue)]">{hero.location}</p>
                </Seccion>
            </main>
        </div>
    );
};
