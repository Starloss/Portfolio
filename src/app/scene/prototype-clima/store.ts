// PROTOTIPO desechable: los controles del Clima, en la URL para poder compartirlos.
import { useSyncExternalStore } from 'react';

import type { ClimaParams, ClimaVariant, Estado } from './clima';

function read(): ClimaParams | null {
    const q = new URLSearchParams(window.location.search);
    const estado = q.get('clima') as Estado | null;
    if (!estado) return null;
    return {
        variant: (q.get('climav') as ClimaVariant) ?? 'b',
        estado,
        topeOscuro: Number(q.get('topeo') ?? 0.65),
        topeDensidad: Number(q.get('toped') ?? 1),
    };
}

let state = read();
const listeners = new Set<() => void>();

export function setClima(patch: Partial<ClimaParams>) {
    if (!state) return;
    state = { ...state, ...patch };
    const q = new URLSearchParams(window.location.search);
    q.set('clima', state.estado);
    q.set('climav', state.variant);
    q.set('topeo', state.topeOscuro.toFixed(2));
    q.set('toped', state.topeDensidad.toFixed(2));
    window.history.replaceState(null, '', `?${q.toString()}`);
    listeners.forEach((l) => l());
}

export const useClima = () =>
    useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => state,
    );
