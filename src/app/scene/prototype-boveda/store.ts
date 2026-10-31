// PROTOTIPO desechable: los controles de la Bóveda celeste, en la URL para poder compartirlos.
import { useSyncExternalStore } from 'react';

import { durationOf, type BovedaParams, type Variant } from './sim';

export type Controls = Omit<BovedaParams, 'minX'>;

function caracasHour() {
    const d = new Date();
    return (d.getUTCHours() - 4 + 24 + d.getUTCMinutes() / 60) % 24;
}

function read(): Controls | null {
    const q = new URLSearchParams(window.location.search);
    const variant = q.get('boveda');
    if (variant !== 'a' && variant !== 'b' && variant !== 'c') return null;
    return {
        variant: variant as Variant,
        hour: Number(q.get('hora') ?? caracasHour()),
        phase: Number(q.get('fase') ?? 0.4),
        moonRule: (q.get('luna') as Controls['moonRule']) ?? 'real',
        sunRule: (q.get('sol') as Controls['sunRule']) ?? 'fija',
        arc: (q.get('arco') as Controls['arc']) ?? 'sobre',
        ui: (q.get('ui') as Controls['ui']) ?? 'inicio',
        reduced: q.get('quieto') === '1',
    };
}

let state = read();
const listeners = new Set<() => void>();

export function setControls(patch: Partial<Controls>) {
    if (!state) return;
    state = { ...state, ...patch };
    const q = new URLSearchParams(window.location.search);
    q.set('boveda', state.variant);
    q.set('hora', state.hour.toFixed(2));
    q.set('fase', state.phase.toFixed(2));
    q.set('luna', state.moonRule);
    q.set('sol', state.sunRule);
    q.set('arco', state.arc);
    q.set('ui', state.ui);
    q.set('quieto', state.reduced ? '1' : '0');
    window.history.replaceState(null, '', `?${q.toString()}`);
    listeners.forEach((l) => l());
}

export const useBoveda = () =>
    useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => state,
    );

/** Cuánto espera la UI para cambiar de tema, respecto del giro. */
export function uiDelayMs(): number {
    if (!state) return 0;
    const share = state.ui === 'inicio' ? 0 : state.ui === 'mitad' ? 0.5 : 1;
    return durationOf({ ...state, minX: 0 }) * 1000 * share;
}
