import { describe, expect, it } from 'vitest';
import { Crowd } from '@app/scene/crowd';
import { EscenaGL } from '@app/scene/gl/engine';
import type { AfluenciaParams, NivelTrafico } from '@app/scene/rhythm';
import { Traffic } from '@app/scene/traffic';

// Exercise the engine's agent update path without constructing a WebGL context.
function engine(onDemand: boolean) {
    return Object.assign(Object.create(EscenaGL.prototype), {
        onDemand,
        crowd: new Crowd(),
        crowdParams: null,
        crowdChanged: false,
        traffic: new Traffic(),
        nivelTrafico: null,
        trafficChanged: false,
        dirty: false,
    }) as {
        crowd: Crowd;
        traffic: Traffic;
        setCrowd: (params: AfluenciaParams) => void;
        setTraffic: (nivel: NivelTrafico) => void;
        updateAgents: (dt: number, span: number, treeEvery: number) => void;
    };
}

const update = (scene: ReturnType<typeof engine>) => scene.updateAgents(0.1, 1280 / 150, 260 / 150);

describe('EscenaGL agent updates', () => {
    it('repopulates static agents when their settings change and leaves them still otherwise', () => {
        const scene = engine(true);
        scene.setCrowd({ afluencia: 0, lluvia: 'seca' });
        scene.setTraffic('vacia');
        update(scene);
        expect(scene.crowd.walkers).toHaveLength(0);
        const emptyTraffic = scene.traffic.vehicles.length;

        scene.setCrowd({ afluencia: 1, lluvia: 'lluvia' });
        scene.setTraffic('tranca');
        update(scene);
        expect(scene.crowd.walkers.length).toBeGreaterThan(50);
        expect(scene.crowd.walkers.some((walker) => walker.umbrella)).toBe(true);
        expect(scene.traffic.vehicles.length).toBeGreaterThan(emptyTraffic);
        const crowd = scene.crowd;
        const traffic = scene.traffic;
        const walkers = structuredClone(crowd.walkers);
        const vehicles = structuredClone(traffic.vehicles);

        scene.setCrowd({ afluencia: 1, lluvia: 'lluvia' });
        scene.setTraffic('tranca');
        update(scene);
        expect(scene.crowd).toBe(crowd);
        expect(scene.traffic).toBe(traffic);
        expect(crowd.walkers).toEqual(walkers);
        expect(traffic.vehicles).toEqual(vehicles);

        scene.setCrowd({ afluencia: 0, lluvia: 'seca' });
        scene.setTraffic('vacia');
        update(scene);
        expect(scene.crowd.walkers).toHaveLength(0);
        expect(scene.traffic.vehicles.length).toBe(emptyTraffic);
    });

    it('keeps and advances the simulations when animated settings change', () => {
        const scene = engine(false);
        scene.setCrowd({ afluencia: 1, lluvia: 'seca' });
        scene.setTraffic('fluida');
        update(scene);
        const crowd = scene.crowd;
        const traffic = scene.traffic;
        const walker = crowd.walkers.find((person) => person.gait === 'walk')!;
        const vehicle = traffic.vehicles[0];
        const walkerPosition = walker.u;
        const vehiclePosition = vehicle.u;

        scene.setCrowd({ afluencia: 0, lluvia: 'tormenta' });
        scene.setTraffic('tranca');
        update(scene);
        expect(scene.crowd).toBe(crowd);
        expect(scene.traffic).toBe(traffic);
        expect(crowd.walkers).toContain(walker);
        expect(traffic.vehicles).toContain(vehicle);
        expect(walker.u).not.toBe(walkerPosition);
        expect(vehicle.u).not.toBe(vehiclePosition);
    });
});
