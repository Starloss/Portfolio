// El Cielo vivo, sin nada del navegador: dónde están el sol y la luna y cómo gira la Bóveda celeste.
// Lo comparten la Escena SVG, que lo vuelve keyframes, y la Escena WebGL, que lo calcula en cada cuadro.
import type { Viewport } from './camera';
import type { Sky } from './sky';

/** Cuánto dura la Bóveda celeste: la UI cambia a la mitad y los colores del paisaje la acompañan. */
export const BOVEDA_SECONDS = 3.6;

/** Lo que el arco necesita saber de la página, en fracciones de la pantalla. */
export interface SkyLayout {
    /** La altura del arco: entre la cabecera y el texto. */
    top: number;
    /** Diámetro del sol y la luna (px). */
    size: number;
    column: { left: number; right: number } | null;
    /** Distancia a la columna de texto desde la que el astro ya puede bajar. */
    margin: number;
}

export const DEFAULT_SKY_LAYOUT: SkyLayout = { top: 0.14, size: 52, column: null, margin: 0 };

const MAX_SIZE = 52;
const MIN_SIZE = 28;
const SIZE_GAP = 8;

export function skyLayout(
    viewport: Viewport,
    page: {
        column: { left: number; right: number; top: number } | null;
        headerBottom: number;
    } | null,
): SkyLayout {
    if (!page?.column) return DEFAULT_SKY_LAYOUT;
    const { column, headerBottom } = page;
    const gap = column.top - headerBottom;
    const size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, gap - SIZE_GAP));
    return {
        top: (headerBottom + column.top) / 2 / viewport.height,
        size,
        column: { left: column.left / viewport.width, right: column.right / viewport.width },
        margin: (size * 1.5) / viewport.width,
    };
}

// Mirando al Ávila, al norte: el arco va de la derecha (este) a la izquierda (oeste).
const EAST = 0.92;
const WEST = 0.08;
const HORIZON = 0.82;
// Sube rápido: así pasa sobre el título y no a la altura del texto.
const RISE = 0.35;
/** Dónde va un astro cuando su tema no coincide con la hora de Caracas. */
const FIXED_F = 0.3;
// Hasta dónde se sigue moviendo en el giro: fuera de la pantalla, aun en un teléfono.
const BEFORE_RISE = -0.2;
const AFTER_SET = 1.2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const ease = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

/** El avance real por el arco: 0 al salir, 0,5 en el meridiano, 1 al ponerse, sea cual sea el día. */
export const arcFraction = ({ hour, halfArc }: { hour: number; halfArc: number }) =>
    0.5 + hour / (2 * halfArc);

/** Dónde queda un astro, como fracción de la pantalla. Fuera de 0 a 1 sigue bajo el horizonte. */
export function arcPoint(f: number, layout: SkyLayout) {
    const x = lerp(EAST, WEST, f);
    const wave = Math.sin(Math.PI * f);
    const lift = Math.sign(wave) * Math.abs(wave) ** RISE;
    const y = HORIZON - (HORIZON - layout.top) * lift;
    if (!layout.column) return { x, y };
    // Sobre la columna de texto pasa siempre por encima; se libera a medida que se aleja de ella.
    const inside = Math.min(x - layout.column.left, layout.column.right - x);
    const over = smoothstep(clamp01((inside + layout.margin) / (2 * layout.margin)));
    return { x, y: lerp(y, Math.min(y, layout.top), over) };
}

export interface SunRest {
    f: number;
    visible: boolean;
}
export interface MoonRest extends SunRest {
    fraction: number;
    tilt: number;
}
export interface Rest {
    sun: SunRest;
    moon: MoonRest;
}

// La misma altura que usa el script del tema: el borde del sol tocando el horizonte, con refracción.
const SUNSET_ALT = -0.833;

/**
 * Dónde descansan el sol y la luna con un tema. Si coincide con la hora de Caracas, en su posición
 * real; si no, en una fija. La Noche no tiene luna si todavía no salió.
 */
export function restOf({ sun, moon }: Sky, night: boolean): Rest {
    const sunUp = sun.alt > SUNSET_ALT;
    const moonUp = moon.alt > 0;
    const phase = { fraction: moon.fraction, tilt: moon.tilt };
    if (night) {
        return {
            sun: { f: arcFraction(sun), visible: false },
            moon: sunUp
                ? { f: FIXED_F, visible: true, ...phase }
                : { f: arcFraction(moon), visible: moonUp, ...phase },
        };
    }
    return {
        sun: sunUp ? { f: arcFraction(sun), visible: true } : { f: FIXED_F, visible: true },
        moon: { f: arcFraction(moon), visible: false, ...phase },
    };
}

