import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import { Block, Chip } from '../../components/Block';
import { Morph, titleTransitionName } from '../../components/Morph';

import { ProjectCover, ProjectType } from './ProjectCover';

// En escritorio caben 3 tarjetas por fila dentro de un bloque de 860 px.
const CARD_SIZES = '(min-width: 768px) 270px, 100vw';

/** Proyectos destacados: la tarjeta entera lleva al Caso de estudio. */
export const FeaturedProjects: React.FC = () => {
    const { t, locale, content } = useI18n();
    return (
        <Block id="projects" title={t('featured_title')}>
            <ul className="grid gap-4 md:grid-cols-3">
                {content.featuredProjects.map((project) => (
                    <li key={project.id}>
                        <Link
                            to={localizedPath(locale, projectPath(project.id))}
                            className="group flex h-full flex-col gap-3 rounded-xl border border-line p-3 transition-colors hover:border-primary"
                        >
                            <ProjectCover project={project} sizes={CARD_SIZES} compact lazy />
                            <ProjectType project={project} />
                            <Morph name={titleTransitionName(project.id)}>
                                <h3 className="text-lg text-ink group-hover:underline underline-offset-4">
                                    {project.title}
                                </h3>
                            </Morph>
                            <p className="text-sm text-muted">{project.caseStudy.summary}</p>
                            <ul
                                className="mt-auto flex flex-wrap gap-1.5"
                                aria-label={t('tech_aria')}
                            >
                                {project.tech.map((tech) => (
                                    <Chip key={tech}>{tech}</Chip>
                                ))}
                            </ul>
                        </Link>
                    </li>
                ))}
            </ul>
        </Block>
    );
};
