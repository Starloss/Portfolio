// El ritmo de Caracas que mueve la Avenida Bolívar: qué tipo de día es y cuánta gente camina a cada
// hora (la Afluencia). Lo usan las dos Escenas: la SVG coloca la gente con una fórmula y la WebGL la
// simula. Las curvas vienen de «Ritmos reales de Caracas» (#88): la forma tiene fuente, las cifras no.
import type { Estado } from '@lib/clima';

export type DayKind = 'habil' | 'sabado' | 'domingo' | 'feriado';
const DAY_KINDS: readonly DayKind[] = ['habil', 'sabado', 'domingo', 'feriado'];

// Los feriados fijos de Venezuela (mes-día). Carnaval y Semana Santa, que se mueven, no cuentan.
const FIXED_HOLIDAYS = new Set([
    '01-01',
    '04-19',
    '05-01',
    '06-24',
    '07-05',
    '07-24',
    '10-12',
    '12-24',
    '12-25',
    '12-31',
]);

const CARACAS_OFFSET_MS = 4 * 3600_000;

/** `?dia=`, que fija el tipo de día: para pruebas y previews, también en producción. */
export function readForcedDay(search: string): DayKind | null {
    const day = new URLSearchParams(search).get('dia');
    return DAY_KINDS.find((d) => d === day) ?? null;
}

/** El tipo de día en Caracas en un instante, o el que fije `forced`. */
export function dayKind(at: number, forced: DayKind | null = null): DayKind {
    if (forced) return forced;
    const local = new Date(at - CARACAS_OFFSET_MS);
    const monthDay = local.toISOString().slice(5, 10);
    if (FIXED_HOLIDAYS.has(monthDay)) return 'feriado';
    const weekday = local.getUTCDay();
    return weekday === 6 ? 'sabado' : weekday === 0 ? 'domingo' : 'habil';
}

// Afluencia por hora (0 a 23), de 0 (nadie) a 1 (la acera llena). El fin de semana y los feriados
// comparten curva.
const AFLUENCIA = {
    habil: [
        0.02, 0.01, 0.01, 0.01, 0.02, 0.1, 0.35, 0.7, 0.8, 0.7, 0.75, 0.85, 1, 0.9, 0.75, 0.75,
        0.85, 0.9, 0.5, 0.2, 0.08, 0.05, 0.03, 0.02,
    ],
    descanso: [
        0.02, 0.01, 0.01, 0.01, 0.01, 0.03, 0.1, 0.2, 0.35, 0.45, 0.55, 0.6, 0.6, 0.55, 0.5, 0.5,
        0.45, 0.4, 0.25, 0.12, 0.06, 0.04, 0.03, 0.02,
    ],
};

// Cuánta gente queda en la calle con cada Clima.
const AFLUENCIA_POR_CLIMA: Record<Estado, number> = {
    despejado: 1,
    parcial: 1,
    nublado: 0.9,
    lluvia: 0.3,
    tormenta: 0.1,
};

/** Lo que la calle sabe del Clima: si está seca, si llueve o si hay tormenta. */
export type Lluvia = 'seca' | 'lluvia' | 'tormenta';
export const lluviaDe = (estado: Estado | null): Lluvia =>
    estado === 'lluvia' || estado === 'tormenta' ? estado : 'seca';

/** La gente de la Avenida: cuánta (la Afluencia, de 0 a 1) y si llueve. */
export interface AfluenciaParams {
    afluencia: number;
    lluvia: Lluvia;
}

/** Interpola una curva de 24 horas a una hora decimal. */
export function hourly(curve: readonly number[], hour: number): number {
    const h = Math.floor(hour) % 24;
    const f = hour - Math.floor(hour);
    return curve[h] * (1 - f) + curve[(h + 1) % 24] * f;
}

/** La Afluencia, de 0 a 1, a una hora decimal de Caracas, en ese tipo de día y con ese Clima. */
export function afluenciaAt(hour: number, day: DayKind, estado: Estado | null): number {
    const curve = day === 'habil' ? AFLUENCIA.habil : AFLUENCIA.descanso;
    return hourly(curve, hour) * (estado ? AFLUENCIA_POR_CLIMA[estado] : 1);
}
