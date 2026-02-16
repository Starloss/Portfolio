import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@lib/i18n';

import { getProjectsSync } from './data';
import { ProjectCard } from './ProjectCard';

export const ProjectsList: React.FC = () => {
    const projects = getProjectsSync();
    const { t } = useI18n();
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLUListElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef(0);
    const setWidthRef = useRef(1);
    const logicalXRef = useRef(0);
    const activePointerIdRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const movedRef = useRef(false);
    const suppressClickUntilRef = useRef(0);
    const startXRef = useRef(0);
    const startLogicalXRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    const loopProjects = useMemo(() => [...projects, ...projects, ...projects], [projects]);

    const resetDrag = () => {
        isDraggingRef.current = false;
        activePointerIdRef.current = null;
        setIsDragging(false);
    };

    const applyTransform = () => {
        if (!trackRef.current) return;
        const width = Math.max(1, setWidthRef.current);
        const logical = ((logicalXRef.current % width) + width) % width;
        logicalXRef.current = logical;
        trackRef.current.style.transform = `translate3d(${-width - logical}px, 0, 0)`;
    };

    const measure = () => {
        if (!trackRef.current) return;
        const total = trackRef.current.scrollWidth;
        const setWidth = total / 3;
        if (setWidth > 0) {
            setWidthRef.current = setWidth;
        }
        applyTransform();
    };

    useEffect(() => {
        if (!trackRef.current) return;

        const autoSpeedPxPerSec = 32;
        measure();

        const tick = (time: number) => {
            if (!trackRef.current) return;

            if (lastFrameTimeRef.current === 0) {
                lastFrameTimeRef.current = time;
            }
            const dt = Math.min(0.05, (time - lastFrameTimeRef.current) / 1000);
            lastFrameTimeRef.current = time;

            if (!isDraggingRef.current) {
                logicalXRef.current += autoSpeedPxPerSec * dt;
            }

            applyTransform();

            animationRef.current = window.requestAnimationFrame((nextTime) => tick(nextTime));
        };

        animationRef.current = window.requestAnimationFrame((time) => tick(time));

        return () => {
            if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
            lastFrameTimeRef.current = 0;
        };
    }, []);

    useEffect(() => {
        measure();
        const onResize = () => measure();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [loopProjects.length]);

    useEffect(() => {
        const onWindowPointerUp = () => resetDrag();
        const onBlur = () => resetDrag();
        window.addEventListener('pointerup', onWindowPointerUp);
        window.addEventListener('pointercancel', onWindowPointerUp);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('pointerup', onWindowPointerUp);
            window.removeEventListener('pointercancel', onWindowPointerUp);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    const onPointerDown: React.PointerEventHandler<HTMLUListElement> = (event) => {
        if (event.button !== 0) return;
        const el = trackRef.current;
        if (!el) return;
        activePointerIdRef.current = event.pointerId;
        isDraggingRef.current = false;
        movedRef.current = false;
        startXRef.current = event.clientX;
        startLogicalXRef.current = logicalXRef.current;
    };

    const onPointerMove: React.PointerEventHandler<HTMLUListElement> = (event) => {
        if (!trackRef.current) return;
        if (activePointerIdRef.current !== event.pointerId) return;
        if ((event.buttons & 1) !== 1 && !isDraggingRef.current) return;
        const el = trackRef.current;
        const dragDelta = event.clientX - startXRef.current;
        if (!isDraggingRef.current && Math.abs(dragDelta) > 8) {
            isDraggingRef.current = true;
            movedRef.current = true;
            setIsDragging(true);
            el.setPointerCapture(event.pointerId);
        }
        if (!isDraggingRef.current) return;

        const delta = dragDelta * 1.08;
        logicalXRef.current = startLogicalXRef.current - delta;
        applyTransform();
    };

    const onPointerUp: React.PointerEventHandler<HTMLUListElement> = (event) => {
        if (!trackRef.current) return;
        if (activePointerIdRef.current !== event.pointerId) return;
        if (isDraggingRef.current) {
            trackRef.current.releasePointerCapture(event.pointerId);
        }
        if (movedRef.current) {
            suppressClickUntilRef.current = performance.now() + 250;
        }
        resetDrag();
    };

    const onPointerLeave: React.PointerEventHandler<HTMLUListElement> = (event) => {
        if ((event.buttons & 1) === 0) {
            resetDrag();
        }
    };

    const onClickCapture: React.MouseEventHandler<HTMLUListElement> = (event) => {
        if (performance.now() < suppressClickUntilRef.current) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 p-3 md:p-4">
            <div
                ref={viewportRef}
                className={`overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
                <ul
                    ref={trackRef}
                    className="flex gap-5 will-change-transform"
                    aria-label={t('projects_list_aria')}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onPointerLeave={onPointerLeave}
                    onClickCapture={onClickCapture}
                    onDragStart={(event) => event.preventDefault()}
                >
                    {loopProjects.map((p, index) => (
                        <ProjectCard key={`${p.id}-${index}`} project={p} isDragging={isDragging} />
                    ))}
                </ul>
            </div>
        </div>
    );
};
