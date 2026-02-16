import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@lib/i18n';

import { getProjectsSync } from './data';
import { ProjectCard } from './ProjectCard';

export const ProjectsList: React.FC = () => {
    const projects = getProjectsSync();
    const { t } = useI18n();
    const trackRef = useRef<HTMLUListElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const momentumRef = useRef(0);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startScrollRef = useRef(0);
    const lastXRef = useRef(0);
    const lastMoveTimeRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    const loopProjects = useMemo(() => [...projects, ...projects], [projects]);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        const baseSpeed = 0.22;

        const tick = () => {
            if (!trackRef.current) return;
            const node = trackRef.current;
            const half = node.scrollWidth / 2;

            if (!isDraggingRef.current) {
                if (Math.abs(momentumRef.current) > 0.01) {
                    node.scrollLeft += momentumRef.current;
                    momentumRef.current *= 0.95;
                } else {
                    node.scrollLeft += baseSpeed;
                }
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

    const onPointerDown: React.PointerEventHandler<HTMLUListElement> = (event) => {
        const el = trackRef.current;
        if (!el) return;
        isDraggingRef.current = true;
        setIsDragging(true);
        momentumRef.current = 0;
        startXRef.current = event.clientX;
        startScrollRef.current = el.scrollLeft;
        lastXRef.current = event.clientX;
        lastMoveTimeRef.current = performance.now();
        el.setPointerCapture(event.pointerId);
    };

    const onPointerMove: React.PointerEventHandler<HTMLUListElement> = (event) => {
        if (!isDraggingRef.current || !trackRef.current) return;
        const el = trackRef.current;
        const half = el.scrollWidth / 2;
        const delta = (event.clientX - startXRef.current) * 1.9;
        let nextScroll = startScrollRef.current - delta;
        if (nextScroll >= half) nextScroll -= half;
        if (nextScroll < 0) nextScroll += half;
        el.scrollLeft = nextScroll;

        const now = performance.now();
        const elapsed = now - lastMoveTimeRef.current;
        if (elapsed > 0) {
            const moveDelta = event.clientX - lastXRef.current;
            momentumRef.current = -(moveDelta / elapsed) * 10;
            lastXRef.current = event.clientX;
            lastMoveTimeRef.current = now;
        }
    };

    const onPointerUp: React.PointerEventHandler<HTMLUListElement> = (event) => {
        if (!trackRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        trackRef.current.releasePointerCapture(event.pointerId);
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
            >
                {loopProjects.map((p, index) => (
                    <ProjectCard key={`${p.id}-${index}`} project={p} />
                ))}
            </ul>
        </div>
    );
};
