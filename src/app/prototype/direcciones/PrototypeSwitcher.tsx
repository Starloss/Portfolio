import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// PROTOTIPO (research/impeccable, mapa #104): la barra que cambia de dirección visual. Nunca va a
// main: la rama de research no se mergea.

export const DIRECCIONES = [
    { key: 'linea', name: 'Línea Ávila–Bolívar' },
    { key: 'cromo', name: 'Cromosaturación' },
    { key: 'actual', name: 'Actual (main)' },
] as const;

export type Direccion = (typeof DIRECCIONES)[number]['key'];

export function useDireccion(): Direccion {
    const [params] = useSearchParams();
    const value = params.get('direccion');
    return DIRECCIONES.find((d) => d.key === value)?.key ?? 'linea';
}

const isTyping = (el: Element | null) =>
    !!el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable);

export const PrototypeSwitcher: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const current = useDireccion();
    const index = DIRECCIONES.findIndex((d) => d.key === current);

    const go = (step: number) => {
        const next = DIRECCIONES[(index + step + DIRECCIONES.length) % DIRECCIONES.length];
        const p = new URLSearchParams(params);
        p.set('direccion', next.key);
        setParams(p, { replace: true });
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isTyping(document.activeElement)) return;
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    // Nunca en el dominio de producción.
    if (typeof window !== 'undefined' && window.location.hostname === 'www.diegorangel.dev')
        return null;

    const button =
        'grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/15 focus-visible:bg-white/15';
    return (
        <div
            role="toolbar"
            aria-label="Prototipo: dirección visual"
            className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#1b1b1f] p-1 text-sm text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/20"
            style={{ fontFamily: 'system-ui, sans-serif' }}
        >
            <button type="button" className={button} onClick={() => go(-1)} aria-label="Anterior">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
            </button>
            <span className="min-w-52 px-2 text-center tabular-nums">
                {index + 1}/{DIRECCIONES.length} · {DIRECCIONES[index].name}
            </span>
            <button type="button" className={button} onClick={() => go(1)} aria-label="Siguiente">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
            </button>
        </div>
    );
};
