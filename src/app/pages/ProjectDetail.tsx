import React, { useId } from 'react';
import { FiArrowUpRight } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import { Chip } from '../components/Block';
import { MainHeader } from '../components/MainHeader';
import { Morph, titleTransitionName } from '../components/Morph';
import { Gallery } from '../features/projects/Gallery';
import { ProjectCover, ProjectType } from '../features/projects/ProjectCover';
import { Scene } from '../scene/Scene';

import type { ResolvedProject } from '@/content';

// La Escena del Caso de estudio queda fija a la altura que tiene el Viaje de cámara del Home al
// llegar a Proyectos destacados (medida en escritorio de 1280 × 800: progreso 0,66), para que la
// transición entre las dos páginas no cambie el paisaje.
const CASE_STUDY_CAMERA_HEIGHT = 0.22;

// La portada ocupa el ancho del relato: hasta ~780 px en escritorio, toda la pantalla en móvil.
const COVER_SIZES = '(min-width: 900px) 780px, 100vw';

const linkClass =
    'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors';
const outlineLinkClass = `${linkClass} border-line text-ink hover:border-primary`;
const backLinkClass = 'text-sm font-semibold text-primary hover:underline underline-offset-4';

// Las secciones del relato a las que lleva el índice de la ficha.
const SECTIONS = { context: 'context', decisions: 'decisions', gallery: 'gallery' } as const;

// "↗" como ícono: la fuente lo muestra como emoji en Windows y el lector de pantalla lo leería.
const ExternalArrow: React.FC = () => (
    <FiArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" />
);

const BackLink: React.FC = () => {
    const { t, locale } = useI18n();
    return (
        <Link to={`${localizedPath(locale, '/')}#projects`} className={backLinkClass}>
            {t('project_back')}
        </Link>
    );
};

export const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t, locale, content } = useI18n();
    const project = content.projects.find((p) => p.id === id);

    if (!project) {
        return (
            <>
                <Scene height={CASE_STUDY_CAMERA_HEIGHT} />
                <MainHeader />
                <main className="mx-auto max-w-3xl px-4 py-14">
                    <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 md:p-8">
                        <h1 className="text-3xl text-ink">{t('project_not_found')}</h1>
                        <Link to={localizedPath(locale, '/')} className={backLinkClass}>
                            {t('project_home')}
                        </Link>
                    </div>
                </main>
            </>
        );
    }
    return <CaseStudyPage key={project.id} project={project} />;
};

/** Caso de estudio con ficha lateral: la ficha a la izquierda y el relato a la derecha. */
const CaseStudyPage: React.FC<{ project: ResolvedProject }> = ({ project }) => (
    <>
        <Scene height={CASE_STUDY_CAMERA_HEIGHT} />
        <MainHeader activeId="projects" />
        <main className="mx-auto max-w-[1120px] px-4 pb-10">
            <div className="grid gap-8 rounded-2xl border border-line bg-surface p-5 md:p-8 min-[900px]:grid-cols-[300px_minmax(0,1fr)]">
                <Sheet project={project} />
                <Story project={project} />
            </div>
        </main>
        <footer className="pb-10 text-center text-xs text-ink">© {currentYear()}</footer>
    </>
);

