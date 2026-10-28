import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import { Block } from '../../components/Block';

// El Home muestra los 2 Logros más importantes de cada Experiencia; el CV los muestra todos.
const HOME_ACHIEVEMENTS = 2;

/**
 * Línea de tiempo de la Trayectoria, de la más reciente a la más antigua. La línea es el cable
 * del Teleférico y cada Experiencia una estación; se dibuja con pseudo-elementos para que la
 * lista siga siendo válida.
 */
export const ExperienceSection: React.FC = () => {
    const { t, locale, content } = useI18n();
    return (
        <Block id="experience" title={t('experience_title')}>
            <ol
                aria-label={t('experience_list_aria')}
                className="relative space-y-8 pl-7 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:rounded-full before:bg-muted before:content-['']"
            >
                {content.experiences.map((item) => {
                    const projects = content.projects.filter((p) => p.experienceId === item.id);
                    return (
                        <li
                            key={item.id}
                            id={`experience-${item.id}`}
                            className="relative scroll-mt-24 before:absolute before:-left-7 before:top-1.5 before:h-4 before:w-4 before:rounded-full before:border-2 before:border-primary before:bg-page before:content-['']"
                        >
                            <p className="text-xs text-muted">
                                {item.period} · {item.location}
                            </p>
                            <h3 className="mt-1 text-lg text-ink">
                                {item.role} · {item.company}
                            </h3>
                            <ul
                                aria-label={t('experience_achievements_aria')}
                                className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink"
                            >
                                {item.achievements.slice(0, HOME_ACHIEVEMENTS).map((a) => (
                                    <li key={a}>{a}</li>
                                ))}
                            </ul>
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={localizedPath(locale, projectPath(project.id))}
                                    className="mr-4 mt-3 inline-block text-sm font-semibold text-primary hover:underline underline-offset-4"
                                >
                                    {t('experience_project').replace('{title}', project.title)}
                                </Link>
                            ))}
                        </li>
                    );
                })}
            </ol>
        </Block>
    );
};