// Cuánto giran las estrellas en un cambio (radianes).
const STARS_SWING = 0.9;

export interface BovedaFrame {
    /** 0 Día, 1 Noche. */
    night: number;
    /** Luz de atardecer sobre el paisaje. */
    dusk: number;
    /** Cuánto giró la franja de ocaso (radianes); -1 en reposo. */
    sweep: number;
    sun: { f: number; alpha: number };
    moon: { f: number; alpha: number; fraction: number; tilt: number };
    stars: { angle: number; alpha: number };
}

/**
 * La Bóveda celeste en un punto del giro (`t` de 0 a 1). Siempre hacia el oeste: quien se va se pone
 * a la izquierda y quien llega sale por la derecha.
 */
export function bovedaAt(toNight: boolean, t: number, target: Rest, origin: Rest): BovedaFrame {
    const day = toNight ? origin : target;
    const dark = toNight ? target : origin;
    const k = ease(clamp01(t));
    const night = toNight ? k : 1 - k;
    return {
        night,
        dusk: Math.min(1, 4 * night * (1 - night) * 1.15),
        sweep: Math.PI * (toNight ? k : 1 + k),
        sun: {
            f: toNight ? lerp(day.sun.f, AFTER_SET, k) : lerp(BEFORE_RISE, day.sun.f, k),
            alpha: day.sun.visible ? 1 : 0,
        },
        moon: {
            f: toNight ? lerp(BEFORE_RISE, dark.moon.f, k) : lerp(dark.moon.f, AFTER_SET, k),
            alpha: dark.moon.visible ? 1 : 0,
            fraction: dark.moon.fraction,
            tilt: dark.moon.tilt,
        },
        stars: { angle: toNight ? (1 - k) * STARS_SWING : -k * STARS_SWING, alpha: night },
    };
}

// A qué ritmo se acerca un astro a un nuevo lugar en reposo (por segundo).
const FOLLOW_RATE = 1.5;

/** El reloj de la Bóveda celeste para quien dibuja cuadro a cuadro: la Escena WebGL. */
export class BovedaClock {
    private toNight = false;
    // El giro en curso: su sentido, y dónde iba (`t`) en qué momento (`at`). Si se revierte, sigue
    // por el mismo camino hacia atrás: así nada salta.
    private turn: { toNight: boolean; t: number; at: number; forward: boolean } | null = null;
    private last: number | null = null;
    private follow: { sun: number; moon: number } | null = null;

    constructor(private seconds: number) {}

    private progress(now: number) {
        if (!this.turn) return 1;
        const { t, at, forward } = this.turn;
        const elapsed = (now - at) / (this.seconds * 1000);
        return clamp01(forward ? t + elapsed : t - elapsed);
    }

    /** El tema de entrada, sin giro. */
    set(night: boolean) {
        this.toNight = night;
        this.turn = null;
    }

    /** Cambia de tema: si llega en pleno giro, vuelve por donde venía. */
    change(night: boolean, now: number) {
        if (night === this.toNight) return;
        this.toNight = night;
        this.turn = this.turn
            ? {
                  toNight: this.turn.toNight,
                  t: this.progress(now),
                  at: now,
                  forward: !this.turn.forward,
              }
            : { toNight: night, t: 0, at: now, forward: true };
    }

    /** Si está en pleno giro: con una GPU por software solo se dibuja cuando algo cambia. */
    get turning() {
        return this.turn !== null;
    }

