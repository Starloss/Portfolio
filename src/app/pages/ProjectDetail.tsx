import React, { useEffect, useRef, useState } from 'react';
import { FiExternalLink, FiGithub } from 'react-icons/fi';
import { Link, useLocation, useParams } from 'react-router-dom';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import { MainHeader } from '../components/MainHeader';
import { Badge } from '../components/ui/Badge';
import { useCoverScene } from '../scene/environment';
import { Scene } from '../scene/Scene';

import { responsiveImage } from '@/content/images';
import type { ResolvedProject } from '@/content';

// La Escena del Caso de estudio queda fija "sobre las nubes", donde viven los Proyectos en el Home.
const CASE_STUDY_CAMERA_HEIGHT = 1;

const headingClass = 'text-xl font-semibold text-slate-800 dark:text-white';
const textClass = 'text-slate-700 dark:text-slate-300 leading-relaxed';

export const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t, locale, content } = useI18n();
    const project = content.projects.find((p) => p.id === id);

    if (!project) {
        return (
            <main className="min-h-screen px-6 py-14 max-w-3xl mx-auto space-y-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {t('project_not_found')}
                </h1>
                <Link
                    to={localizedPath(locale, '/')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                >
                    <span aria-hidden="true">←</span>
                    {t('project_go_back')}
                </Link>
            </main>
        );
    }
    return <CaseStudyPage key={project.id} project={project} />;
};

