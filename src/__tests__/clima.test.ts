import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ClimaFailure } from '@lib/analytics';
import {
    caracasClock,
    createClimaStore,
    estadoFromCode,
    formatHour,
    formatTemperature,
    useCaracasClock,
} from '@lib/clima';

describe('estadoFromCode', () => {
    it.each([
        [0, 'despejado'],
        [1, 'despejado'],
        [2, 'parcial'],
        [3, 'nublado'],
        [45, 'nublado'],
        [48, 'nublado'],
        [51, 'nublado'],
        [53, 'lluvia'],
        [57, 'lluvia'],
        [61, 'lluvia'],
        [67, 'lluvia'],
        [71, 'lluvia'],
        [77, 'lluvia'],
        [80, 'lluvia'],
        [82, 'lluvia'],
        [85, 'lluvia'],
        [86, 'lluvia'],
        [95, 'tormenta'],
        [96, 'tormenta'],
        [99, 'tormenta'],
    ])('el código %i es %s', (code, estado) => {
        expect(estadoFromCode(code)).toBe(estado);
    });

    it.each([4, 50, 58, 70, 90, 100, -1, 2.5, 54.5, 95.5])(
        'un código desconocido (%d) no da estado',
        (code) => {
            expect(estadoFromCode(code)).toBeNull();
        },
    );
});

describe('la hora de Caracas', () => {
    it.each([
        '2026-10-31T16:05:00Z',
        '2026-11-01T02:59:00Z',
        '2026-11-01T03:00:00Z',
        '2027-01-01T00:30:00Z',
        '2027-06-21T11:01:00Z',
    ])('coincide con la de America/Caracas el %s', (iso) => {
        const ms = Date.parse(iso);
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Caracas',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(ms);
        const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
        expect(caracasClock(ms)).toEqual({ hour: part('hour'), minute: part('minute') });
    });

    it('en español va en 24 h', () => {
        expect(formatHour({ hour: 18, minute: 41 }, 'es')).toBe('18:41');
        expect(formatHour({ hour: 6, minute: 5 }, 'es')).toBe('06:05');
    });

    it('en inglés va en 12 h', () => {
        expect(formatHour({ hour: 18, minute: 41 }, 'en')).toBe('6:41 PM');
        expect(formatHour({ hour: 0, minute: 5 }, 'en')).toBe('12:05 AM');
        expect(formatHour({ hour: 12, minute: 0 }, 'en')).toBe('12:00 PM');
    });
});

describe('useCaracasClock', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(Date.parse('2026-10-31T16:00:30Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('cambia justo al cambiar el minuto, y después cada minuto', () => {
        const { result } = renderHook(() => useCaracasClock());
        expect(result.current).toEqual({ hour: 12, minute: 0 });
        act(() => {
            vi.advanceTimersByTime(30_000);
        });
        expect(result.current).toEqual({ hour: 12, minute: 1 });
        act(() => {
            vi.advanceTimersByTime(60_000);
        });
        expect(result.current).toEqual({ hour: 12, minute: 2 });
    });

    it('al volver a la pestaña se pone al día, sin esperar al temporizador', () => {
        const { result } = renderHook(() => useCaracasClock());
        vi.setSystemTime(Date.parse('2026-10-31T16:20:00Z'));
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(result.current).toEqual({ hour: 12, minute: 20 });
    });
});

describe('la temperatura', () => {
    it('en español va en °C y en inglés en °F', () => {
        expect(formatTemperature(27.2, 'es')).toBe('27 °C');
        expect(formatTemperature(27.2, 'en')).toBe('81 °F');
    });
});

