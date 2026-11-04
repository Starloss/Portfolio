import { describe, it, expect } from 'vitest';
import type { Walker } from '@app/scene/crowd';
import { createInstances, KIND, MAX_INSTANCES, writeInstances } from '@app/scene/gl/agents';
import type { Vehicle } from '@app/scene/traffic';

// La Avenida Bolívar en movimiento: los vehículos del Tráfico y la gente de la Afluencia, como
// instancias de un solo pase.

const street = { top: 600, H: 126, width: 1440 };

const vehicle = (extra: Partial<Vehicle> = {}): Vehicle => ({
    kind: 'car',
    s: 0.76,
    dir: 1,
    scale: 1,
    u: 3,
    v: 0.5,
    length: 0.55,
    phase: 0,
    braking: false,
    filtering: false,
    wants: 0.5,
    ...extra,
});

const person = (s: number, extra: Partial<Walker> = {}): Walker => ({
    u: 2,
    s,
    line: 0,
    dir: 1,
    speed: 0.1,
    scale: 1,
    phase: 0,
    gait: 'walk',
    umbrella: null,
    group: 0,
    ...extra,
});

const write = (vehicles: Vehicle[], walkers: Walker[], night: number, shiftX = 0) =>
    writeInstances(createInstances(), vehicles, walkers, { ...street, time: 0, night, shiftX });
const kinds = (i: ReturnType<typeof write>) =>
    Array.from({ length: i.count }, (_, k) => i.meta[k * 4]);

describe('writeInstances', () => {
    it('cada vehículo va en su lugar: los de atrás se ven desde la derecha', () => {
        const i = write([vehicle({ u: 3 }), vehicle({ u: 3, dir: -1, s: 0.47 })], [], 0);
        expect(i.count).toBe(2);
        expect(i.anchor[0]).toBeCloseTo(3 * street.H);
        expect(i.anchor[2]).toBeCloseTo(street.width - 3 * street.H);
        expect(i.anchor[1]).toBeCloseTo(street.top + 0.76 * street.H);
    });

    it('al frenar, la luz trasera se prende también de Día', () => {
        expect(kinds(write([vehicle()], [], 0))).toEqual([KIND.car]);
        expect(kinds(write([vehicle({ braking: true })], [], 0))).toEqual([KIND.car, KIND.dot]);
    });

    it('de Noche cada vehículo suma su haz, su faro y su luz trasera; los peatones no', () => {
        const i = write([vehicle(), vehicle({ kind: 'bus', u: 5 })], [person(0.2)], 1);
        const lights = kinds(i);
        expect(lights.filter((k) => k === KIND.beam)).toHaveLength(2);
        expect(lights.filter((k) => k === KIND.dot)).toHaveLength(4);
        expect(i.count).toBe(3 + 6);
    });

    it('una tranca de Noche con la acera llena cabe en el tope', () => {
        const jam = Array.from({ length: 70 }, (_, k) => vehicle({ u: (k % 17) * 0.6 }));
        const crowd = Array.from({ length: 90 }, (_, k) => person(k % 2 ? 0.2 : 0.99));
        expect(write(jam, crowd, 1).count).toBeLessThanOrEqual(MAX_INSTANCES);
    });

    it('el parallax corre todo junto', () => {
        const still = write([vehicle()], [], 0);
        const moved = write([vehicle()], [], 0, -12);
        expect(moved.anchor[0] - still.anchor[0]).toBeCloseTo(-12);
    });

    it('lo que sobra de una escritura anterior queda sin tamaño', () => {
        const into = createInstances();
        writeInstances(into, [vehicle(), vehicle()], [], { ...street, time: 0, night: 1 });
        writeInstances(into, [vehicle()], [], { ...street, time: 0, night: 0 });
        expect(into.size[into.count * 2]).toBe(0);
    });

    it('la gente de la acera de atrás va antes que los vehículos, y la de adelante después', () => {
        const order = kinds(write([vehicle()], [person(0.995), person(0.2)], 0));
        expect(order).toEqual([KIND.walker, KIND.car, KIND.walker]);
    });

    it('el peatón le dice al shader si lleva paraguas y cómo se mueve', () => {
        const code = (extra: Partial<Walker>) => write([], [person(0.2, extra)], 0).meta[3];
        expect(code({})).toBe(0);
        expect(code({ umbrella: [0.9, 0.7, 0.1] })).toBe(1);
        expect(code({ gait: 'stand' })).toBe(2);
        expect(code({ gait: 'run' })).toBe(4);
    });
});
