// El ritmo de Caracas que mueve la Avenida Bolívar: qué tipo de día es, cuánta gente camina a cada
// hora (la Afluencia) y cuánto Tráfico hay. Lo usan las dos Escenas: la SVG coloca la calle con una
// fórmula y la WebGL la simula. Las curvas vienen de «Ritmos reales de Caracas» (#88): la forma tiene
// fuente, las cifras no.
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

/** Los niveles del Tráfico de la Avenida, de menos a más. */
export const NIVELES_TRAFICO = ['vacia', 'fluida', 'cargada', 'tranca'] as const;
export type NivelTrafico = (typeof NIVELES_TRAFICO)[number];

// Tráfico por hora (0 a 23), de 0 (vacía) a 1 (el máximo). Los feriados usan la curva del domingo.
// Cada hora vale entera, sin interpolar: así la tranca de un día hábil va de 7 a 9 y de 5 a 7, como
// se decidió (#93), y un valor justo en un corte no hace saltar el nivel dentro de la hora.
const TRAFICO: Record<'habil' | 'sabado' | 'domingo', readonly number[]> = {
    habil: [
        0.05, 0.03, 0.02, 0.02, 0.05, 0.25, 0.7, 1, 0.9, 0.6, 0.5, 0.55, 0.75, 0.6, 0.5, 0.55, 0.75,
        1, 0.8, 0.4, 0.2, 0.12, 0.08, 0.06,
    ],
    sabado: [
        0.08, 0.05, 0.03, 0.02, 0.03, 0.08, 0.18, 0.3, 0.4, 0.5, 0.55, 0.6, 0.6, 0.55, 0.5, 0.5,
        0.5, 0.45, 0.35, 0.25, 0.18, 0.14, 0.12, 0.1,
    ],
    domingo: [
        0.06, 0.04, 0.03, 0.02, 0.02, 0.05, 0.1, 0.18, 0.25, 0.35, 0.4, 0.45, 0.45, 0.4, 0.4, 0.4,
        0.4, 0.35, 0.25, 0.15, 0.1, 0.07, 0.06, 0.05,
    ],
};
// Desde qué valor de la curva empieza cada nivel (después de vacía).
const TRAFICO_CORTES = [0.15, 0.45, 0.8];
// Cuántos niveles sube con cada Clima: la lluvia satura el tránsito en Caracas.
const TRAFICO_POR_LLUVIA: Record<Lluvia, number> = { seca: 0, lluvia: 1, tormenta: 2 };

/** El nivel de Tráfico a una hora decimal de Caracas, en ese tipo de día y con ese Clima. */
export function traficoAt(hour: number, day: DayKind, estado: Estado | null): NivelTrafico {
    const value = TRAFICO[day === 'feriado' ? 'domingo' : day][Math.floor(hour) % 24];
    const base = TRAFICO_CORTES.filter((cut) => value >= cut).length;
    const level = Math.min(NIVELES_TRAFICO.length - 1, base + TRAFICO_POR_LLUVIA[lluviaDe(estado)]);
    return NIVELES_TRAFICO[level];
}

/** `?trafico=`, que fija el nivel: para pruebas y previews, también en producción. */
export function readForcedTrafico(search: string): NivelTrafico | null {
    const nivel = new URLSearchParams(search).get('trafico');
    return NIVELES_TRAFICO.find((n) => n === nivel) ?? null;
}
