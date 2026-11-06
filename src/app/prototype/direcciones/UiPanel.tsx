import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/geist';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { formatHour, formatTemperature, useCaracasClock, useClima } from '@lib/clima';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, projectPath, switchLocalePath } from '@lib/locale-path';
import { useTheme } from '@lib/theme';

import { ProjectCover } from '../../features/projects/ProjectCover';

// PROTOTIPO (research/impeccable, mapa #104, ticket "Prototipo de la UI sobria"). UI "Panel": la
// Escena ocupa siempre la pantalla y el contenido es un documento sobrio en un panel sólido a la
// derecha, con la precisión de Linear. En móvil, el panel es una hoja que sube sobre la ciudad
// después de un primer viewport casi entero de Escena.

const FONT = "'Geist Variable', system-ui, sans-serif";

const Arrow: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="inline-block">
        <path
            d="M2 6h8M6.5 2.5 10 6l-3.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
        />
    </svg>
);

const Bloque: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
    id,
    title,
    children,
}) => (
    <section
        id={id}
        aria-label={title}
        className="scroll-mt-6 border-t border-[var(--linea)] py-10"
    >
        <h2 className="text-[13px] font-medium text-[var(--tenue)]">{title}</h2>
        <div className="mt-5">{children}</div>
    </section>
);

