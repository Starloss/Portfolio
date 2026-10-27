import React from 'react';
import { Badge } from '@app/components/ui/Badge';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import type { ResolvedProject } from '@/content';

interface Props {
    project: ResolvedProject;
    isDragging: boolean;
}

export const ProjectCard: React.FC<Props> = ({ project, isDragging }) => {
    const { t, locale } = useI18n();
    return (
        <li className="group flex-none min-w-[310px] max-w-[360px]">
            <a
                href={localizedPath(locale, projectPath(project.id))}
                className={`relative block h-full rounded-xl border border-slate-300 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70 backdrop-blur p-5 hover:border-brand-500 transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
            >
                <Badge variant="outline" className="absolute right-4 top-4">
                    {project.company ?? t('project_personal')}
                </Badge>
                <h3 className="text-lg font-semibold text-brand-400 group-hover:underline underline-offset-4">
                    {project.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {project.caseStudy.summary}
                </p>
                {project.tech.length > 0 && (
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
            </a>
        </li>
    );
};