const CaseStudyPage: React.FC<{ project: ResolvedProject }> = ({ project }) => {
    const location = useLocation();
    const { t, locale, content } = useI18n();
    const navState = location.state as { direction?: 'prev' | 'next' } | null;
    const projectTransitionClass =
        (navState?.direction ?? 'next') === 'next' ? 'project-enter-next' : 'project-enter-prev';
    const cs = project.caseStudy;

    const projects = content.featuredProjects;
    const index = projects.findIndex((p) => p.id === project.id);
    const isFeatured = index >= 0;
    const previousProject = isFeatured
        ? projects[(index - 1 + projects.length) % projects.length]
        : undefined;
    const nextProject = isFeatured ? projects[(index + 1) % projects.length] : undefined;

    return (
        <>
            <Scene height={CASE_STUDY_CAMERA_HEIGHT} />
            <MainHeader activeId="projects" />
            <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 pb-28 md:pb-10 space-y-8">
                <Link
                    to={`${localizedPath(locale, '/')}#projects`}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                >
                    <span aria-hidden="true">←</span>
                    {t('project_go_back')}
                </Link>

                <section
                    className={`relative space-y-6 rounded-2xl border border-line bg-surface p-6 md:p-8 ${projectTransitionClass}`}
                >
                    <Badge variant="outline" className="absolute right-6 top-6">
                        {project.company ?? t('project_personal')}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                        {project.title}
                    </h1>
                    <p className={textClass}>{cs.summary}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {t('project_period')}:
                        </span>{' '}
                        {project.period}
                    </p>

                    <div className="space-y-2" aria-label={t('project_role_aria')}>
                        <h2 className={headingClass}>{t('project_role_title')}</h2>
                        <p className={textClass}>{cs.role}</p>
                    </div>

                    <div className="space-y-2">
                        <h2 className={headingClass}>{t('project_context_title')}</h2>
                        {cs.context.map((paragraph) => (
                            <p key={paragraph} className={textClass}>
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <h2 className={headingClass}>{t('project_problem_title')}</h2>
                        <p className={textClass}>{cs.problem}</p>
                    </div>

                    <div className="space-y-3">
                        <h2 className={headingClass}>{t('project_decisions_title')}</h2>
                        <ol className="space-y-3">
                            {cs.decisions.map((d, i) => (
                                <li key={d.title} className="flex gap-3">
                                    <span className="font-bold text-primary" aria-hidden="true">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">
                                            {d.title}
                                        </h3>
                                        <p className={textClass}>{d.explanation}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="space-y-3">
                        <h2 className={headingClass}>{t('project_impact_title')}</h2>
                        <ul className="grid gap-3 sm:grid-cols-3">
                            {cs.impact.map((item) => (
                                <li
                                    key={item.text}
                                    className="rounded-xl border border-slate-300 dark:border-slate-700 p-4"
                                >
                                    {item.metric && (
                                        <span className="block text-2xl font-bold text-primary">
                                            {item.metric}
                                        </span>
                                    )}
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {item.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {cs.gallery.length > 0 && <Gallery project={project} />}

                    <div className="space-y-3">
                        <h2 className={headingClass}>{t('project_stack')}</h2>
                        <ul className="flex flex-wrap gap-2" aria-label={t('tech_aria')}>
                            {project.tech.map((item) => (
                                <li
                                    key={item}
                                    className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 px-2 py-1 rounded-full"
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h2 className={headingClass}>{t('project_repository_title')}</h2>
                        <div
                            className="flex flex-wrap gap-3"
                            aria-label={t('project_repository_aria')}
                        >
                            {project.repositoryUrl ? (
                                <a
                                    href={project.repositoryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <FiGithub className="h-4 w-4" />
                                    {t('project_repository_view')}
                                </a>
                            ) : (
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 text-sm font-medium text-muted cursor-default select-none dark:border-slate-700 dark:bg-slate-900/80">
                                    <FiGithub className="h-4 w-4" />
                                    {t('project_repository_private')}
                                </span>
                            )}
                            {project.liveUrl && (
                                <a
                                    href={project.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                                >
                                    <FiExternalLink className="h-4 w-4" />
                                    {t('project_live_url_view')}
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                <div
                    className={`fixed bottom-4 left-0 right-0 z-40 px-4 md:static md:px-0 ${projectTransitionClass}`}
                >
                    <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
                        {[
                            {
                                p: previousProject,
                                direction: 'prev',
                                label: `← ${t('project_prev_project')}`,
                            },
                            {
                                p: nextProject,
                                direction: 'next',
                                label: `${t('project_next_project')} →`,
                            },
                        ].map(({ p, direction, label }) =>
                            p ? (
                                <Link
                                    key={direction}
                                    to={localizedPath(locale, projectPath(p.id))}
                                    state={{ direction }}
                                    className="inline-flex items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <span>{label}</span>
                                    <span className="font-semibold text-primary">{p.title}</span>
                                </Link>
                            ) : null,
                        )}
                    </div>
                </div>

                <footer className="text-center text-xs text-slate-900 dark:text-slate-300 pb-10">
                    © {currentYear()}
                </footer>
            </main>
        </>
    );
};

const Gallery: React.FC<{ project: ResolvedProject }> = ({ project }) => {
    const { t } = useI18n();
    const images = project.caseStudy.gallery;
    const [index, setIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    useCoverScene(isOpen);
    const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const AUTOPLAY_MS = 4000;

    const next = () => setIndex((i) => (i + 1) % images.length);
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

    useEffect(() => {
        if (isOpen || images.length <= 1) return;
        const intervalId = window.setInterval(next, AUTOPLAY_MS);
        return () => window.clearInterval(intervalId);
    }, [isOpen, images.length]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
            if (event.key === 'ArrowRight') next();
            if (event.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        thumbnailRefs.current[index]?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        });
    }, [isOpen, index]);

    const current = images[index];
    const arrowClass =
        'absolute top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900/85 transition';

    return (
        <div className="space-y-3">
            <h2 className={headingClass}>{t('project_gallery_title')}</h2>
            <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="block w-full cursor-zoom-in"
                >
                    <img
                        {...responsiveImage(current.src)}
                        sizes="(min-width: 768px) 800px, 100vw"
                        alt={current.alt}
                        className="w-full h-[260px] md:h-[420px] object-contain bg-slate-200/70 dark:bg-slate-900"
                    />
                </button>
                <button
                    onClick={prev}
                    aria-label={t('project_prev_image')}
                    className={`left-3 ${arrowClass}`}
                >
                    ‹
                </button>
                <button
                    onClick={next}
                    aria-label={t('project_next_image')}
                    className={`right-3 ${arrowClass}`}
                >
                    ›
                </button>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-950/95 p-4 md:p-10"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${project.title} · ${t('project_gallery_aria')}`}
                >
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label={t('project_close_gallery')}
                        className="absolute right-5 top-5 z-[110] rounded-lg bg-slate-900/80 px-3 py-2 text-white hover:bg-slate-900"
                    >
                        ✕
                    </button>
                    <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-4">
                        <img
                            {...responsiveImage(current.src)}
                            sizes="100vw"
                            alt={current.alt}
                            className="max-h-[70vh] w-auto max-w-full object-contain"
                        />
                        <p className="text-sm text-slate-200">
                            {current.alt} · {index + 1}/{images.length}
                        </p>
                        <button
                            onClick={prev}
                            aria-label={t('project_prev_image')}
                            className={`left-2 md:left-4 ${arrowClass}`}
                        >
                            ‹
                        </button>
                        <button
                            onClick={next}
                            aria-label={t('project_next_image')}
                            className={`right-2 md:right-4 ${arrowClass}`}
                        >
                            ›
                        </button>
                        <div className="w-full overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-900/40 p-2">
                            <div className="mx-auto flex min-w-max items-center gap-2">
                                {images.map((image, i) => (
                                    <button
                                        key={image.src}
                                        type="button"
                                        ref={(element) => {
                                            thumbnailRefs.current[i] = element;
                                        }}
                                        onClick={() => setIndex(i)}
                                        aria-label={image.alt}
                                        aria-current={i === index ? 'true' : undefined}
                                        className={`h-16 w-24 overflow-hidden rounded-lg border transition ${
                                            i === index
                                                ? 'border-primary ring-2 ring-primary'
                                                : 'border-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        <img
                                            {...responsiveImage(image.src)}
                                            sizes="160px"
                                            alt=""
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
