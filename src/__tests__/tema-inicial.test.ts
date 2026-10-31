import fs from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// El script inline de index.html: el tema tiene que estar puesto antes del primer pintado.
const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
const root = document.documentElement;

/** Carga la página a esa hora UTC, con esa búsqueda en la URL. */
function load(utc: string, search = '') {
    vi.setSystemTime(new Date(utc));
    window.history.replaceState(null, '', `/${search}`);
    new Function(inline)();
}

const isDark = () => root.classList.contains('dark');

describe('tema inicial', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        window.sessionStorage.clear();
        window.localStorage.clear();
        root.classList.remove('dark');
        delete root.dataset.temaHora;
    });

    afterEach(() => {
        vi.useRealTimers();
        window.history.replaceState(null, '', '/');
    });

    it('corre antes de la hoja de estilos', () => {
        expect(inline).not.toBe('');
        expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('rel="stylesheet"'));
    });

    // Caracas es UTC-4. El 31 de octubre el sol sale cerca de las 06:15 y se pone cerca de las 18:05.
    it.each([
        ['mediodía', '2026-10-31T16:00:00Z', false],
        ['poco después del amanecer', '2026-10-31T11:00:00Z', false],
        ['poco antes del atardecer', '2026-10-31T21:30:00Z', false],
        ['poco antes del amanecer', '2026-10-31T09:30:00Z', true],
        ['poco después del atardecer', '2026-10-31T22:40:00Z', true],
        ['medianoche', '2026-11-01T04:00:00Z', true],
    ])('sigue al sol de Caracas: %s', (_, utc, dark) => {
        load(utc);
        expect(isDark()).toBe(dark);
    });

    it('la preferencia del sistema no cuenta', () => {
        const matchMedia = vi.spyOn(window, 'matchMedia');
        load('2026-10-31T16:00:00Z');
        expect(matchMedia).not.toHaveBeenCalled();
        expect(isDark()).toBe(false);
    });

    it('el tema guardado por versiones anteriores no cuenta', () => {
        window.localStorage.setItem('theme', 'dark');
        load('2026-10-31T16:00:00Z');
        expect(isDark()).toBe(false);
    });

    it('anota qué tema corresponde a la hora', () => {
        load('2026-10-31T16:00:00Z');
        expect(root.dataset.temaHora).toBe('light');
        load('2026-11-01T04:00:00Z');
        expect(root.dataset.temaHora).toBe('dark');
    });

    it('manda la elección de la visita', () => {
        window.sessionStorage.setItem('tema-elegido', 'dark');
        load('2026-10-31T16:00:00Z');
        expect(isDark()).toBe(true);
        expect(root.dataset.temaHora).toBe('light');
    });

    it('ignora una elección inválida', () => {
        window.sessionStorage.setItem('tema-elegido', 'rosa');
        load('2026-10-31T16:00:00Z');
        expect(isDark()).toBe(false);
    });

    it('sin sessionStorage sigue la hora', () => {
        const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        load('2026-11-01T04:00:00Z');
        expect(isDark()).toBe(true);
        getItem.mockRestore();
    });

    describe('?hora=', () => {
        it('sustituye al reloj, en la hora de Caracas', () => {
            load('2026-10-31T16:00:00Z', '?hora=22:00');
            expect(isDark()).toBe(true);
            load('2026-11-01T04:00:00Z', '?hora=12:00');
            expect(root.dataset.temaHora).toBe('light');
        });

        it('no pasa por encima de la elección', () => {
            window.sessionStorage.setItem('tema-elegido', 'light');
            load('2026-10-31T16:00:00Z', '?hora=22:00');
            expect(isDark()).toBe(false);
            expect(root.dataset.temaHora).toBe('dark');
        });

        it.each(['25:00', '12:60', 'mediodia', '12', ''])('ignora el valor inválido %j', (hora) => {
            load('2026-11-01T04:00:00Z', `?hora=${hora}`);
            expect(isDark()).toBe(true);
        });
    });
});