const Sheet: React.FC<{ project: ResolvedProject }> = ({ project }) => {
    const { t } = useI18n();
    const titleId = useId();
    const impactId = useId();
    const cs = project.caseStudy;
    return (
        <aside
            aria-labelledby={titleId}
            className="space-y-5 self-start min-[900px]:sticky min-[900px]:top-24"
        >
            <BackLink />
            <div className="space-y-2">
                <ProjectType project={project} />
                <Morph name={titleTransitionName(project.id)}>
                    <h1 id={titleId} className="text-3xl text-ink md:text-4xl">
                        {project.title}
                    </h1>
                </Morph>
                <p className="text-ink">{cs.summary}</p>
                <p className="text-sm text-muted">
                    {project.period} · {cs.role}
                </p>
            </div>
            <ul className="flex flex-wrap gap-1.5" aria-label={t('tech_aria')}>
                {project.tech.map((tech) => (
                    <Chip key={tech}>{tech}</Chip>
                ))}
            </ul>
            {(project.liveUrl || project.repositoryUrl) && (
                <div className="flex flex-wrap gap-2">
                    {project.liveUrl && (
                        <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${linkClass} border-primary bg-primary text-on-primary hover:opacity-90`}
                        >
                            {t('project_demo')}
                            <ExternalArrow />
                        </a>
                    )}
                    {project.repositoryUrl && (
                        <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={outlineLinkClass}
                        >
                            {t('project_repository')}
                            <ExternalArrow />
                        </a>
                    )}
                </div>
            )}
            <section aria-labelledby={impactId} className="space-y-3">
                <h2 id={impactId} className="text-lg text-ink">
                    {t('project_impact_title')}
                </h2>
                <ul className="space-y-3">
                    {cs.impact.map((item) => (
                        <li key={item.text} className="rounded-xl border border-line p-3">
                            {item.metric && (
                                <span className="block font-display text-2xl font-bold text-primary">
                                    {item.metric}
                                </span>
                            )}
                            <span className="text-sm text-ink">{item.text}</span>
                        </li>
                    ))}
                </ul>
            </section>
            <nav aria-label={t('project_index_aria')}>
                <ul className="space-y-1 text-sm">
                    {[
                        [SECTIONS.context, t('project_context_title')],
                        [SECTIONS.decisions, t('project_decisions_title')],
                        [SECTIONS.gallery, t('project_gallery_title')],
                    ].map(([id, label]) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className="text-primary hover:underline underline-offset-4"
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

const headingClass = 'scroll-mt-24 text-2xl text-ink';
const textClass = 'leading-relaxed text-ink';

const Story: React.FC<{ project: ResolvedProject }> = ({ project }) => {
    const { t } = useI18n();
    const cs = project.caseStudy;
    return (
        <article className="min-w-0 space-y-10">
            <ProjectCover project={project} sizes={COVER_SIZES} />

            <section id={SECTIONS.context} className="space-y-3 scroll-mt-24">
                <h2 className={headingClass}>{t('project_context_title')}</h2>
                {cs.context.map((paragraph) => (
                    <p key={paragraph} className={textClass}>
                        {paragraph}
                    </p>
                ))}
                <h3 className="pt-2 text-lg text-ink">{t('project_problem_title')}</h3>
                <p className={textClass}>{cs.problem}</p>
            </section>

            <section id={SECTIONS.decisions} className="space-y-4 scroll-mt-24">
                <h2 className={headingClass}>{t('project_decisions_title')}</h2>
                <ol className="space-y-5">
                    {cs.decisions.map((d, i) => (
                        <li key={d.title} className="space-y-1">
                            <h3 className="text-lg text-ink">
                                <span className="mr-3 text-amber" aria-hidden="true">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                {d.title}
                            </h3>
                            <p className={textClass}>{d.explanation}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <Gallery id={SECTIONS.gallery} project={project} />

            <ProjectNavigation project={project} />
        </article>
    );
};

/** Anterior y siguiente en el orden de Proyectos destacados, en círculo. */
const ProjectNavigation: React.FC<{ project: ResolvedProject }> = ({ project }) => {
    const { t, locale, content } = useI18n();
    const projects = content.featuredProjects;
    const index = projects.findIndex((p) => p.id === project.id);
    if (index < 0 || projects.length < 2) return null;
    const previous = projects[(index - 1 + projects.length) % projects.length];
    const next = projects[(index + 1) % projects.length];
    return (
        <nav aria-label={t('project_nav_aria')} className="flex flex-wrap justify-between gap-3">
            <Link to={localizedPath(locale, projectPath(previous.id))} className={outlineLinkClass}>
                ← {previous.title}
            </Link>
            <Link to={localizedPath(locale, projectPath(next.id))} className={outlineLinkClass}>
                {next.title} →
            </Link>
        </nav>
    );
};
