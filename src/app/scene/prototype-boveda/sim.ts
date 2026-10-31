// PROTOTIPO desechable (ticket "Cómo se ven el sol, la luna y la Bóveda celeste"): nunca se mergea.
// Tres variantes de la Bóveda celeste en ?boveda=a|b|c. Puro: lo usan la Escena SVG y el Worker.

export type Variant = 'a' | 'b' | 'c';
export interface BovedaParams {
    variant: Variant;
    /** Hora simulada de Caracas (0 a 24). */
    hour: number;
    /** Fase lunar: 0 nueva, 0,5 llena. */
    phase: number;
    moonRule: 'real' | 'respaldo';
    sunRule: 'fija' | 'horizonte' | 'sinsol';
    arc: 'sobre' | 'completo' | 'derecha';
    ui: 'inicio' | 'mitad' | 'final';
    reduced: boolean;
    /** Borde derecho de la columna de texto, como fracción de la pantalla. */
    minX: number;
}

export interface BovedaFrame {
    night: number;
    /** Luz de atardecer en el paisaje y en el cielo. */
    dusk: number;
    skyDusk: number;
    sun: { x: number; y: number; alpha: number };
    moon: { x: number; y: number; alpha: number; phase: number };
    stars: { alpha: number; angle: number };
    /** Giro del día y la noche sobre el cielo (solo C), en radianes; -1 si no hay. */
    sweep: number;
    moving: boolean;
}

export const VARIANTS: Record<Variant, { name: string; seconds: number }> = {
    a: { name: 'Giro de los astros', seconds: 2.4 },
    b: { name: 'Relevo con atardecer', seconds: 3 },
    c: { name: 'Cielo que gira', seconds: 3.6 },
};

