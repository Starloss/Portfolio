import { describe, it, expect } from 'vitest';
import { createWatchdog, WATCHDOG } from '@app/scene/gl/watchdog';

// Vigilante de FPS (ADR 0003): si la Escena WebGL se sostiene lenta, vuelve a la SVG.

/** Simula `seconds` de cuadros a `fps` desde `start` (ms); devuelve el último veredicto y la hora. */
function run(
    watchdog: ReturnType<typeof createWatchdog>,
    start: number,
    fps: number,
    seconds: number,
) {
    let verdict: 'ok' | 'fallback' = 'ok';
    let now = start;
    const step = 1000 / fps;
    for (let t = 0; t < seconds * 1000; t += step) {
        now = start + t;
        verdict = watchdog.frame(now);
        if (verdict === 'fallback') break;
    }
    return { verdict, now };
}

describe('Vigilante de FPS', () => {
    it('a 60 fps nunca cae', () => {
        const w = createWatchdog(0);
        expect(run(w, 0, 60, 30).verdict).toBe('ok');
    });

    it(`cae si se sostiene por debajo de ${WATCHDOG.minFps} fps durante ${WATCHDOG.sustainMs} ms`, () => {
        const w = createWatchdog(0);
        const { verdict, now } = run(w, 0, 30, 10);
        expect(verdict).toBe('fallback');
        // El arranque no cuenta, y después hacen falta las ventanas lentas seguidas.
        expect(now).toBeGreaterThanOrEqual(WATCHDOG.warmupMs + WATCHDOG.sustainMs);
        expect(now).toBeLessThan(WATCHDOG.warmupMs + WATCHDOG.sustainMs + 2 * WATCHDOG.windowMs);
    });

    it('el arranque (texturas, primer cuadro) no cuenta', () => {
        const w = createWatchdog(0);
        expect(run(w, 0, 10, WATCHDOG.warmupMs / 1000).verdict).toBe('ok');
        expect(run(w, WATCHDOG.warmupMs, 60, 10).verdict).toBe('ok');
    });

    it('un bajón corto, menor que la ventana sostenida, no la hace caer', () => {
        const w = createWatchdog(0);
        let r = run(w, 0, 60, 3);
        r = run(w, r.now, 30, 1);
        r = run(w, r.now, 60, 3);
        r = run(w, r.now, 30, 1);
        expect(run(w, r.now, 60, 3).verdict).toBe('ok');
    });

    it(`con histéresis: rozar los ${WATCHDOG.minFps} fps no reinicia la cuenta, hace falta pasar de ${WATCHDOG.recoverFps}`, () => {
        const w = createWatchdog(0);
        let r = run(w, 0, 60, 2);
        r = run(w, r.now, 40, 1);
        r = run(w, r.now, 47, 0.6);
        expect(run(w, r.now, 40, 1.5).verdict).toBe('fallback');
    });

    it('una pausa avisada (pestaña oculta) no cuenta como cuadros lentos', () => {
        const w = createWatchdog(0);
        let r = run(w, 0, 60, 3);
        // Diez segundos sin cuadros y luego vuelve a 60 fps.
        w.restart(r.now + 10_000);
        r = run(w, r.now + 10_000, 60, 3);
        expect(r.verdict).toBe('ok');
    });

    it('después de una pausa, el arranque vuelve a no contar', () => {
        const w = createWatchdog(0);
        const r = run(w, 0, 60, 3);
        w.restart(r.now + 10_000);
        expect(run(w, r.now + 10_000, 20, WATCHDOG.warmupMs / 1000).verdict).toBe('ok');
    });

    it('un equipo que apenas llega a 2 fps también vuelve a la SVG', () => {
        const w = createWatchdog(0);
        expect(run(w, 0, 2, 10).verdict).toBe('fallback');
    });
});