export const UiPanel: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile, keyFigures, experiences, projects, featuredProjects, skills } = content;
    const { theme, toggleTheme } = useTheme();
    const { pathname, search } = useLocation();
    const clock = useCaracasClock();
    const clima = useClima();

    return (
        <div
            style={{ fontFamily: FONT }}
            className="[--fondo:#f7f7f5] [--tinta:#16181a] [--tenue:#6b6f76] [--linea:rgba(0,0,0,0.09)] [--acento:#1f6f4a] dark:[--fondo:#0e0f11] dark:[--tinta:#ededef] dark:[--tenue:#8b8f98] dark:[--linea:rgba(255,255,255,0.09)] dark:[--acento:#4fb487] text-[15px] text-[var(--tinta)] antialiased [&_:is(h1,h2,h3)]:[font-family:inherit] selection:bg-[var(--acento)] selection:text-white"
        >
            {/* En escritorio, la Escena queda a la izquierda; su pie dice qué se está viendo. */}
            <p className="fixed bottom-6 left-6 z-10 hidden max-w-[22rem] text-[13px] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] lg:block">
                {locale === 'es' ? 'El Ávila desde Caracas' : 'El Ávila from Caracas'} ·{' '}
                {formatHour(clock, locale)}
                {clima &&
                    ` · ${formatTemperature(clima.temperatura, locale)} · ${t(`clima_${clima.estado}`)}`}
            </p>

            <main className="relative z-10 mt-[72svh] min-h-screen rounded-t-[20px] bg-[var(--fondo)] px-6 pb-24 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] lg:ml-auto lg:mt-0 lg:w-[min(560px,44vw)] lg:rounded-none lg:px-12 lg:shadow-[-12px_0_40px_rgba(0,0,0,0.12)]">
                <div
                    aria-hidden="true"
                    className="mx-auto mb-4 mt-3 h-1 w-10 rounded-full bg-[var(--linea)] lg:hidden"
                />
                <header className="flex items-center justify-between py-4 text-[13px] text-[var(--tenue)] lg:pt-8">
                    <nav aria-label={locale === 'es' ? 'Secciones' : 'Sections'}>
                        <ul className="flex gap-4">
                            {[
                                ['experience', t('experience_title')],
                                ['projects', t('projects_title')],
                                ['contact', t('contact_title')],
                            ].map(([id, label]) => (
                                <li key={id}>
                                    <a href={`#${id}`} className="hover:text-[var(--tinta)]">
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="hover:text-[var(--tinta)]"
                        >
                            {theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
                        </button>
                        <Link
                            to={`${switchLocalePath(pathname)}${search}`}
                            className="hover:text-[var(--tinta)]"
                        >
                            {locale === 'es' ? 'EN' : 'ES'}
                        </Link>
                    </div>
                </header>

                <section id="hero" aria-label={profile.name} className="pb-10 pt-6 lg:pt-16">
                    <h1 className="text-[2.5rem] font-semibold leading-none tracking-[-0.035em]">
                        {profile.name}
                    </h1>
                    <p className="mt-2 text-[var(--tenue)]">
                        {profile.role} · {hero.location}
                    </p>
                    <p className="mt-6 text-xl leading-snug tracking-[-0.01em]">
                        {hero.valueProposition}
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-5">
                        <a
                            href={cvPath(locale)}
                            download
                            onClick={() => trackCvDownload(locale)}
                            className="rounded-md bg-[var(--tinta)] px-4 py-2 font-medium text-[var(--fondo)] hover:opacity-90"
                        >
                            {t('hero_cta_cv')}
                        </a>
                        <a
                            href={`mailto:${profile.email}`}
                            onClick={() => trackContact('email')}
                            className="inline-flex items-center gap-1.5 font-medium hover:underline"
                        >
                            {profile.email}
                        </a>
                    </div>
                </section>

                <Bloque id="impact" title={t('impact_title')}>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
                        {keyFigures.map((f) => (
                            <div key={f.label}>
                                <dt className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">
                                    {f.value}
                                </dt>
                                <dd className="mt-1 leading-snug text-[var(--tenue)]">
                                    {f.label} ·{' '}
                                    {f.backing.kind === 'project' && f.backing.id ? (
                                        <Link
                                            to={localizedPath(locale, projectPath(f.backing.id))}
                                            className="text-[var(--acento)] hover:underline"
                                        >
                                            {f.backing.label}
                                        </Link>
                                    ) : (
                                        <a
                                            href="#experience"
                                            className="text-[var(--acento)] hover:underline"
                                        >
                                            {f.backing.label}
                                        </a>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Bloque>

                <Bloque id="experience" title={t('experience_title')}>
                    <ol className="space-y-8">
                        {experiences.map((e) => {
                            const project = projects.find((p) => p.experienceId === e.id);
                            return (
                                <li key={e.id}>
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="font-semibold">
                                            {e.role} · {e.company}
                                        </h3>
                                        <span className="shrink-0 text-[13px] tabular-nums text-[var(--tenue)]">
                                            {e.period}
                                        </span>
                                    </div>
                                    <ul className="mt-2 space-y-1.5 leading-relaxed text-[var(--tenue)]">
                                        {e.achievements.slice(0, 2).map((a) => (
                                            <li key={a}>{a}</li>
                                        ))}
                                    </ul>
                                    {project && (
                                        <Link
                                            to={localizedPath(locale, projectPath(project.id))}
                                            className="mt-2 inline-flex items-center gap-1.5 text-[var(--acento)] hover:underline"
                                        >
                                            {project.title} <Arrow />
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </Bloque>

                <Bloque id="projects" title={t('projects_title')}>
                    <ul className="space-y-10">
                        {featuredProjects.map((p) => (
                            <li key={p.id}>
                                <Link
                                    to={localizedPath(locale, projectPath(p.id))}
                                    className="group block"
                                >
                                    <div className="overflow-hidden rounded-lg ring-1 ring-[var(--linea)]">
                                        <ProjectCover
                                            project={p}
                                            sizes="(min-width: 1024px) 460px, 100vw"
                                            lazy
                                        />
                                    </div>
                                    <h3 className="mt-3 flex items-center gap-1.5 font-semibold group-hover:underline">
                                        {p.title} <Arrow />
                                    </h3>
                                    <p className="mt-1 leading-relaxed text-[var(--tenue)]">
                                        {p.caseStudy.summary}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Bloque>

                <Bloque id="skills" title={t('skills_title')}>
                    <dl className="space-y-3">
                        {skills.map((s) => (
                            <div key={s.name} className="grid grid-cols-[7rem_1fr] gap-4">
                                <dt className="font-medium">{s.name}</dt>
                                <dd className="leading-relaxed text-[var(--tenue)]">
                                    {s.items.join(', ')}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Bloque>

                <Bloque id="contact" title={t('contact_title')}>
                    <p className="text-xl leading-snug tracking-[-0.01em]">{t('contact_phrase')}</p>
                    <ul className="mt-6 divide-y divide-[var(--linea)] border-y border-[var(--linea)]">
                        {[
                            {
                                href: `mailto:${profile.email}`,
                                label: profile.email,
                                track: () => trackContact('email'),
                            },
                            {
                                href: profile.linkedin,
                                label: 'LinkedIn',
                                track: () => trackContact('linkedin'),
                            },
                            { href: profile.github, label: 'GitHub' },
                        ].map((c) => (
                            <li key={c.label}>
                                <a
                                    href={c.href}
                                    onClick={c.track}
                                    className="flex items-center justify-between py-3 hover:text-[var(--acento)]"
                                >
                                    {c.label} <Arrow />
                                </a>
                            </li>
                        ))}
                    </ul>
                </Bloque>
            </main>
        </div>
    );
};
