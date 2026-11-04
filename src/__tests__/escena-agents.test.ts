import { describe, it, expect } from 'vitest';
import { agentX, streetAgents } from '@app/scene/street';
import { createInstances, KIND, MAX_INSTANCES, writeInstances } from '@app/scene/gl/agents';
import type { Walker } from '@app/scene/crowd';

// La Avenida Bolívar en movimiento: los vehículos de la formación de la SVG y la gente simulada,
// como instancias.

const agents = streetAgents();
const street = { top: 600, H: 126, width: 1440 };
const write = (time: number, night: number, shiftX = 0) =>
    writeInstances(createInstances(), agents, [], { ...street, time, night, shiftX });
const kinds = (i: ReturnType<typeof write>) =>
    Array.from({ length: i.count }, (_, k) => i.meta[k * 4]);

describe('writeInstances', () => {
    it('de Día, una instancia por persona o vehículo, en el lugar de la SVG a los 0 s', () => {
        const i = write(0, 0);
        expect(i.count).toBe(agents.length);
        agents.forEach((a, k) => {
            expect(i.anchor[k * 2]).toBeCloseTo(agentX(a, 0, street.width, street.H));
            expect(i.anchor[k * 2 + 1]).toBeCloseTo(
                street.top +
                    a.s * street.H +
                    (a.kind === 'moto' ? Math.sin(a.phase) * 0.035 * street.H : 0),
            );
        });
        expect(kinds(i).every((k) => k <= KIND.walker)).toBe(true);
    });

    it('con el tiempo avanzan', () => {
        const before = write(0, 0);
        const after = write(2, 0);
        const car = agents.findIndex((a) => a.kind === 'car');
        expect(Math.sign(after.anchor[car * 2] - before.anchor[car * 2])).toBe(agents[car].dir);
    });

    it('de Noche cada vehículo suma su haz, su faro y su luz trasera; los peatones no', () => {
        const i = write(0, 1);
        const vehicles = agents.filter((a) => a.kind !== 'walker').length;
        const lights = kinds(i);
        expect(lights.filter((k) => k === KIND.beam)).toHaveLength(vehicles);
        expect(lights.filter((k) => k === KIND.dot)).toHaveLength(2 * vehicles);
        expect(i.count).toBe(agents.length + 3 * vehicles);
        expect(i.count).toBeLessThanOrEqual(MAX_INSTANCES);
    });

    it('el parallax corre todo junto', () => {
        const still = write(0, 0);
        const moved = write(0, 0, -12);
        expect(moved.anchor[0] - still.anchor[0]).toBeCloseTo(-12);
    });

    it('lo que sobra de una escritura anterior queda sin tamaño', () => {
        const into = createInstances();
        writeInstances(into, agents, [], { ...street, time: 0, night: 1 });
        writeInstances(into, agents, [], { ...street, time: 0, night: 0 });
        expect(into.size[into.count * 2]).toBe(0);
    });

    it('la gente de la acera de atrás va antes que los vehículos, y la de adelante después', () => {
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
        const i = writeInstances(createInstances(), agents, [person(0.995), person(0.2)], {
            ...street,
            time: 0,
            night: 0,
        });
        const order = kinds(i);
        expect(order[0]).toBe(KIND.walker);
        expect(order[order.length - 1]).toBe(KIND.walker);
        expect(order.slice(1, -1).every((k) => k !== KIND.walker)).toBe(true);
    });

    it('el peatón le dice al shader si lleva paraguas y cómo se mueve', () => {
        const code = (extra: Partial<Walker>) => {
            const walker: Walker = {
                u: 2,
                s: 0.2,
                line: 0,
                dir: 1,
                speed: 0.1,
                scale: 1,
                phase: 0,
                gait: 'walk',
                umbrella: null,
                group: 0,
                ...extra,
            };
            return writeInstances(createInstances(), [], [walker], { ...street, time: 0, night: 0 })
                .meta[3];
        };
        expect(code({})).toBe(0);
        expect(code({ umbrella: [0.9, 0.7, 0.1] })).toBe(1);
        expect(code({ gait: 'stand' })).toBe(2);
        expect(code({ gait: 'run' })).toBe(4);
    });
});
