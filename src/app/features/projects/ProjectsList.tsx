import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@lib/i18n';

import { getProjectsSync } from './data';
import { ProjectCard } from './ProjectCard';

export const ProjectsList: React.FC = () => {
    const projects = getProjectsSync();
    const { t } = useI18n();
    const trackRef = useRef<HTMLUListElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef(0);
    const targetScrollRef = useRef(0);
    const activePointerIdRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const movedRef = useRef(false);
    const suppressClickUntilRef = useRef(0);
    const startXRef = useRef(0);
    const startScrollRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    const loopProjects = useMemo(() => [...projects, ...projects, ...projects], [projects]);

    const resetDrag = () => {
        isDraggingRef.current = false;
        activePointerIdRef.current = null;
        setIsDragging(false);
    };

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        const autoSpeedPxPerSec = 32;

        const getSegmentWidth = () => el.scrollWidth / 3;
        const segment = getSegmentWidth();
        el.scrollLeft = segment;
        targetScrollRef.current = el.scrollLeft;

        const tick = (time: number) => {
            if (!trackRef.current) return;
            const node = trackRef.current;
            const currentSegment = node.scrollWidth / 3;

            if (lastFrameTimeRef.current === 0) {
                lastFrameTimeRef.current = time;
            }
            const dt = Math.min(0.05, (time - lastFrameTimeRef.current) / 1000);
            lastFrameTimeRef.current = time;

            if (!isDraggingRef.current) {
                targetScrollRef.current += autoSpeedPxPerSec * dt;
            }

            if (targetScrollRef.current < currentSegment * 0.5) {
                targetScrollRef.current += currentSegment;
                node.scrollLeft += currentSegment;
            }
            if (targetScrollRef.current > currentSegment * 1.5) {
                targetScrollRef.current -= currentSegment;
                node.scrollLeft -= currentSegment;
            }

            const diff = targetScrollRef.current - node.scrollLeft;
            const smoothing = isDraggingRef.current ? 0.38 : 0.12;
            node.scrollLeft += diff * smoothing;

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
        targetScrollRef.current = el.scrollLeft;
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

        const segment = el.scrollWidth / 3;
        const delta = dragDelta * 1.25;
        let nextScroll = startScrollRef.current - delta;
        if (nextScroll < segment * 0.5) nextScroll += segment;
        if (nextScroll > segment * 1.5) nextScroll -= segment;
        targetScrollRef.current = nextScroll;
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
                    <ProjectCard key={`${p.id}-${index}`} project={p} isDragging={isDragging} />
                ))}
            </ul>
        </div>
    );
};
