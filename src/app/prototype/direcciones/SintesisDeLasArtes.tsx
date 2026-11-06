import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/jost';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { formatHour, formatTemperature, useCaracasClock, useClima } from '@lib/clima';
import { useI18n } from '@lib/i18n';
import { cvPath, localizedPath, projectPath, switchLocalePath } from '@lib/locale-path';
import { usePrefersReducedMotion } from '@lib/motion';
import { useTheme } from '@lib/theme';

import { ProjectCover } from '../../features/projects/ProjectCover';

// PROTOTIPO (research/impeccable, mapa #104). Dirección "Síntesis de las Artes": la Ciudad
// Universitaria de Caracas (Villanueva, 1952–57), donde estudió Diego. Las Nubes de Calder del Aula
// Magna flotan en el cielo de la Escena; el contenido va en muros de concreto con frisos de color a
// la manera de los murales de Manaure, y entre muro y muro un quiebrasol deja ver la ciudad.

const FONT = "'Jost Variable', system-ui, sans-serif";

const MURAL = {
    ocre: '#d9a02b',
    rojo: '#c23b2a',
    azul: '#27509f',
    negro: '#1a1a18',
    blanco: '#f2eee5',
    celeste: '#8fbcd6',
};

// Las Nubes: posición en % del viewport, tamaño en vw, color y profundidad de parallax.
const NUBES = [
    { id: 'n6-12', x: 6, y: 12, w: 15, c: MURAL.ocre, r: -8, d: 0.35 },
    { id: 'n24-4', x: 24, y: 4, w: 9, c: MURAL.rojo, r: 12, d: 0.6 },
    { id: 'n58-9', x: 58, y: 9, w: 19, c: MURAL.blanco, r: -4, d: 0.25 },
    { id: 'n80-20', x: 80, y: 20, w: 11, c: MURAL.azul, r: 18, d: 0.5 },
    { id: 'n44-28', x: 44, y: 28, w: 7, c: MURAL.celeste, r: -14, d: 0.75 },
    { id: 'n70-36', x: 70, y: 36, w: 6, c: MURAL.rojo, r: 6, d: 0.9 },
    { id: 'n90-6', x: 90, y: 6, w: 8, c: MURAL.ocre, r: -20, d: 0.45 },
];

