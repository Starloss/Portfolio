import React from 'react';

import { responsiveImage } from '@/content/images';
import type { ResolvedProject } from '@/content';

type ResolvedDiagram = NonNullable<ResolvedProject['caseStudy']['diagram']>;

/** Diagrama propio (BE): los pasos del ciclo, como una sola imagen con su texto alternativo. */
export const Diagram: React.FC<{ diagram: ResolvedDiagram; compact?: boolean }> = ({
    diagram,
    compact = false,
}) => (
    <div
        role="img"
        aria-label={diagram.alt}
        className={`flex aspect-[16/9] w-full flex-wrap content-center items-center justify-center rounded-lg border border-line bg-surface ${
            compact ? 'gap-1 p-2 text-[11px]' : 'gap-2 p-4 text-sm md:gap-3 md:text-base'
        }`}
    >
        {diagram.steps.map((step, i) => (
            // Cada paso lleva su flecha: si la línea se corta, la flecha queda al final y no al inicio.
            <span key={step} className="inline-flex items-center gap-1 whitespace-nowrap">
                <span
                    className={`rounded-md bg-primary font-semibold text-on-primary ${
                        compact ? 'px-1.5 py-1' : 'px-3 py-2'
                    }`}
                >
                    {step}
                </span>
                {i < diagram.steps.length - 1 && <span className="font-bold text-amber">→</span>}
            </span>
        ))}
    </div>
);

/** Portada de un Proyecto: su primera captura o, si no tiene capturas publicables, su diagrama. */
export const ProjectCover: React.FC<{
    project: ResolvedProject;
    sizes: string;
    compact?: boolean;
    lazy?: boolean;
}> = ({ project, sizes, compact, lazy = false }) => {
    const { gallery, diagram } = project.caseStudy;
    const first = gallery[0];
    if (!first) return diagram ? <Diagram diagram={diagram} compact={compact} /> : null;
    return (
        <img
            {...responsiveImage(first.src)}
            sizes={sizes}
            alt={first.alt}
            loading={lazy ? 'lazy' : undefined}
            decoding="async"
            className="aspect-[16/9] w-full rounded-lg object-cover object-top"
        />
    );
};
