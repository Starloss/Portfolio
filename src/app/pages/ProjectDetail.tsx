import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';

import { BackgroundScene } from '../components/BackgroundScene';
import { MainHeader } from '../components/MainHeader';
import { Badge } from '../components/ui/Badge';
import { getProjectById } from '../features/projects/data';

export const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useI18n();
    const project = id ? getProjectById(id) : undefined;
    const [imageIndex, setImageIndex] = useState(0);
    const [isPortraitImage, setIsPortraitImage] = useState(false);

    useEffect(() => {
        setIsPortraitImage(false);
    }, [id, imageIndex]);

    if (!project) {
        return (
            <main className="min-h-screen px-6 py-14 max-w-3xl mx-auto space-y-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {t('project_not_found')}
                </h1>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                >
                    <span aria-hidden="true">←</span>
                    {t('project_go_back')}
                </Link>
            </main>
        );
    }

    const nextImage = () => setImageIndex((prev) => (prev + 1) % project.images.length);
    const prevImage = () =>
        setImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    const onImageLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth <= 0 || naturalHeight <= 0) {
            setIsPortraitImage(false);
            return;
        }
        setIsPortraitImage(naturalHeight > naturalWidth);
    };

    return (
        <>
            <BackgroundScene />
            <MainHeader activeId="projects" />
            <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 space-y-8">
                <Link
                    to="/#projects"
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                >
                    <span aria-hidden="true">←</span>
                    {t('project_go_back')}
                </Link>

                <section className="relative space-y-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/55 backdrop-blur p-6 md:p-8">
                    <Badge variant="outline" className="absolute right-6 top-6">
                        {project.company}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                        {project.title}
                    </h1>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {t(project.description)}
                    </p>

                    <div className="space-y-2" aria-label={t('project_role_aria')}>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {t('project_role_title')}
                        </h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {t(project.role)}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {t('project_contributions_title')}
                        </h2>
                        <ul
                            className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300"
                            aria-label={t('project_contributions_aria')}
                        >
                            {project.contributions.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    {t(item)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                        <img
                            src={project.images[imageIndex]}
                            alt={`${project.title} ${imageIndex + 1}`}
                            onLoad={onImageLoad}
                            className={`w-full h-[260px] md:h-[420px] ${isPortraitImage ? 'object-contain bg-slate-200/70 dark:bg-slate-900' : 'object-cover'}`}
                        />
                        <button
                            onClick={prevImage}
                            aria-label={t('project_prev_image')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900/85 transition"
                        >
                            ‹
                        </button>
                        <button
                            onClick={nextImage}
                            aria-label={t('project_next_image')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900/85 transition"
                        >
                            ›
                        </button>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {t('project_stack')}
                        </h2>
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
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {t('project_repository_title')}
                        </h2>
                        <div aria-label={t('project_repository_aria')}>
                            <Badge variant="outline">{t('project_repository_private')}</Badge>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {t('project_years')}:
                        </span>{' '}
                        {project.years}
                    </p>
                </section>

                <footer className="text-center text-xs text-slate-600 dark:text-slate-500 pb-10">
                    © {currentYear()}
                </footer>
            </main>
        </>
    );
};