describe('createClimaStore', () => {
    const CACHE_KEY = 'clima-caracas';
    const response = (code = 61, temperature = 22.4) => ({
        ok: true,
        json: () =>
            Promise.resolve({ current: { temperature_2m: temperature, weather_code: code } }),
    });
    let fetchMock: ReturnType<typeof vi.fn>;
    const track = vi.fn<(failure: ClimaFailure) => void>();
    const stores: ReturnType<typeof createClimaStore>[] = [];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(Date.parse('2026-10-31T16:00:00Z'));
        window.localStorage.clear();
        fetchMock = vi.fn(() => Promise.resolve(response()));
        vi.stubGlobal('fetch', fetchMock);
        track.mockClear();
    });

    afterEach(() => {
        stores.splice(0).forEach((s) => s.stop());
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    const store = (search = '') => {
        const s = createClimaStore({ search, onFailure: track });
        stores.push(s);
        return s;
    };
    const flush = () => vi.advanceTimersByTimeAsync(0);

    it('sin datos todavía no hay Clima, y no pide nada hasta arrancar', () => {
        const s = store();
        expect(s.getSnapshot()).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('al arrancar lo pide a Open-Meteo, para Caracas', async () => {
        const s = store();
        s.start();
        await flush();
        expect(String(fetchMock.mock.calls[0][0])).toContain(
            'api.open-meteo.com/v1/forecast?latitude=10.48&longitude=-66.90',
        );
        expect(s.getSnapshot()).toEqual({ estado: 'lluvia', temperatura: 22.4 });
    });

    it('avisa a quien escucha cuando llega', async () => {
        const s = store();
        const listener = vi.fn();
        s.subscribe(listener);
        s.start();
        await flush();
        expect(listener).toHaveBeenCalled();
    });

    it('arrancar dos veces no pide dos veces', async () => {
        const s = store();
        s.start();
        s.start();
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('guarda el dato 30 min: otra visita no vuelve a pedirlo', async () => {
        const first = store();
        first.start();
        await flush();
        const second = store();
        second.start();
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second.getSnapshot()).toEqual({ estado: 'lluvia', temperatura: 22.4 });
    });

    it('un dato guardado de hace más de 30 min se vuelve a pedir', async () => {
        window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ at: Date.now() - 31 * 60_000, estado: 'tormenta', temperatura: 1 }),
        );
        const s = store();
        s.start();
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(s.getSnapshot()?.estado).toBe('lluvia');
    });

    it('un dato guardado inválido se ignora', async () => {
        window.localStorage.setItem(CACHE_KEY, '{roto');
        const s = store();
        s.start();
        await flush();
        expect(s.getSnapshot()?.estado).toBe('lluvia');
    });

    it('sin localStorage sigue funcionando', async () => {
        const blocked = () => {
            throw new Error('bloqueado');
        };
        const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
        const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
        const s = store();
        s.start();
        await flush();
        expect(s.getSnapshot()?.estado).toBe('lluvia');
        get.mockRestore();
        set.mockRestore();
    });

    it('se refresca a los 30 min con la pestaña visible', async () => {
        const s = store();
        s.start();
        await flush();
        fetchMock.mockImplementation(() => Promise.resolve(response(0, 30)));
        await vi.advanceTimersByTimeAsync(30 * 60_000);
        expect(s.getSnapshot()).toEqual({ estado: 'despejado', temperatura: 30 });
    });

    it('con la pestaña oculta no pide, y al volver se pone al día', async () => {
        const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        const s = store();
        s.start();
        await flush();
        await vi.advanceTimersByTimeAsync(40 * 60_000);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        hidden.mockReturnValue(false);
        document.dispatchEvent(new Event('visibilitychange'));
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(2);
        hidden.mockRestore();
    });

    it('si la red falla no hay Clima, y se avisa una sola vez', async () => {
        fetchMock.mockImplementation(() => Promise.reject(new Error('sin red')));
        const s = store();
        s.start();
        await flush();
        expect(s.getSnapshot()).toBeNull();
        await vi.advanceTimersByTimeAsync(30 * 60_000);
        expect(track).toHaveBeenCalledTimes(1);
        expect(track).toHaveBeenCalledWith('red');
    });

    it.each([
        ['un error HTTP', () => ({ ok: false, json: () => Promise.resolve({}) })],
        ['una forma inesperada', () => ({ ok: true, json: () => Promise.resolve({}) })],
        ['un código desconocido', () => response(4)],
    ])('%s cuenta como fallo de respuesta', async (_, make) => {
        fetchMock.mockImplementation(() => Promise.resolve(make()));
        const s = store();
        s.start();
        await flush();
        expect(s.getSnapshot()).toBeNull();
        expect(track).toHaveBeenCalledWith('respuesta');
    });

    it('si falla un refresco, se queda con el último Clima un rato, y luego el cielo base', async () => {
        const s = store();
        s.start();
        await flush();
        fetchMock.mockImplementation(() => Promise.reject(new Error('sin red')));
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        expect(s.getSnapshot()?.estado).toBe('lluvia');
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        expect(s.getSnapshot()).toBeNull();
    });

    it('un dato guardado se refresca cuando cumple 30 min, no 30 min después de cargarlo', async () => {
        window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ at: Date.now() - 29 * 60_000, estado: 'tormenta', temperatura: 1 }),
        );
        const s = store();
        s.start();
        await flush();
        expect(s.getSnapshot()?.estado).toBe('tormenta');
        expect(fetchMock).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(2 * 60_000);
        expect(s.getSnapshot()?.estado).toBe('lluvia');
    });

    it('al volver a la pestaña, el siguiente refresco cuenta desde esa vuelta', async () => {
        const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        const s = store();
        s.start();
        await flush();
        await vi.advanceTimersByTimeAsync(35 * 60_000);
        hidden.mockReturnValue(false);
        document.dispatchEvent(new Event('visibilitychange'));
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        hidden.mockRestore();
    });

    describe('?clima=', () => {
        it('sustituye al dato, sin llamar a la API', async () => {
            const s = store('?clima=tormenta');
            expect(s.getSnapshot()?.estado).toBe('tormenta');
            expect(s.forced).toBe(true);
            s.start();
            await flush();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('no avisa de fallos', async () => {
            fetchMock.mockImplementation(() => Promise.reject(new Error('sin red')));
            const s = store('?clima=nublado');
            s.start();
            await flush();
            expect(track).not.toHaveBeenCalled();
        });

        it('un valor inválido se ignora, como si no estuviera', async () => {
            const s = store('?clima=nieve');
            expect(s.forced).toBe(false);
            s.start();
            await flush();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});