    /** `target` es el reposo del tema actual; `origin`, el del otro. */
    tick(now: number, target: Rest, origin: Rest): BovedaFrame {
        const day = this.toNight ? origin : target;
        const dark = this.toNight ? target : origin;
        const dt = this.last === null ? 0 : Math.min(0.1, (now - this.last) / 1000);
        this.last = now;
        const k = Math.min(1, dt * FOLLOW_RATE);
        this.follow = this.follow
            ? {
                  sun: lerp(this.follow.sun, day.sun.f, k),
                  moon: lerp(this.follow.moon, dark.moon.f, k),
              }
            : { sun: day.sun.f, moon: dark.moon.f };
        const smoothDay = { ...day, sun: { ...day.sun, f: this.follow.sun } };
        const smoothDark = { ...dark, moon: { ...dark.moon, f: this.follow.moon } };

        const t = this.progress(now);
        if (this.turn && (this.turn.forward ? t < 1 : t > 0)) {
            return this.turn.toNight
                ? bovedaAt(true, t, smoothDark, smoothDay)
                : bovedaAt(false, t, smoothDay, smoothDark);
        }
        this.turn = null;
        // En reposo: sin franja, y solo se ve el astro del tema, en su lugar.
        const frame = this.toNight
            ? bovedaAt(true, 1, smoothDark, smoothDay)
            : bovedaAt(false, 1, smoothDay, smoothDark);
        return {
            ...frame,
            sweep: -1,
            sun: { f: this.follow.sun, alpha: !this.toNight && day.sun.visible ? 1 : 0 },
            moon: {
                ...frame.moon,
                f: this.follow.moon,
                alpha: this.toNight && dark.moon.visible ? 1 : 0,
            },
        };
    }
}

/** La parte iluminada de la luna, en un disco de radio 1, con la luz hacia +x. */
export function moonPath(fraction: number): string {
    const rx = Number(Math.abs(1 - 2 * fraction).toFixed(3));
    return `M0-1A1 1 0 0 1 0 1A${rx} 1 0 0 ${fraction < 0.5 ? 0 : 1} 0-1Z`;
}

/** Cuánto rotar el dibujo de `moonPath` (grados, en pantalla) para que la luz mire hacia donde toca. */
export const moonRotation = (tilt: number) => -90 - tilt;

const STAR_COUNT = 120;
const GOLDEN = 0.618034;
/** El punto bajo el horizonte alrededor del que gira el cielo, como fracción de la pantalla. */
export const PIVOT = { x: 0.5, y: 1.15 };

/**
 * Las estrellas, alrededor del pivote: un sector que cubre la pantalla durante todo el giro. Van en
 * un `<path>` por grupo de titileo, con trazos de largo cero, para no sumar un nodo por estrella.
 */
export function starField({ width, height }: Viewport, groups: number): string[] {
    const half = Math.atan2(width * PIVOT.x, height * PIVOT.y) + STARS_SWING;
    const near = height * (PIVOT.y - 1);
    const far = Math.hypot(width * PIVOT.x, height * PIVOT.y);
    const paths = Array.from({ length: groups }, () => '');
    for (let i = 0; i < STAR_COUNT; i++) {
        const angle = -half + ((i * GOLDEN) % 1) * 2 * half;
        // La raíz las reparte parejas por área: si no, se acumulan cerca del pivote, abajo.
        const r = lerp(near, far, Math.sqrt((i + 0.5) / STAR_COUNT));
        const x = Math.round(Math.sin(angle) * r);
        const y = Math.round(-Math.cos(angle) * r);
        paths[i % groups] += `M${x} ${y}h0`;
    }
    return paths;
}

const KEYFRAMES = 24;

/** El giro como keyframes de `transform` y `opacity`, para que lo anime el compositor. */
export function bovedaKeyframes(
    toNight: boolean,
    target: Rest,
    origin: Rest,
    layout: SkyLayout,
    viewport: Viewport,
) {
    const frames = Array.from({ length: KEYFRAMES + 1 }, (_, i) =>
        bovedaAt(toNight, i / KEYFRAMES, target, origin),
    );
    const place = (f: number) => restTransform(f, layout, viewport);
    return {
        sun: frames.map((f) => ({ transform: place(f.sun.f), opacity: f.sun.alpha })),
        moon: frames.map((f) => ({ transform: place(f.moon.f), opacity: f.moon.alpha })),
        stars: frames.map((f) => ({
            transform: `rotate(${f.stars.angle.toFixed(3)}rad)`,
            opacity: f.stars.alpha,
        })),
        // Entra y sale con un fundido al comienzo y al final, donde el cielo ya es de un solo color.
        sweep: frames.map((f) => ({
            transform: `translate(-50%, -50%) rotate(${(-f.sweep).toFixed(3)}rad)`,
            opacity: Math.min(1, Math.sin(f.sweep % Math.PI) * 3),
        })),
    };
}

/** Dónde queda un astro en un punto del arco, como `transform`. */
export function restTransform(f: number, layout: SkyLayout, viewport: Viewport) {
    const { x, y } = arcPoint(f, layout);
    const left = x * viewport.width - layout.size / 2;
    const top = y * viewport.height - layout.size / 2;
    return `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
}