export const PIVOT = { x: 0.5, y: 1.15 };
const REDUCED_SECONDS = 0.6;
const FIXED_F = 0.3;
const RISE_F = -0.12;
const SET_F = 1.12;
const SUNRISE = 6.33;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const windowed = (t: number, a: number, b: number) => ease(clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const durationOf = (p: BovedaParams) =>
    p.reduced ? REDUCED_SECONDS : VARIANTS[p.variant].seconds;

/** Arco estilizado: f = 0 al este (derecha), f = 1 al oeste (izquierda), con altura seno. */
export function arcPoint(f: number, p: BovedaParams) {
    const left = p.arc === 'derecha' ? Math.min(0.8, p.minX + 0.05) : 0.08;
    const lift = Math.sin(Math.PI * f);
    const height = p.arc === 'sobre' ? Math.sign(lift) * Math.abs(lift) ** 0.35 : lift;
    return { x: lerp(0.92, left, f), y: 0.82 - (p.arc === 'sobre' ? 0.68 : 0.66) * height };
}

/** Dónde descansan el sol y la luna con el tema y la hora dados. */
export function restOf(p: BovedaParams) {
    const sunF = (p.hour - SUNRISE) / 12;
    const sunUp = sunF >= 0 && sunF <= 1;
    const moonF = (((p.hour - p.phase * 24 - SUNRISE) % 24) + 24) % 24 / 12;
    const moonUp = moonF <= 1;
    const sun = sunUp
        ? { f: sunF, alpha: 1, dusk: 0, why: 'real' }
        : p.sunRule === 'fija'
          ? { f: FIXED_F, alpha: 1, dusk: 0, why: 'posición fija' }
          : p.sunRule === 'horizonte'
            ? { f: 0.985, alpha: 1, dusk: 0.55, why: 'quieto en el horizonte' }
            : { f: 1.05, alpha: 0, dusk: 0, why: 'Día sin sol' };
    const moon = sunUp
        ? { f: FIXED_F, alpha: 1, why: 'posición fija (tema contra hora)' }
        : moonUp
          ? { f: moonF, alpha: 1, why: 'real' }
          : p.moonRule === 'real'
            ? { f: 1.05, alpha: 0, why: 'aún no sale: sin luna' }
            : { f: FIXED_F, alpha: 1, why: 'no ha salido: luna de respaldo' };
    return { sun, moon, sunUp, moonUp };
}

export class BovedaSim {
    private goal = 0;
    private start = -1;
    private fSun = FIXED_F;
    private fMoon = FIXED_F;
    private aSun = 1;
    private aMoon = 1;
    private restDusk = 0;
    private last = 0;
    private primed = false;

    /** Tema de entrada, sin transición. */
    set(night: boolean) {
        this.goal = night ? 1 : 0;
        this.start = -1;
    }

    /** Cambio de tema: si llega en pleno giro, sigue desde el punto equivalente. */
    change(night: boolean, now: number, p: BovedaParams) {
        const goal = night ? 1 : 0;
        if (goal === this.goal) return;
        this.goal = goal;
        const seconds = durationOf(p) * 1000;
        const done = this.start >= 0 ? clamp01((now - this.start) / seconds) : 1;
        this.start = now - (1 - done) * seconds;
    }

    tick(now: number, p: BovedaParams): BovedaFrame {
        const dt = Math.min(0.1, (now - (this.last || now)) / 1000);
        this.last = now;
        const rest = restOf(p);
        // En reposo, cada astro se desliza hacia su lugar: así se ve qué pasa al cruzar la puesta.
        const follow = this.primed ? Math.min(1, dt * 1.5) : 1;
        this.primed = true;
        this.fSun += (rest.sun.f - this.fSun) * follow;
        this.fMoon += (rest.moon.f - this.fMoon) * follow;
        this.aSun += (rest.sun.alpha - this.aSun) * follow;
        this.aMoon += (rest.moon.alpha - this.aMoon) * follow;
        this.restDusk += (rest.sun.dusk - this.restDusk) * follow;

        const toNight = this.goal === 1;
        const t = this.start < 0 ? 1 : clamp01((now - this.start) / (durationOf(p) * 1000));
        if (t >= 1) this.start = -1;
        const moving = t < 1;

        if (p.reduced) {
            const n = toNight ? ease(t) : 1 - ease(t);
            const sun = arcPoint(this.fSun, p);
            const moon = arcPoint(this.fMoon, p);
            return {
                night: n,
                dusk: 0,
                skyDusk: 0,
                sun: { ...sun, alpha: this.aSun * (1 - n) },
                moon: { ...moon, alpha: this.aMoon * n, phase: p.phase },
                stars: { alpha: n, angle: 0 },
                sweep: -1,
                moving,
            };
        }

        const staggered = p.variant === 'b';
        const leave = staggered ? windowed(t, 0, 0.55) : ease(t);
        const arrive = staggered ? windowed(t, 0.5, 1) : ease(t);
        const eased = staggered ? windowed(t, 0.2, 0.8) : ease(t);
        const n = toNight ? eased : 1 - eased;
        const glow = Math.min(1, 4 * n * (1 - n) * 1.15);
        const restingDay = !moving && !toNight;

        const leaving = (from: number) => lerp(from, SET_F, leave);
        const arriving = (to: number) => lerp(RISE_F, to, arrive);
        const fSun = moving ? (toNight ? leaving(this.fSun) : arriving(this.fSun)) : this.fSun;
        const fMoon = moving ? (toNight ? arriving(this.fMoon) : leaving(this.fMoon)) : this.fMoon;
        // Los astros giran siempre hacia el oeste, también al volver al Día. Las estrellas, igual.
        const swing = p.variant === 'b' ? 0 : 0.9;
        const angle = toNight ? (1 - ease(t)) * swing : -ease(t) * swing;
        const dusk = Math.max(glow * (p.variant === 'a' ? 0.75 : 1), restingDay ? this.restDusk : 0);
        return {
            night: n,
            dusk,
            skyDusk: p.variant === 'c' ? 0 : dusk,
            sun: {
                ...arcPoint(fSun, p),
                alpha: moving || !toNight ? this.aSun : 0,
            },
            moon: {
                ...arcPoint(fMoon, p),
                alpha: moving || toNight ? this.aMoon : 0,
                phase: p.phase,
            },
            stars: { alpha: n, angle },
            sweep:
                p.variant === 'c' && moving
                    ? toNight
                        ? Math.PI * ease(t)
                        : Math.PI * (1 + ease(t))
                    : -1,
            moving,
        };
    }
}
