import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@lib/i18n';

import { useCoverScene } from '../../scene/environment';

import { IMAGE_SIZES } from '@/content/data/image-sizes';
import { responsiveImage } from '@/content/images';
import type { ResolvedProject } from '@/content';

type GalleryItem = ResolvedProject['caseStudy']['gallery'][number];

// Una captura vertical (más alta que ancha) ocupa 2 filas; una horizontal, 2 columnas.
const isPortrait = (src: string) => {
    const size = IMAGE_SIZES[src];
    return !!size && size.height > size.width;
};

/**
 * Galería del Caso de estudio: una cuadrícula que respeta la orientación de cada captura y un
 * visor a pantalla completa. Sin capturas (BE), la sección explica por qué.
 */
export const Gallery: React.FC<{ id: string; project: ResolvedProject }> = ({ id, project }) => {
    const { t } = useI18n();
    const headingId = useId();
    const { gallery: images, diagram } = project.caseStudy;
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const buttons = useRef<Array<HTMLButtonElement | null>>([]);

    return (
        <section id={id} aria-labelledby={headingId} className="space-y-4 scroll-mt-24">
            <h2 id={headingId} className="scroll-mt-24 text-2xl text-ink">
                {t('project_gallery_title')}
            </h2>
            {images.length === 0 ? (
                <p className="leading-relaxed text-muted">{diagram?.noScreenshots}</p>
            ) : (
                <ul className="grid grid-flow-row-dense grid-cols-2 gap-3 md:grid-cols-4">
                    {images.map((image, i) => {
                        const portrait = isPortrait(image.src);
                        return (
                            <li
                                key={image.src}
                                style={portrait ? { gridRow: 'span 2' } : { gridColumn: 'span 2' }}
                                className={portrait ? 'aspect-[1/2]' : 'aspect-[2/1]'}
                            >
                                <button
                                    type="button"
                                    ref={(el) => {
                                        buttons.current[i] = el;
                                    }}
                                    onClick={() => setOpenIndex(i)}
                                    className="block h-full w-full cursor-zoom-in overflow-hidden rounded-lg border border-line"
                                >
                                    <img
                                        {...responsiveImage(image.src)}
                                        sizes={
                                            portrait
                                                ? '(min-width: 900px) 200px, (min-width: 768px) 25vw, 50vw'
                                                : '(min-width: 900px) 400px, (min-width: 768px) 50vw, 100vw'
                                        }
                                        alt={image.alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover object-top"
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
            {openIndex !== null && (
                <Viewer
                    title={project.title}
                    images={images}
                    index={openIndex}
                    onIndexChange={setOpenIndex}
                    onClose={() => setOpenIndex(null)}
                    opener={buttons.current[openIndex]}
                />
            )}
        </section>
    );
};

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Visor modal: mientras está abierto, el resto de la página es inerte y Tab no sale del diálogo.
 * Esc cierra y las flechas recorren las capturas en círculo. Al cerrarse, el foco vuelve a la
 * captura que lo abrió.
 */
const Viewer: React.FC<{
    title: string;
    images: GalleryItem[];
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
    opener: HTMLElement | null;
}> = ({ title, images, index, onIndexChange, onClose, opener }) => {
    const { t } = useI18n();
    const dialog = useRef<HTMLDivElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const returnFocusTo = useRef(opener);
    useCoverScene(true);

    const step = (delta: number) => onIndexChange((index + delta + images.length) % images.length);

    // Las teclas se leen en cada render para usar el índice actual.
    const handleKey = useRef<(event: KeyboardEvent) => void>(() => {});
    handleKey.current = (event) => {
        if (event.key === 'Escape') onClose();
        else if (event.key === 'ArrowRight') step(1);
        else if (event.key === 'ArrowLeft') step(-1);
        else if (event.key === 'Tab' && dialog.current) {
            const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && (active === first || !dialog.current.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (active === last || !dialog.current.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => handleKey.current(event);
        window.addEventListener('keydown', onKeyDown);
        closeButton.current?.focus();
        // El resto de la página queda inerte: ni el foco ni los lectores de pantalla llegan a él.
        const siblings = Array.from(document.body.children).filter(
            (el) => !el.contains(dialog.current) && !el.hasAttribute('inert'),
        );
        siblings.forEach((el) => el.setAttribute('inert', ''));
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            siblings.forEach((el) => el.removeAttribute('inert'));
            // Después de quitar `inert`: un elemento inerte no puede recibir el foco.
            returnFocusTo.current?.focus();
        };
    }, []);

    const current = images[index];
    const control =
        'rounded-full border border-white/40 bg-black/60 px-4 py-2 text-sm font-semibold text-white hover:bg-black/80';
    const count = t('viewer_count')
        .replace('{n}', String(index + 1))
        .replace('{total}', String(images.length));

    return createPortal(
        <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} · ${t('project_gallery_title')}`}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/95 p-4 md:p-10"
        >
            <button
                ref={closeButton}
                type="button"
                onClick={onClose}
                className={`absolute right-4 top-4 ${control}`}
            >
                {t('viewer_close')}
            </button>
            <img
                {...responsiveImage(current.src)}
                sizes="100vw"
                alt={current.alt}
                className="max-h-[75vh] w-auto max-w-full object-contain"
            />
            <p className="text-center text-sm text-white" aria-live="polite">
                {current.alt} · {count}
            </p>
            <div className="flex gap-3">
                <button type="button" onClick={() => step(-1)} className={control}>
                    {t('viewer_prev')}
                </button>
                <button type="button" onClick={() => step(1)} className={control}>
                    {t('viewer_next')}
                </button>
            </div>
        </div>,
        document.body,
    );
};
