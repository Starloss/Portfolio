import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@lib/i18n';

import { getProjectsSync } from './data';
import { ProjectCard } from './ProjectCard';

export const ProjectsList: React.FC = () => {
    const projects = getProjectsSync();
    const { t } = useI18n();
    const trackRef = useRef<HTMLUListElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const activePointerIdRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const movedRef = useRef(false);
    const suppressClickUntilRef = useRef(0);
    const startXRef = useRef(0);
    const startScrollRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    const loopProjects = useMemo(() => [...projects, ...projects], [projects]);

    const resetDrag = () => {
        isDraggingRef.current = false;
        activePointerIdRef.current = null;
        setIsDragging(false);
    };

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        const baseSpeed = 0.14;

        const tick = () => {
            if (!trackRef.current) return;
            const node = trackRef.current;
            const half = node.scrollWidth / 2;

            if (!isDraggingRef.current) {
                node.scrollLeft += baseSpeed;
            }

            if (node.scrollLeft >= half) node.scrollLeft -= half;
            if (node.scrollLeft < 0) node.scrollLeft += half;

            animationRef.current = window.requestAnimationFrame(tick);
        };

        animationRef.current = window.requestAnimationFrame(tick);

        return () => {
            if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        };
    }, []);

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
        startScrollRef.current = el.scrollLeft;
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

        const half = el.scrollWidth / 2;
        const delta = dragDelta * 1.9;
        let nextScroll = startScrollRef.current - delta;
        if (nextScroll >= half) nextScroll -= half;
        if (nextScroll < 0) nextScroll += half;
        el.scrollLeft = nextScroll;
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
            <ul
                ref={trackRef}
                className={`flex gap-5 overflow-x-scroll select-none [&::-webkit-scrollbar]:hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ scrollbarWidth: 'none' }}
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
                    <ProjectCard key={`${p.id}-${index}`} project={p} />
                ))}
            </ul>
        </div>
    );
};
