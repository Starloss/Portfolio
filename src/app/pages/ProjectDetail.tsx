import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { currentYear } from '@lib/date';
import { useI18n } from '@lib/i18n';

import { BackgroundScene } from '../components/BackgroundScene';
import { getProjectById } from '../features/projects/data';

export const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useI18n();
    const project = id ? getProjectById(id) : undefined;
    const [imageIndex, setImageIndex] = useState(0);

    if (!project) {
        return (
            <main className="min-h-screen px-6 py-14 max-w-3xl mx-auto space-y-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {t('project_not_found')}
                </h1>
                <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-400 transition"
                >
                    {t('project_back')}
                </Link>
            </main>
        );
    }

    const nextImage = () => setImageIndex((prev) => (prev + 1) % project.images.length);
    const prevImage = () =>
        setImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);

    return (
        <>
            <BackgroundScene />
            <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 space-y-8">
                <a
                    href="/#projects"
                    className="inline-flex items-center text-sm px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                >
                    {t('project_back')}
                </a>

                <section className="space-y-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/55 backdrop-blur p-6 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                        {project.title}
                    </h1>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {t(project.description)}
                    </p>

                    <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                        <img
                            src={project.images[imageIndex]}
                            alt={`${project.title} ${imageIndex + 1}`}
                            className="w-full h-[260px] md:h-[420px] object-cover"
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
