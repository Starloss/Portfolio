// Vigilante de FPS de la Escena WebGL (ADR 0003). Cuenta cuadros en ventanas cortas; si las
// ventanas lentas se sostienen, la Escena vuelve a la SVG.

export const WATCHDOG = {
    /** Por debajo de esto, una ventana es lenta. */
    minFps: 45,
    /** Histéresis: una ventana entre minFps y esto no corta una racha lenta. */
    recoverFps: 50,
    windowMs: 500,
    /** Cuánto tiene que durar la racha lenta para caer. */
    sustainMs: 2000,
    /** Al arrancar o volver de una pausa (texturas, primer cuadro), no se mide. */
    warmupMs: 1500,
    /** Un hueco así entre cuadros es una pausa (pestaña oculta, Escena tapada), no lentitud. */
    pauseMs: 400,
} as const;

export type Verdict = 'ok' | 'fallback';

export function createWatchdog(start: number) {
    let measureFrom = start + WATCHDOG.warmupMs;
    let last = start;
    let windowStart = -1;
    let frames = 0;
    let slowSince = -1;

    return {
        frame(now: number): Verdict {
            if (now - last > WATCHDOG.pauseMs) {
                measureFrom = now + WATCHDOG.warmupMs;
                windowStart = -1;
                slowSince = -1;
            }
            last = now;
            if (now < measureFrom) return 'ok';
            if (windowStart < 0) {
                windowStart = now;
                frames = 0;
                return 'ok';
            }
            frames++;
            const elapsed = now - windowStart;
            if (elapsed < WATCHDOG.windowMs) return 'ok';
            const fps = (frames * 1000) / elapsed;
            if (fps < WATCHDOG.minFps) {
                if (slowSince < 0) slowSince = windowStart;
            } else if (fps >= WATCHDOG.recoverFps) {
                slowSince = -1;
            }
            windowStart = now;
            frames = 0;
            return slowSince >= 0 && now - slowSince >= WATCHDOG.sustainMs ? 'fallback' : 'ok';
        },
    };
}
