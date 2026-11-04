import { describe, expect, it } from 'vitest';
import {
    afluenciaAt,
    dayKind,
    readForcedDay,
    readForcedTrafico,
    traficoAt,
} from '@app/scene/rhythm';

// El ritmo de Caracas que mueve la calle: qué tipo de día es y cuánta gente camina a cada hora.

// Un instante a esa hora de Caracas (UTC-4) de una fecha.
const caracas = (date: string, hour = 12) =>
    Date.parse(`${date}T${String(hour).padStart(2, '0')}:00:00-04:00`);

describe('dayKind', () => {
    it('distingue días hábiles, sábados y domingos en la fecha de Caracas', () => {
        expect(dayKind(caracas('2026-11-04'))).toBe('habil'); // miércoles
        expect(dayKind(caracas('2026-11-07'))).toBe('sabado');
        expect(dayKind(caracas('2026-11-08'))).toBe('domingo');
        // A las 11 PM de un viernes en Caracas ya es sábado en UTC, pero sigue siendo viernes.
        expect(dayKind(caracas('2026-11-06', 23))).toBe('habil');
    });

    it('los feriados fijos son feriados, caigan el día que caigan', () => {
        for (const date of ['2026-01-01', '2026-04-19', '2026-07-05', '2026-12-24', '2026-12-31']) {
            expect(dayKind(caracas(date))).toBe('feriado');
        }
    });

    it('?dia= fija el tipo de día', () => {
        expect(readForcedDay('?dia=domingo')).toBe('domingo');
        expect(readForcedDay('?dia=lunes')).toBeNull();
        expect(readForcedDay('')).toBeNull();
        expect(dayKind(caracas('2026-11-04'), 'feriado')).toBe('feriado');
    });
});

describe('afluenciaAt', () => {
    it('a las 2 AM no hay nadie y al mediodía de un día hábil la acera está llena', () => {
        expect(afluenciaAt(2, 'habil', null)).toBeLessThan(0.02);
        expect(afluenciaAt(12, 'habil', null)).toBe(1);
    });

    it('el fin de semana y los feriados hay menos gente que un día hábil', () => {
        for (const day of ['sabado', 'domingo', 'feriado'] as const) {
            expect(afluenciaAt(12, day, null)).toBeLessThan(afluenciaAt(12, 'habil', null));
        }
        expect(afluenciaAt(12, 'feriado', null)).toBe(afluenciaAt(12, 'domingo', null));
    });

    it('entre una hora y la siguiente cambia de a poco', () => {
        const [a, b] = [afluenciaAt(18, 'habil', null), afluenciaAt(19, 'habil', null)];
        expect(afluenciaAt(18.5, 'habil', null)).toBeCloseTo((a + b) / 2);
    });

    it('con lluvia queda menos gente, y con tormenta casi nadie', () => {
        const dry = afluenciaAt(12, 'habil', 'despejado');
        expect(afluenciaAt(12, 'habil', 'nublado')).toBeCloseTo(dry * 0.9);
        expect(afluenciaAt(12, 'habil', 'lluvia')).toBeCloseTo(dry * 0.3);
        expect(afluenciaAt(12, 'habil', 'tormenta')).toBeCloseTo(dry * 0.1);
    });
});

describe('traficoAt', () => {
    it('en un día hábil hay tranca de 7 a 9 AM y de 5 a 7 PM, y la calle vacía de madrugada', () => {
        expect(traficoAt(7.5, 'habil', null)).toBe('tranca');
        expect(traficoAt(17.5, 'habil', null)).toBe('tranca');
        expect(traficoAt(11, 'habil', null)).toBe('cargada');
        expect(traficoAt(19.5, 'habil', null)).toBe('fluida');
        expect(traficoAt(3, 'habil', null)).toBe('vacia');
    });

    it('el fin de semana no hay trancas, y los feriados son como un domingo', () => {
        for (let h = 0; h < 24; h += 0.5) {
            expect(traficoAt(h, 'sabado', null)).not.toBe('tranca');
            expect(traficoAt(h, 'feriado', null)).toBe(traficoAt(h, 'domingo', null));
        }
    });

    it('con lluvia sube un nivel, con tormenta dos, y nunca pasa de tranca', () => {
        expect(traficoAt(3, 'habil', 'lluvia')).toBe('fluida');
        expect(traficoAt(3, 'habil', 'tormenta')).toBe('cargada');
        expect(traficoAt(11, 'habil', 'tormenta')).toBe('tranca');
        expect(traficoAt(3, 'habil', 'nublado')).toBe('vacia');
    });

    it('?trafico= fija el nivel', () => {
        expect(readForcedTrafico('?trafico=tranca')).toBe('tranca');
        expect(readForcedTrafico('?trafico=mucho')).toBeNull();
    });
});

describe('traficoAt, en los bordes', () => {
    it('cada nivel empieza y termina en la hora en punto que se decidió', () => {
        const at = (h: number) => traficoAt(h, 'habil', null);
        expect([at(6.99), at(7), at(8.99), at(9)]).toEqual([
            'cargada',
            'tranca',
            'tranca',
            'cargada',
        ]);
        expect([at(16.99), at(17), at(18.99), at(19)]).toEqual([
            'cargada',
            'tranca',
            'tranca',
            'fluida',
        ]);
        expect([at(20.99), at(21)]).toEqual(['fluida', 'vacia']);
    });

    it('dentro de una hora el nivel no salta, aunque la curva quede justo en un corte', () => {
        const levels = new Set<string>();
        for (let m = 0; m < 60; m++) levels.add(traficoAt(11 + m / 60, 'domingo', null));
        expect(levels.size).toBe(1);
    });
});
