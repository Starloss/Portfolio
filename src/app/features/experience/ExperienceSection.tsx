import React from 'react';
import { useI18n } from '@lib/i18n';

export const ExperienceSection: React.FC = () => {
    const { t, content } = useI18n();
    return (
        <section id="experience" className="space-y-6" aria-label={t('experience_aria')}>
            <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-white">
                {t('experience_title')}{' '}
                <span className="h-px grow bg-slate-300 dark:bg-slate-700" />
            </h2>
            <ul className="space-y-8" aria-label="lista de experiencias">
                {content.experiences.map((item) => {
                    return (
                        <li
                            id={`experience-${item.id}`}
                            key={item.id}
                            className="group rounded-lg border border-slate-300 dark:border-slate-800 p-5 bg-white/70 dark:bg-slate-900/40"
                        >
                            <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                                <h3 className="text-lg font-semibold text-brand-400">
                                    {item.role} · {item.company}
                                </h3>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {item.period}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {item.location}
                            </p>
                            {item.tech.length > 0 && (
                                <ul
                                    className="flex flex-wrap gap-1.5 mt-3"
                                    aria-label={t('experience_tech_aria')}
                                >
                                    {item.tech.map((tch) => (
                                        <li
                                            key={tch}
                                            className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 px-2 py-1 rounded-full"
                                        >
                                            {tch}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                {item.achievements.map((b) => (
                                    <li key={b}>{b}</li>
                                ))}
                            </ul>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
