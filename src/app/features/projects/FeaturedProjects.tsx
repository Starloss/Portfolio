import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import { Block, Chip } from '../../components/Block';

import { responsiveImage } from '@/content/images';
import type { ResolvedProject } from '@/content';

// En escritorio caben 3 tarjetas por fila dentro de un bloque de 860 px.
const CARD_SIZES = '(min-width: 768px) 270px, 100vw';

const Cover: React.FC<{ project: ResolvedProject }> = ({ project }) => {
    const first = project.caseStudy.gallery[0];
    if (!first) {
        // Sin capturas publicables (BE): portada con el color primario hasta que exista su diagrama.
        return (
            <div
                aria-hidden="true"
                className="flex aspect-[16/9] items-center justify-center rounded-lg bg-primary p-4 text-center font-display text-lg font-bold text-on-primary"
            >
                {project.title}
            </div>
        );
    }
    return (
        <img
            {...responsiveImage(first.src)}
            sizes={CARD_SIZES}
            alt={first.alt}
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] w-full rounded-lg object-cover object-top"
        />
    );
};

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
                            <Cover project={project} />
                            <p className="text-xs font-semibold text-amber">
                                {project.company
                                    ? `${t('project_work')} · ${project.company}`
                                    : t('project_personal')}
                            </p>
                            <h3 className="text-lg text-ink group-hover:underline underline-offset-4">
                                {project.title}
                            </h3>
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