/** Las Nubes Acústicas de Calder, colgadas sobre el Ávila; bajan a distinto ritmo con el scroll. */
const NubesDeCalder: React.FC = () => {
    const nubesRef = useRef<(HTMLDivElement | null)[]>([]);
    const reduce = usePrefersReducedMotion();
    useEffect(() => {
        if (reduce) return;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const y = window.scrollY;
                NUBES.forEach((n, i) => {
                    const el = nubesRef.current[i];
                    if (el) el.style.translate = `0 ${-y * n.d}px`;
                });
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, [reduce]);
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            {NUBES.map((n, i) => (
                <div
                    key={n.id}
                    ref={(el) => {
                        nubesRef.current[i] = el;
                    }}
                    className="absolute will-change-[translate]"
                    style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.w}vw` }}
                >
                    <div
                        className="aspect-[1.6] shadow-[0_18px_30px_-12px_rgba(0,0,0,0.35)]"
                        style={{
                            background: n.c,
                            borderRadius: '52% 48% 46% 54% / 58% 44% 56% 42%',
                            transform: `rotate(${n.r}deg) perspective(600px) rotateX(48deg)`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

/** El friso: una fila de rectángulos de color de anchos desiguales, como un mural de la UCV. */
const Friso: React.FC<{ seed: number }> = ({ seed }) => {
    const colors = [MURAL.ocre, MURAL.rojo, MURAL.azul, MURAL.negro, MURAL.blanco, MURAL.celeste];
    const widths = [3, 1, 5, 2, 1, 4, 2, 3, 1, 2].map((w, i) => ({ w, id: `${seed}-${i}` }));
    return (
        <div aria-hidden="true" className="flex h-6 md:h-8">
            {widths.map(({ w, id }, i) => (
                <span
                    key={id}
                    style={{ flex: w, background: colors[(i * 7 + seed) % colors.length] }}
                />
            ))}
        </div>
    );
};

/** Un quiebrasol: una celosía de concreto por la que se ve la Escena. */
const Quiebrasol: React.FC<{ flip?: boolean }> = ({ flip }) => (
    <div
        aria-hidden="true"
        className="h-24 bg-[var(--concreto)] md:h-32"
        style={{
            maskImage: `repeating-linear-gradient(90deg, black 0 14px, transparent 14px 46px), linear-gradient(${flip ? 'to top' : 'to bottom'}, transparent 0%, black 85%)`,
            maskComposite: 'add',
        }}
    />
);

const Muro: React.FC<{ id: string; title: string; seed: number; children: React.ReactNode }> = ({
    id,
    title,
    seed,
    children,
}) => (
    <section id={id} aria-label={title} className="relative z-10 scroll-mt-16">
        <Quiebrasol />
        <div className="bg-[var(--concreto)] text-[var(--tinta)]">
            <Friso seed={seed} />
            <div className="grid gap-8 px-5 py-14 md:grid-cols-[minmax(14rem,1fr)_2.4fr] md:gap-16 md:px-[7vw] md:py-20">
                <h2 className="text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[0.95] tracking-[-0.02em] md:sticky md:top-24 md:self-start">
                    {title}
                </h2>
                <div>{children}</div>
            </div>
        </div>
        <Quiebrasol flip />
    </section>
);

const Arrow: React.FC<{ rotate?: number }> = ({ rotate = 0 }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ transform: `rotate(${rotate}deg)`, flex: 'none' }}
    >
        <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
);

/** El pasillo cubierto: la barra de arriba es su losa, con el borde ondulado. */
const Pasillo: React.FC = () => {
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
        <header className="fixed inset-x-0 top-0 z-50 text-[var(--tinta)]">
            <div className="flex items-center gap-5 bg-[var(--concreto)] px-5 pb-1 pt-3 md:px-[7vw]">
                <a href="#hero" className="text-lg font-semibold tracking-tight">
                    Diego Rangel
                </a>
                <nav
                    aria-label={locale === 'es' ? 'Secciones' : 'Sections'}
                    className="hidden flex-1 md:block"
                >
                    <ul className="flex justify-center gap-6 text-[0.95rem]">
                        {links.map(([id, label]) => (
                            <li key={id}>
                                <a
                                    href={`#${id}`}
                                    className="underline-offset-[6px] hover:underline"
                                >
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
            </div>
            {/* El borde de la losa ondula como los techos de los pasillos de la UCV. */}
            <svg
                aria-hidden="true"
                viewBox="0 0 120 8"
                preserveAspectRatio="none"
                className="block h-3 w-full fill-[var(--concreto)]"
            >
                <path d="M0 0h120v2C110 2 110 8 100 8S90 2 80 2 70 8 60 8 50 2 40 2 30 8 20 8 10 2 0 2Z" />
            </svg>
        </header>
    );
};

export const SintesisDeLasArtes: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { hero, profile, keyFigures, experiences, projects, featuredProjects, skills } = content;
    const clock = useCaracasClock();
    const clima = useClima();
    const tiles = [MURAL.ocre, MURAL.azul, MURAL.rojo, MURAL.blanco];
    const tileInk = ['#1a1a18', '#ffffff', '#ffffff', '#1a1a18'];

    return (
        <div
            style={{ fontFamily: FONT }}
            className="[--concreto:#d4cfc4] [--tinta:#1a1a18] [--tenue:#4d4a44] dark:[--concreto:#2c2b28] dark:[--tinta:#efebe2] dark:[--tenue:#b3ada2] selection:bg-[#d9a02b] selection:text-black [&_:is(h1,h2,h3)]:[font-family:inherit]"
        >
            <NubesDeCalder />
            <Pasillo />
            <main>
                {/* Primer viewport: el cielo del Aula Magna con sus Nubes sobre el Ávila. */}
                <section
                    id="hero"
                    aria-label={profile.name}
                    className="relative z-10 flex min-h-[100svh] flex-col justify-center px-5 pt-20 md:px-[7vw]"
                >
                    <h1 className="max-w-[12ch] text-[clamp(3.5rem,11vw,9rem)] font-semibold leading-[0.88] tracking-[-0.035em] text-[#141412] dark:text-[#f4f1ea]">
                        {profile.name}
                    </h1>
                    <div className="mt-6 max-w-[34rem] bg-[var(--concreto)] text-[var(--tinta)]">
                        <Friso seed={1} />
                        <div className="p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tenue)]">
                                {profile.role} · {hero.location}
                            </p>
                            <p className="mt-2 text-xl leading-snug md:text-2xl">
                                {hero.valueProposition}
                            </p>
                            <p className="mt-3 text-sm tabular-nums text-[var(--tenue)]">
                                Caracas {formatHour(clock, locale)}
                                {clima &&
                                    ` · ${formatTemperature(clima.temperatura, locale)} · ${t(`clima_${clima.estado}`)}`}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <a
                            href={cvPath(locale)}
                            download
                            onClick={() => trackCvDownload(locale)}
                            className="inline-flex items-center gap-3 px-6 py-3.5 text-lg font-semibold text-[#1a1a18] hover:brightness-95"
                            style={{ background: MURAL.ocre }}
                        >
                            {t('hero_cta_cv')}
                            <Arrow rotate={90} />
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-2 bg-[var(--concreto)] px-5 py-3.5 text-lg text-[var(--tinta)] hover:underline"
                        >
                            {t('hero_cta_contact')}
                            <Arrow />
                        </a>
                    </div>
                </section>

                <div className="space-y-[55vh] pb-[40vh] pt-[30vh]">
                    <Muro id="impact" title={t('impact_title')} seed={2}>
                        {/* Las Cifras clave son un mural: baldosas de anchos distintos. */}
                        <ul className="grid grid-cols-2 gap-1 md:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
                            {keyFigures.map((f, i) => (
                                <li
                                    key={f.label}
                                    className="flex min-h-44 flex-col justify-between p-4 md:min-h-56"
                                    style={{ background: tiles[i % 4], color: tileInk[i % 4] }}
                                >
                                    <span className="text-[clamp(2.75rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                                        {f.value}
                                    </span>
                                    <span>
                                        <span className="block text-lg leading-tight">
                                            {f.label}
                                        </span>
                                        {f.backing.kind === 'project' && f.backing.id ? (
                                            <Link
                                                to={localizedPath(
                                                    locale,
                                                    projectPath(f.backing.id),
                                                )}
                                                className="mt-1 block text-sm underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </Link>
                                        ) : (
                                            <a
                                                href="#experience"
                                                className="mt-1 block text-sm underline underline-offset-4"
                                            >
                                                {f.backing.label}
                                            </a>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Muro>

                    <Muro id="experience" title={t('experience_title')} seed={3}>
                        <ol className="space-y-10">
                            {experiences.map((e, i) => {
                                const project = projects.find((p) => p.experienceId === e.id);
                                return (
                                    <li key={e.id} className="grid grid-cols-[0.9rem_1fr] gap-4">
                                        <span
                                            aria-hidden="true"
                                            className="mt-2 h-3.5 w-3.5"
                                            style={{ background: tiles[i % 3] }}
                                        />
                                        <div className="max-w-[40rem]">
                                            <p className="text-sm tabular-nums text-[var(--tenue)]">
                                                {e.period}
                                            </p>
                                            <h3 className="text-2xl font-medium tracking-tight">
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
                                                    className="mt-2 inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
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
                    </Muro>

                    <Muro id="projects" title={t('projects_title')} seed={4}>
                        <ul className="grid gap-12 lg:grid-cols-2">
                            {featuredProjects.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        to={localizedPath(locale, projectPath(p.id))}
                                        className="group block"
                                    >
                                        <ProjectCover
                                            project={p}
                                            sizes="(min-width: 1024px) 30vw, 100vw"
                                            lazy
                                        />
                                        <h3 className="mt-4 flex items-center gap-2 text-2xl font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
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
                    </Muro>

                    <Muro id="skills" title={t('skills_title')} seed={5}>
                        <dl className="grid gap-8 md:grid-cols-3">
                            {skills.map((s) => (
                                <div key={s.name}>
                                    <dt className="text-xl font-semibold">{s.name}</dt>
                                    <dd className="mt-2 text-lg leading-relaxed text-[var(--tenue)]">
                                        {s.items.join(' · ')}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Muro>

                    <Muro id="contact" title={t('contact_title')} seed={0}>
                        <p className="max-w-[36rem] text-2xl leading-snug">{t('contact_phrase')}</p>
                        <a
                            href={`mailto:${profile.email}`}
                            onClick={() => trackContact('email')}
                            className="mt-6 block break-words text-[clamp(1.6rem,4.5vw,3.5rem)] font-medium tracking-[-0.02em] underline decoration-2 underline-offset-8"
                            style={{ textDecorationColor: MURAL.rojo }}
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
                    </Muro>
                </div>
            </main>
        </div>
    );
};
