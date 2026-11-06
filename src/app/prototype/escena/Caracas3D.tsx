import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { caracasNow } from '@lib/clima';
import { useTheme } from '@lib/theme';

import { sky } from '../../scene/sky';

// PROTOTIPO (research/impeccable, mapa #104, ticket "Prototipo de la Caracas 3D en three.js").
// Caracas en 3D desde datos reales horneados por scripts/prototype-caracas3d.ts: el relieve de
// Copernicus GLO-30, la cobertura del suelo de ESA WorldCover y los edificios y vías de
// OpenStreetMap. El sol y la luna están donde están sobre Caracas a la hora real; el terreno
// proyecta sombras, los edificios encienden sus ventanas de Noche y los faroles brillan. La cámara
// baja del Humboldt a la ciudad con el scroll. Corre en el hilo principal: es un prototipo; la
// versión de producción iría en el Worker de la Escena.

interface Meta {
    cols: number;
    rows: number;
    x0: number;
    z0: number;
    x1: number;
    z1: number;
    origin: { lat: number; lon: number };
}

type Calidad = 'alto' | 'medio' | 'bajo';
const BASE = '/prototype/caracas3d';
const LAT = 10.5;
const M_PER_LAT = 110574;
const M_PER_LON = 111320 * Math.cos((LAT * Math.PI) / 180);
const toXZ = (lat: number, lon: number) => [(lon + 66.9) * M_PER_LON, -(lat - 10.5) * M_PER_LAT];

const HITOS = {
    humboldt: { lat: 10.5414, lon: -66.8764 },
    upperStation: { lat: 10.5402, lon: -66.8766 },
    lowerStation: { lat: 10.5082, lon: -66.8798 },
    altamira: { lat: 10.4925, lon: -66.8475 },
};

const hash = (n: number) => {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};

/** La dirección del sol (o de la luna) sobre Caracas, con su declinación aproximada. */
function directionOf(alt: number, hourAngle: number, dec: number) {
    const h = THREE.MathUtils.degToRad(alt);
    const phi = THREE.MathUtils.degToRad(LAT);
    const d = THREE.MathUtils.degToRad(dec);
    const cosA = (Math.sin(d) - Math.sin(h) * Math.sin(phi)) / (Math.cos(h) * Math.cos(phi));
    let az = Math.acos(THREE.MathUtils.clamp(cosA, -1, 1));
    if (hourAngle > 0) az = 2 * Math.PI - az;
    return new THREE.Vector3(Math.sin(az) * Math.cos(h), Math.sin(h), -Math.cos(az) * Math.cos(h));
}

function sunDeclination(ms: number) {
    const day = (ms - Date.UTC(new Date(ms).getUTCFullYear(), 0, 0)) / 864e5;
    return -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10));
}

// ---------------------------------------------------------------------------------------------
// El terreno: una grilla con el color de la cobertura del suelo y sombras del sol.

const SUELO: Record<number, [number, number, number]> = {
    10: [0.11, 0.2, 0.08], // árboles
    20: [0.28, 0.3, 0.15], // matorral
    30: [0.42, 0.42, 0.22], // pasto
    40: [0.45, 0.42, 0.25], // cultivo
    50: [0.36, 0.35, 0.33], // construido
    60: [0.45, 0.4, 0.32], // suelo desnudo
    80: [0.04, 0.12, 0.18], // agua
    90: [0.2, 0.26, 0.14],
    95: [0.12, 0.2, 0.1],
};

