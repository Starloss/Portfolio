import React from 'react';
import { useI18n } from '@lib/i18n';

import type { Project } from '@/lib/types';

interface Props {
    project: Project;
}

export const ProjectCard: React.FC<Props> = ({ project }) => {
    const { t } = useI18n();
    return (
        <li className="group min-w-[310px] max-w-[360px] rounded-xl border border-slate-300 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70 backdrop-blur p-5 hover:border-brand-500 transition-colors">
            <a href={`/projects/${project.id}`} className="inline-block">
                <h3 className="text-lg font-semibold text-brand-400 group-hover:underline underline-offset-4">
                    {project.title}
                </h3>
            </a>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t(project.description)}
            </p>
            {project.tech && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('tech_aria')}>
                    {project.tech.map((tch) => (
                        <li
                            key={tch}
                            className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 px-2 py-1 rounded-full"
                        >
                            {tch}
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};