function buildTerrain(meta: Meta, relieve: Uint16Array, suelo: Uint8Array, stride: number) {
    const cols = Math.floor((meta.cols - 1) / stride) + 1;
    const rows = Math.floor((meta.rows - 1) / stride) + 1;
    const dx = ((meta.x1 - meta.x0) / (meta.cols - 1)) * stride;
    const dz = ((meta.z1 - meta.z0) / (meta.rows - 1)) * stride;
    const at = (r: number, c: number) =>
        relieve[
            Math.min(meta.rows - 1, r * stride) * meta.cols + Math.min(meta.cols - 1, c * stride)
        ] / 4;
    const position = new Float32Array(cols * rows * 3);
    const color = new Float32Array(cols * rows * 3);
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            const h = at(r, c);
            position.set([meta.x0 + c * dx, h, meta.z0 + r * dz], i * 3);
            const cls =
                suelo[
                    Math.min(meta.rows - 1, r * stride) * meta.cols +
                        Math.min(meta.cols - 1, c * stride)
                ];
            const base = SUELO[cls] ?? SUELO[30];
            // Variación de tono: el bosque del Ávila no es un solo verde.
            const v = 0.82 + 0.36 * hash(i * 1.7);
            const paramo = THREE.MathUtils.smoothstep(h, 1900, 2500);
            color.set(
                [
                    THREE.MathUtils.lerp(base[0] * v, 0.38, paramo * 0.5),
                    THREE.MathUtils.lerp(base[1] * v, 0.36, paramo * 0.5),
                    THREE.MathUtils.lerp(base[2] * v, 0.2, paramo * 0.5),
                ],
                i * 3,
            );
        }
    const index = new Uint32Array((rows - 1) * (cols - 1) * 6);
    let k = 0;
    for (let r = 0; r < rows - 1; r++)
        for (let c = 0; c < cols - 1; c++) {
            const a = r * cols + c;
            index.set([a, a + cols, a + 1, a + 1, a + cols, a + cols + 1], k);
            k += 6;
        }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    geometry.computeVertexNormals();

    const heightAt = (x: number, z: number) => {
        const c = ((x - meta.x0) / (meta.x1 - meta.x0)) * (meta.cols - 1);
        const r = ((z - meta.z0) / (meta.z1 - meta.z0)) * (meta.rows - 1);
        const c0 = THREE.MathUtils.clamp(Math.floor(c), 0, meta.cols - 2);
        const r0 = THREE.MathUtils.clamp(Math.floor(r), 0, meta.rows - 2);
        const fc = c - c0;
        const fr = r - r0;
        const g = (rr: number, cc: number) => relieve[rr * meta.cols + cc] / 4;
        return (
            g(r0, c0) * (1 - fr) * (1 - fc) +
            g(r0, c0 + 1) * (1 - fr) * fc +
            g(r0 + 1, c0) * fr * (1 - fc) +
            g(r0 + 1, c0 + 1) * fr * fc
        );
    };
    return { geometry, heightAt };
}

// ---------------------------------------------------------------------------------------------
// Los edificios: cada huella extruida; las paredes llevan sus coordenadas de fachada para
// dibujar pisos y ventanas en el shader.

function buildCity(data: DataView, heightAt: (x: number, z: number) => number, minHeight: number) {
    const pos: number[] = [];
    const nor: number[] = [];
    const fac: number[] = [];
    const tint: number[] = [];
    const idx: number[] = [];
    let offset = 0;
    let id = 0;
    while (offset < data.byteLength) {
        const height = data.getUint16(offset, true) / 10;
        const n = data.getUint16(offset + 2, true);
        const ring: THREE.Vector2[] = [];
        for (let i = 0; i < n; i++)
            ring.push(
                new THREE.Vector2(
                    data.getInt16(offset + 4 + i * 4, true) / 2,
                    data.getInt16(offset + 6 + i * 4, true) / 2,
                ),
            );
        offset += 4 + n * 4;
        id++;
        if (height < minHeight) continue;
        let cx = 0;
        let cz = 0;
        let ground = Infinity;
        for (const p of ring) {
            cx += p.x / n;
            cz += p.y / n;
            ground = Math.min(ground, heightAt(p.x, p.y));
        }
        const base = ground - 3;
        const top = ground + height;
        // Las casas de los barrios, de ladrillo; el resto, concreto claro de tonos variados.
        const barrio = height < 8 && hash(id) < 0.7;
        const r = hash(id * 3.1);
        const color = barrio
            ? [0.5 + 0.12 * r, 0.27 + 0.06 * r, 0.18]
            : [0.62 + 0.25 * r, 0.6 + 0.22 * r, 0.55 + 0.2 * r];
        let u = 0;
        for (let i = 0; i < n; i++) {
            const a = ring[i];
            const b = ring[(i + 1) % n];
            const len = a.distanceTo(b);
            const nx = b.y - a.y;
            const nz = -(b.x - a.x);
            const l = Math.hypot(nx, nz) || 1;
            // El sentido del anillo no está garantizado: la normal mira hacia fuera del centroide.
            const mx = (a.x + b.x) / 2 - cx;
            const mz = (a.y + b.y) / 2 - cz;
            const s = mx * nx + mz * nz >= 0 ? 1 : -1;
            const v = pos.length / 3;
            pos.push(a.x, base, a.y, b.x, base, b.y, b.x, top, b.y, a.x, top, a.y);
            for (let k = 0; k < 4; k++) {
                nor.push((s * nx) / l, 0, (s * nz) / l);
                tint.push(...color);
            }
            fac.push(u, -3, u + len, -3, u + len, height, u, height);
            idx.push(v, v + 1, v + 2, v, v + 2, v + 3, v, v + 2, v + 1, v, v + 3, v + 2);
            u += len;
        }
        const roof = THREE.ShapeUtils.triangulateShape(ring, []);
        const v = pos.length / 3;
        for (const p of ring) {
            pos.push(p.x, top, p.y);
            nor.push(0, 1, 0);
            fac.push(0, -1000);
            tint.push(color[0] * 0.8, color[1] * 0.8, color[2] * 0.8);
        }
        for (const [a, b, c] of roof) idx.push(v + a, v + b, v + c, v + a, v + c, v + b);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geometry.setAttribute('facade', new THREE.Float32BufferAttribute(fac, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(tint, 3));
    geometry.setIndex(idx);
    return geometry;
}

/** Ventanas: pisos de 3,2 m; de Día reflejan el cielo, de Noche algunas se encienden. */
function windowsMaterial(night: { value: number }) {
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uNight = night;
        shader.vertexShader = shader.vertexShader
            .replace(
                '#include <common>',
                '#include <common>\nattribute vec2 facade;\nvarying vec2 vFacade;',
            )
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFacade = facade;');
        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                '#include <common>\nuniform float uNight;\nvarying vec2 vFacade;\nfloat h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
            )
            .replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
                if (vFacade.y > 1.0) {
                    vec2 cell = floor(vec2(vFacade.x / 3.0, vFacade.y / 3.2));
                    vec2 f = fract(vec2(vFacade.x / 3.0, vFacade.y / 3.2));
                    float win = step(0.18, f.x) * step(f.x, 0.82) * step(0.3, f.y) * step(f.y, 0.85);
                    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.2, 0.26), win * 0.75 * (1.0 - uNight));
                    float lit = step(0.55, h21(cell + floor(vFacade.x / 400.0)));
                    totalEmissiveRadiance += win * lit * uNight * vec3(1.0, 0.68, 0.36) * (0.8 + h21(cell * 1.3));
                }`,
            );
    };
    return material;
}

/** Un punto redondo y difuso para los faroles. */
function dotTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    if (g) {
        const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        r.addColorStop(0, 'rgba(255,255,255,1)');
        r.addColorStop(0.35, 'rgba(255,255,255,0.6)');
        r.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = r;
        g.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(c);
}

// ---------------------------------------------------------------------------------------------

export const Caracas3D: React.FC<{ calidad?: Calidad }> = ({ calidad }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();
    const themeRef = useRef(theme);
    const redrawRef = useRef<() => void>(() => {});
    const resizeRef = useRef<() => void>(() => {});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const nivel: Calidad = calidad ?? (window.innerWidth < 900 ? 'medio' : 'alto');
        let disposed = false;
        let cleanup = () => {};
        const onResize = () => resizeRef.current();
        const onScroll = () => redrawRef.current();
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, { passive: true });

        (async () => {
            const load = (f: string) => fetch(`${BASE}/${f}`).then((r) => r.arrayBuffer());
            const [meta, relieve, suelo, edificios, faroles] = await Promise.all([
                fetch(`${BASE}/meta.json`).then((r) => r.json() as Promise<Meta>),
                load('relieve.bin'),
                load('suelo.bin'),
                load('edificios.bin'),
                load('faroles.bin'),
            ]);
            if (disposed) return;

            const renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: nivel !== 'bajo',
                powerPreference: 'high-performance',
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, nivel === 'alto' ? 2 : 1.25));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.shadowMap.enabled = nivel !== 'bajo';
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(36, 1, 20, 90000);
            const fog = new THREE.FogExp2(0xb8c8d8, 0.000022);
            scene.fog = fog;

            const terrain = buildTerrain(
                meta,
                new Uint16Array(relieve),
                new Uint8Array(suelo),
                nivel === 'alto' ? 1 : 2,
            );
            const ground = new THREE.Mesh(
                terrain.geometry,
                new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 }),
            );
            ground.receiveShadow = true;
            ground.castShadow = true;
            scene.add(ground);

            const sea = new THREE.Mesh(
                new THREE.PlaneGeometry(90000, 40000).rotateX(-Math.PI / 2),
                new THREE.MeshStandardMaterial({
                    color: 0x0b2a3c,
                    roughness: 0.12,
                    metalness: 0.2,
                }),
            );
            sea.position.set(0, 1.5, -26000);
            scene.add(sea);

            const night = { value: 0 };
            const city = new THREE.Mesh(
                buildCity(new DataView(edificios), terrain.heightAt, nivel === 'bajo' ? 9 : nivel === 'medio' ? 5 : 0),
                windowsMaterial(night),
            );
            city.castShadow = nivel === 'alto';
            city.receiveShadow = true;
            scene.add(city);

            // Faroles: puntos cálidos que solo se ven de Noche.
            const lamps = new Int16Array(faroles);
            const lampPos = new Float32Array((lamps.length / 2) * 3);
            for (let i = 0; i < lamps.length / 2; i++) {
                const x = lamps[i * 2] / 2;
                const z = lamps[i * 2 + 1] / 2;
                lampPos.set([x, terrain.heightAt(x, z) + 7, z], i * 3);
            }
            const lampGeometry = new THREE.BufferGeometry();
            lampGeometry.setAttribute('position', new THREE.BufferAttribute(lampPos, 3));
            const lampsMesh = new THREE.Points(
                lampGeometry,
                new THREE.PointsMaterial({
                    color: 0xffb35c,
                    size: 4.5,
                    map: dotTexture(),
                    sizeAttenuation: true,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                }),
            );
            scene.add(lampsMesh);

            // El Hotel Humboldt: la torre cilíndrica sobre su base, en la cima.
            const [hx, hz] = toXZ(HITOS.humboldt.lat, HITOS.humboldt.lon);
            const hy = terrain.heightAt(hx, hz);
            const humboldt = new THREE.Group();
            const concrete = new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: 0.8 });
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(12, 12, 58, 40),
                windowsMaterialSolid(night),
            );
            tower.position.y = 29 + 10;
            const podium = new THREE.Mesh(new THREE.BoxGeometry(70, 12, 36), concrete);
            podium.position.y = 6;
            humboldt.add(tower, podium);
            humboldt.position.set(hx, hy - 3, hz);
            humboldt.traverse((o) => {
                o.castShadow = true;
                o.receiveShadow = true;
            });
            scene.add(humboldt);

            // El Teleférico: el cable en catenaria, las estaciones y sus cabinas rojas.
            const [lx, lz] = toXZ(HITOS.lowerStation.lat, HITOS.lowerStation.lon);
            const [ux, uz] = toXZ(HITOS.upperStation.lat, HITOS.upperStation.lon);
            const ly = terrain.heightAt(lx, lz) + 18;
            const uy = terrain.heightAt(ux, uz) + 18;
            const cablePts: THREE.Vector3[] = [];
            for (let i = 0; i <= 80; i++) {
                const t = i / 80;
                const sag = Math.sin(Math.PI * t) * 90;
                cablePts.push(
                    new THREE.Vector3(
                        lx + (ux - lx) * t,
                        ly + (uy - ly) * t - sag,
                        lz + (uz - lz) * t,
                    ),
                );
            }
            const cableCurve = new THREE.CatmullRomCurve3(cablePts);
            const cable = new THREE.Mesh(
                new THREE.TubeGeometry(cableCurve, 200, 1.2, 4),
                new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.6 }),
            );
            scene.add(cable);
            const cabinMaterial = new THREE.MeshStandardMaterial({
                color: 0xc8202a,
                roughness: 0.5,
                emissive: 0x000000,
            });
            for (let i = 1; i < 12; i++) {
                const cabin = new THREE.Mesh(new THREE.BoxGeometry(9, 8, 9), cabinMaterial);
                cabin.position.copy(cableCurve.getPoint(i / 12)).add(new THREE.Vector3(0, -7, 0));
                cabin.castShadow = true;
                scene.add(cabin);
            }
            for (const [x, y, z] of [
                [lx, ly - 18, lz],
                [ux, uy - 18, uz],
            ]) {
                const station = new THREE.Mesh(new THREE.BoxGeometry(40, 16, 30), concrete);
                station.position.set(x, y + 6, z);
                station.castShadow = true;
                scene.add(station);
            }

            // El cielo: Preetham de Día; de Noche, un fondo profundo con estrellas y la luna.
            const skyMesh = new Sky();
            skyMesh.scale.setScalar(80000);
            const skyU = skyMesh.material.uniforms;
            skyU.turbidity.value = 3.2;
            skyU.rayleigh.value = 2.2;
            skyU.mieCoefficient.value = 0.004;
            skyU.mieDirectionalG.value = 0.8;
            scene.add(skyMesh);

            const starPos = new Float32Array(2500 * 3);
            for (let i = 0; i < 2500; i++) {
                const a = hash(i) * Math.PI * 2;
                const e = Math.asin(hash(i + 0.5) * 0.98 + 0.02);
                starPos.set(
                    [
                        Math.cos(a) * Math.cos(e) * 70000,
                        Math.sin(e) * 70000,
                        Math.sin(a) * Math.cos(e) * 70000,
                    ],
                    i * 3,
                );
            }
            const starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
            const stars = new THREE.Points(
                starGeometry,
                new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: 1.6,
                    sizeAttenuation: false,
                    fog: false,
                    transparent: true,
                    opacity: 0.85,
                }),
            );
            scene.add(stars);
            const moon = new THREE.Mesh(
                new THREE.SphereGeometry(700, 24, 16),
                new THREE.MeshBasicMaterial({ color: 0xf1f0e6, fog: false }),
            );
            scene.add(moon);

            const sun = new THREE.DirectionalLight(0xffffff, 3);
            sun.castShadow = renderer.shadowMap.enabled;
            sun.shadow.mapSize.setScalar(nivel === 'alto' ? 4096 : 2048);
            const sc = sun.shadow.camera;
            sc.left = -9000;
            sc.right = 9000;
            sc.top = 9000;
            sc.bottom = -9000;
            sc.near = 100;
            sc.far = 60000;
            sun.shadow.bias = -0.0004;
            sun.shadow.normalBias = 12;
            scene.add(sun, sun.target);
            const hemi = new THREE.HemisphereLight(0xbcd2ec, 0x3a3a2a, 0.9);
            scene.add(hemi);

            // Postproceso: bloom para los faroles y las ventanas de Noche.
            const composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));
            const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.5, 0.82);
            composer.addPass(bloom);
            composer.addPass(new OutputPass());

            // El Viaje de cámara: del Humboldt, entre las cumbres, hasta la ciudad.
            const [ax, az] = toXZ(HITOS.altamira.lat, HITOS.altamira.lon);
            const start = {
                eye: new THREE.Vector3(hx - 900, hy + 220, hz + 2600),
                at: new THREE.Vector3(hx, hy + 10, hz),
            };
            const end = {
                eye: new THREE.Vector3(ax - 600, terrain.heightAt(ax, az) + 190, az + 1500),
                at: new THREE.Vector3(hx + 300, hy - 900, hz),
            };

            const draw = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
                const e = p * p * (3 - 2 * p);
                camera.position.lerpVectors(start.eye, end.eye, e);
                camera.lookAt(new THREE.Vector3().lerpVectors(start.at, end.at, e));

                const now = caracasNow();
                const { sun: s, moon: m } = sky(now);
                const isNight = themeRef.current === 'dark';
                const dec = sunDeclination(now);
                // Si el estado elegido no coincide con la hora, el astro va a una altura fija.
                const sunAlt = isNight ? s.alt : s.alt > -1 ? s.alt : 35;
                const sunDir = directionOf(
                    Math.max(sunAlt, -6),
                    s.alt > -1 || isNight ? s.hour : -40,
                    dec,
                );
                const moonDir = directionOf(isNight && m.alt < 5 ? 35 : m.alt, m.hour, 0);
                night.value = isNight ? 1 : 0;

                skyMesh.visible = !isNight;
                stars.visible = isNight;
                moon.visible = isNight;
                lampsMesh.visible = isNight;
                skyU.sunPosition.value.copy(sunDir);
                moon.position.copy(camera.position).addScaledVector(moonDir, 60000);

                const light = isNight ? moonDir : sunDir;
                sun.position
                    .copy(new THREE.Vector3(hx * 0.3, 0, hz * 0.3))
                    .addScaledVector(light, 30000);
                sun.target.position.set(hx * 0.3, 900, hz * 0.3);
                const golden = THREE.MathUtils.smoothstep(sunAlt, -2, 18);
                if (isNight) {
                    sun.color.setRGB(0.55, 0.65, 0.95);
                    sun.intensity = 0.35;
                    hemi.color.setRGB(0.12, 0.16, 0.3);
                    hemi.groundColor.setRGB(0.04, 0.04, 0.06);
                    hemi.intensity = 0.6;
                    fog.color.setRGB(0.03, 0.05, 0.11);
                    fog.density = 0.00004;
                    scene.background = new THREE.Color(0.012, 0.02, 0.055);
                    bloom.enabled = true;
                    bloom.strength = 1.1;
                    renderer.toneMappingExposure = 1.0;
                } else {
                    sun.color.setRGB(
                        1,
                        THREE.MathUtils.lerp(0.62, 0.96, golden),
                        THREE.MathUtils.lerp(0.38, 0.9, golden),
                    );
                    sun.intensity = THREE.MathUtils.lerp(1.6, 3.2, golden);
                    hemi.color.setRGB(0.7, 0.8, 0.95);
                    hemi.groundColor.setRGB(0.25, 0.24, 0.18);
                    hemi.intensity = THREE.MathUtils.lerp(0.5, 0.95, golden);
                    fog.color.setRGB(
                        THREE.MathUtils.lerp(0.95, 0.72, golden),
                        THREE.MathUtils.lerp(0.72, 0.8, golden),
                        THREE.MathUtils.lerp(0.58, 0.88, golden),
                    );
                    fog.density = 0.000022;
                    scene.background = null;
                    bloom.enabled = false;
                    renderer.toneMappingExposure = THREE.MathUtils.lerp(0.62, 0.48, golden);
                }
                composer.render();
            };

            let frame = 0;
            const schedule = () => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(draw);
            };
            const resize = () => {
                const w = window.innerWidth;
                const h = window.innerHeight;
                renderer.setSize(w, h, false);
                composer.setSize(w, h);
                bloom.resolution.set(w, h);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                schedule();
            };
            redrawRef.current = schedule;
            resizeRef.current = resize;
            resize();
            const minute = window.setInterval(schedule, 60_000);
            cleanup = () => {
                cancelAnimationFrame(frame);
                window.clearInterval(minute);
                composer.dispose();
                renderer.dispose();
            };
        })();

        return () => {
            disposed = true;
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll);
            cleanup();
        };
    }, [calidad]);

    useEffect(() => {
        themeRef.current = theme;
        redrawRef.current();
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
        />
    );
};

/** La torre del Humboldt: el mismo patrón de pisos sobre un cilindro, en coordenadas de UV. */
function windowsMaterialSolid(night: { value: number }) {
    const material = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.75 });
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uNight = night;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vTower;')
            .replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\nvTower = vec2(uv.x * 75.0, uv.y * 58.0);',
            );
        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                '#include <common>\nuniform float uNight;\nvarying vec2 vTower;',
            )
            .replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
                vec2 f = fract(vec2(vTower.x / 2.5, vTower.y / 3.6));
                float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.35, f.y) * step(f.y, 0.85) * step(4.0, vTower.y);
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.22, 0.3), win * 0.7 * (1.0 - uNight));
                totalEmissiveRadiance += win * uNight * vec3(1.0, 0.75, 0.45) * 1.4;`,
            );
    };
    return material;
}
