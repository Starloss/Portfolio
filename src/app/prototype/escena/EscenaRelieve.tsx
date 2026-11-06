import React, { useEffect, useRef } from 'react';
import {
    Box,
    Camera,
    Geometry,
    Mat4,
    Mesh,
    Program,
    Renderer,
    Transform,
    Triangle,
    Vec3,
} from 'ogl';
import { caracasNow } from '@lib/clima';
import { useTheme } from '@lib/theme';

import { sky } from '../../scene/sky';

// PROTOTIPO (research/impeccable, mapa #104, ticket "Prototipo de la nueva Escena"). El Ávila en 3D
// desde el relieve real (SRTM, horneado por scripts/prototype-relieve.ts), iluminado por el sol o la
// luna de la hora real de Caracas, con un cielo analítico, bruma por distancia y las luces de la
// ciudad de Noche. La cámara baja del Humboldt a la ciudad con el scroll, como el Viaje de cámara.

interface Meta {
    rows: number;
    cols: number;
    north: number;
    south: number;
    west: number;
    east: number;
}

const ORIGIN = { lat: 10.5, lon: -66.9 };
const M_PER_LAT = 110574;
const M_PER_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const EXAGGERATION = 1.1;

/** Metros al este (x) y al sur (z) del origen. */
const toXZ = (lat: number, lon: number) => [
    (lon - ORIGIN.lon) * M_PER_LON,
    -(lat - ORIGIN.lat) * M_PER_LAT,
];

const HITOS = {
    humboldt: { lat: 10.5414, lon: -66.8764 },
    upperStation: { lat: 10.5402, lon: -66.8766 },
    lowerStation: { lat: 10.5082, lon: -66.8798 },
    parqueCentral: { lat: 10.4986, lon: -66.901 },
    proceres: { lat: 10.4745, lon: -66.9065 },
};

const TERRAIN_VERTEX = /* glsl */ `#version 300 es
in vec3 position;
in vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
out vec3 vWorld;
out vec3 vNormal;
void main() {
    vWorld = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const LIGHTING = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform vec3 uFog;
uniform vec3 uCamera;
uniform float uNight;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.1) + 0.15 * vnoise(p * 4.3); }
// Tone mapping (ACES, aproximación de Narkowicz): la luz del sol no satura a blanco.
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 shade(vec3 albedo, vec3 n, vec3 world) {
    float sun = max(dot(n, uSunDir), 0.0);
    float sky = 0.5 + 0.5 * n.y;
    return albedo * (uSunColor * sun + uAmbient * sky);
}
vec3 aerial(vec3 color, vec3 world) {
    float d = length(world - uCamera);
    float haze = 1.0 - exp(-d / 14000.0);
    float low = exp(-max(world.y, 0.0) / 1400.0);
    return aces(mix(color, uFog, clamp(haze * (0.55 + 0.45 * low), 0.0, 0.92)));
}`;

const TERRAIN_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
${LIGHTING}
out vec4 outColor;
void main() {
    vec3 n = normalize(vNormal);
    float h = vWorld.y / ${EXAGGERATION.toFixed(2)};
    float slope = 1.0 - n.y;
    vec3 forest = mix(vec3(0.1, 0.2, 0.08), vec3(0.22, 0.33, 0.13), fbm(vWorld.xz / 420.0));
    vec3 paramo = vec3(0.42, 0.45, 0.26);
    vec3 rock = vec3(0.42, 0.39, 0.34);
    vec3 city = mix(vec3(0.34, 0.33, 0.31), vec3(0.55, 0.49, 0.42), hash(floor(vWorld.xz / 45.0)));
    vec2 street = step(fract(vWorld.xz / 110.0), vec2(0.08));
    city = mix(city, vec3(0.2, 0.2, 0.21), max(street.x, street.y));
    city = mix(city, forest, step(0.72, fbm(vWorld.xz / 260.0)));
    vec3 albedo = mix(forest, paramo, smoothstep(1700.0, 2300.0, h));
    albedo = mix(albedo, rock, smoothstep(0.55, 0.8, slope));
    float urban = (1.0 - smoothstep(980.0, 1150.0, h)) * (1.0 - smoothstep(0.12, 0.3, slope));
    albedo = mix(albedo, city, urban * step(5.0, h));
    vec3 color = shade(albedo, n, vWorld);
    if (h < 2.0) {
        vec3 sea = vec3(0.06, 0.2, 0.32);
        vec3 v = normalize(uCamera - vWorld);
        float spec = pow(max(dot(reflect(-uSunDir, vec3(0, 1, 0)), v), 0.0), 60.0);
        color = sea * (uAmbient + uSunColor * 0.4) + uSunColor * spec;
    }
    // De Noche, la ciudad: ventanas y faroles dispersos en el valle.
    vec2 cell = floor(vWorld.xz / 16.0);
    float spot = 1.0 - smoothstep(0.08, 0.2, length(fract(vWorld.xz / 16.0) - 0.5));
    float lit = step(0.78, hash(cell)) * spot * urban * uNight;
    color += lit * vec3(1.0, 0.72, 0.38) * (1.2 + hash(cell + 3.1));
    outColor = vec4(aerial(color, vWorld), 1.0);
}`;

const SOLID_VERTEX = /* glsl */ `#version 300 es
in vec3 position;
in vec3 normal;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = mat3(modelMatrix) * normal;
    vLocal = position;
    gl_Position = projectionMatrix * viewMatrix * world;
}`;

const SOLID_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
uniform vec3 uColor;
uniform vec2 uFloors;
${LIGHTING}
out vec4 outColor;
void main() {
    vec3 color = shade(uColor, normalize(vNormal), vWorld);
    // Pisos y ventanas: franjas horizontales que de Noche se encienden.
    float band = step(0.55, fract((vLocal.y + 0.5) * uFloors.x));
    float win = band * step(0.3, fract((vLocal.x + vLocal.z) * uFloors.y));
    color = mix(color, color * 0.75, band * (1.0 - uNight));
    color += win * uNight * vec3(1.0, 0.78, 0.45) * 0.9;
    outColor = vec4(aerial(color, vWorld), 1.0);
}`;

const SKY_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
out vec2 vClip;
void main() { vClip = position; gl_Position = vec4(position, 0.999, 1.0); }`;

const SKY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vClip;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform float uNight;
out vec4 outColor;
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
    vec4 view = uInvProj * vec4(vClip, 1.0, 1.0);
    vec3 dir = normalize(mat3(uCamWorld) * (view.xyz / view.w));
    float up = clamp(dir.y, 0.0, 1.0);
    vec3 color = mix(uHorizon, uZenith, pow(up, 0.55));
    float s = max(dot(dir, uSunDir), 0.0);
    color += uSunColor * (pow(s, 8.0) * 0.35 + pow(s, 900.0) * 6.0);
    float m = max(dot(dir, uMoonDir), 0.0);
    color += vec3(0.9, 0.92, 1.0) * smoothstep(0.99985, 0.99992, m) * uNight;
    color += vec3(0.6, 0.65, 0.8) * pow(m, 60.0) * 0.15 * uNight;
    float star = step(0.9985, hash(floor(dir * 420.0))) * smoothstep(0.02, 0.2, dir.y);
    color += star * uNight * 0.8;
    outColor = vec4(color, 1.0);
}`;

type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, t: number): V3 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];
const hex = (h: string): V3 => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as V3;

/** El color del cielo, del sol y del ambiente según la altura del sol, en grados. */
function lightFor(sunAlt: number, night: boolean) {
    const stops: { alt: number; zenith: V3; horizon: V3; sun: V3; ambient: V3 }[] = [
        {
            alt: -12,
            zenith: hex('#03081a'),
            horizon: hex('#0d1838'),
            sun: [0, 0, 0],
            ambient: hex('#1a2550'),
        },
        {
            alt: -4,
            zenith: hex('#1b2556'),
            horizon: hex('#b0677a'),
            sun: [0.25, 0.12, 0.1],
            ambient: hex('#4a3f6e'),
        },
        {
            alt: 3,
            zenith: hex('#35538f'),
            horizon: hex('#f3a36b'),
            sun: [1.3, 0.7, 0.4],
            ambient: hex('#7a6f8a'),
        },
        {
            alt: 12,
            zenith: hex('#2f67b0'),
            horizon: hex('#cfd9e2'),
            sun: [1.35, 1.15, 0.9],
            ambient: hex('#8aa0bd'),
        },
        {
            alt: 45,
            zenith: hex('#2a62b6'),
            horizon: hex('#b9d3ea'),
            sun: [1.45, 1.38, 1.25],
            ambient: hex('#9ab4d4'),
        },
    ];
    // Si el visitante eligió un estado que no es el de la hora, se fija la luz de ese estado.
    const alt = night ? Math.min(sunAlt, -14) : sunAlt >= -1 ? sunAlt : 25;
    let i = 0;
    while (i < stops.length - 2 && alt > stops[i + 1].alt) i++;
    const a = stops[i];
    const b = stops[i + 1];
    const t = Math.min(1, Math.max(0, (alt - a.alt) / (b.alt - a.alt)));
    return {
        zenith: mix3(a.zenith, b.zenith, t),
        horizon: mix3(a.horizon, b.horizon, t),
        sun: mix3(a.sun, b.sun, t),
        ambient: mix3(a.ambient, b.ambient, t),
    };
}

/** Dirección hacia un astro desde su altura y su ángulo horario (aprox. para Caracas). */
function direction(alt: number, hour: number): V3 {
    const az = ((180 + hour) * Math.PI) / 180;
    const el = (alt * Math.PI) / 180;
    return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
}

function buildTerrain(meta: Meta, heights: Uint16Array) {
    const { rows, cols } = meta;
    const position = new Float32Array(rows * cols * 3);
    const normal = new Float32Array(rows * cols * 3);
    const [x0, z0] = toXZ(meta.north, meta.west);
    const [x1, z1] = toXZ(meta.south, meta.east);
    const dx = (x1 - x0) / (cols - 1);
    const dz = (z1 - z0) / (rows - 1);
    const h = (r: number, c: number) =>
        heights[Math.min(rows - 1, Math.max(0, r)) * cols + Math.min(cols - 1, Math.max(0, c))] *
        EXAGGERATION;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const i = (r * cols + c) * 3;
            position[i] = x0 + c * dx;
            position[i + 1] = h(r, c);
            position[i + 2] = z0 + r * dz;
            const nx = (h(r, c - 1) - h(r, c + 1)) / (2 * dx);
            const nz = (h(r - 1, c) - h(r + 1, c)) / (2 * dz);
            const len = Math.hypot(nx, 1, nz);
            normal[i] = nx / len;
            normal[i + 1] = 1 / len;
            normal[i + 2] = nz / len;
        }
    const index = new Uint32Array((rows - 1) * (cols - 1) * 6);
    let k = 0;
    for (let r = 0; r < rows - 1; r++)
        for (let c = 0; c < cols - 1; c++) {
            const a = r * cols + c;
            index.set([a, a + cols, a + 1, a + 1, a + cols, a + cols + 1], k);
            k += 6;
        }
    const heightAt = (lat: number, lon: number) => {
        const r = Math.round(((meta.north - lat) / (meta.north - meta.south)) * (rows - 1));
        const c = Math.round(((lon - meta.west) / (meta.east - meta.west)) * (cols - 1));
        return h(r, c);
    };
    return { position, normal, index, heightAt };
}

export const EscenaRelieve: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();
    const themeRef = useRef(theme);
    const redrawRef = useRef<() => void>(() => {});
    const resizeRef = useRef<() => void>(() => {});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let disposed = false;
        // Los listeners se registran aquí y llaman a lo que monte la carga asíncrona.
        const onResize = () => resizeRef.current();
        const onScroll = () => redrawRef.current();
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, { passive: true });
        let cleanup = () => {};

        (async () => {
            const [meta, buffer] = await Promise.all([
                fetch('/prototype/relieve/meta.json').then((r) => r.json() as Promise<Meta>),
                fetch('/prototype/relieve/altura.bin').then((r) => r.arrayBuffer()),
            ]);
            if (disposed) return;
            const renderer = new Renderer({
                canvas,
                dpr: Math.min(window.devicePixelRatio, 1.5),
                antialias: true,
            });
            const gl = renderer.gl;
            const camera = new Camera(gl, { fov: 34, near: 30, far: 60000 });
            const scene = new Transform();
            const terrain = buildTerrain(meta, new Uint16Array(buffer));

            const lighting = {
                uSunDir: { value: new Vec3(0, 1, 0) },
                uSunColor: { value: new Vec3(1, 1, 1) },
                uAmbient: { value: new Vec3(0.5, 0.5, 0.6) },
                uFog: { value: new Vec3(0.7, 0.8, 0.9) },
                uCamera: { value: new Vec3() },
                uNight: { value: 0 },
            };

            const skyProgram = new Program(gl, {
                vertex: SKY_VERTEX,
                fragment: SKY_FRAGMENT,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    uInvProj: { value: new Mat4() },
                    uCamWorld: { value: new Mat4() },
                    uSunDir: lighting.uSunDir,
                    uMoonDir: { value: new Vec3(0, 1, 0) },
                    uZenith: { value: new Vec3() },
                    uHorizon: { value: new Vec3() },
                    uSunColor: lighting.uSunColor,
                    uNight: lighting.uNight,
                },
            });
            const skyMesh = new Mesh(gl, {
                geometry: new Triangle(gl),
                program: skyProgram,
                frustumCulled: false,
            });

            new Mesh(gl, {
                geometry: new Geometry(gl, {
                    position: { size: 3, data: terrain.position },
                    normal: { size: 3, data: terrain.normal },
                    index: { data: terrain.index },
                }),
                program: new Program(gl, {
                    vertex: TERRAIN_VERTEX,
                    fragment: TERRAIN_FRAGMENT,
                    uniforms: lighting,
                }),
                frustumCulled: false,
            }).setParent(scene);

            const building = (
                lat: number,
                lon: number,
                size: V3,
                color: V3,
                floors: [number, number],
            ) => {
                const [x, z] = toXZ(lat, lon);
                const mesh = new Mesh(gl, {
                    geometry: new Box(gl),
                    program: new Program(gl, {
                        vertex: SOLID_VERTEX,
                        fragment: SOLID_FRAGMENT,
                        uniforms: {
                            ...lighting,
                            uColor: { value: new Vec3(...color) },
                            uFloors: { value: floors },
                        },
                    }),
                });
                mesh.scale.set(...size);
                mesh.position.set(x, terrain.heightAt(lat, lon) + size[1] / 2 - 4, z);
                mesh.setParent(scene);
                return mesh;
            };

            // Los Hitos en sus coordenadas reales.
            building(
                HITOS.humboldt.lat,
                HITOS.humboldt.lon,
                [34, 62, 34],
                [0.93, 0.93, 0.9],
                [14, 0.18],
            );
            for (const offset of [-0.0006, 0.0006])
                building(
                    HITOS.parqueCentral.lat,
                    HITOS.parqueCentral.lon + offset,
                    [42, 225, 42],
                    [0.82, 0.8, 0.76],
                    [56, 0.15],
                );

            // El cable del Teleférico, de la estación de Maripérez a la de El Ávila.
            const [lx, lz] = toXZ(HITOS.lowerStation.lat, HITOS.lowerStation.lon);
            const [ux, uz] = toXZ(HITOS.upperStation.lat, HITOS.upperStation.lon);
            const ly = terrain.heightAt(HITOS.lowerStation.lat, HITOS.lowerStation.lon) + 25;
            const uy = terrain.heightAt(HITOS.upperStation.lat, HITOS.upperStation.lon) + 25;
            const cable = new Mesh(gl, {
                mode: gl.LINES,
                geometry: new Geometry(gl, {
                    position: { size: 3, data: new Float32Array([lx, ly, lz, ux, uy, uz]) },
                    normal: { size: 3, data: new Float32Array([0, 1, 0, 0, 1, 0]) },
                }),
                program: new Program(gl, {
                    vertex: SOLID_VERTEX,
                    fragment: SOLID_FRAGMENT,
                    uniforms: {
                        ...lighting,
                        uColor: { value: new Vec3(0.12, 0.12, 0.14) },
                        uFloors: { value: [0, 0] },
                    },
                }),
            });
            cable.setParent(scene);

            // El Viaje de cámara: de frente al Humboldt, a su altura, hasta la ciudad.
            const [hx, hz] = toXZ(HITOS.humboldt.lat, HITOS.humboldt.lon);
            const hy = terrain.heightAt(HITOS.humboldt.lat, HITOS.humboldt.lon);
            const [px, pz] = toXZ(HITOS.proceres.lat, HITOS.proceres.lon);
            const py = terrain.heightAt(HITOS.proceres.lat, HITOS.proceres.lon);
            const start = {
                eye: [hx - 1100, hy + 260, hz + 3300] as V3,
                at: [hx, hy - 120, hz] as V3,
            };
            const end = { eye: [px, py + 140, pz] as V3, at: [hx + 400, hy - 700, hz] as V3 };

            const invProj = new Mat4();
            const draw = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
                const ease = p * p * (3 - 2 * p);
                const eye = mix3(start.eye, end.eye, ease);
                const at = mix3(start.at, end.at, ease);
                camera.position.set(...eye);
                camera.lookAt(at);
                camera.updateMatrixWorld();
                lighting.uCamera.value.set(...eye);

                const { sun, moon } = sky(caracasNow());
                const night = themeRef.current === 'dark';
                const light = lightFor(sun.alt, night);
                const sunDir = night
                    ? direction(Math.max(moon.alt, 25), moon.hour)
                    : direction(Math.max(sun.alt, 4), sun.hour);
                lighting.uSunDir.value.set(...sunDir).normalize();
                lighting.uSunColor.value.set(...(night ? ([0.22, 0.26, 0.38] as V3) : light.sun));
                lighting.uAmbient.value.set(...light.ambient);
                lighting.uFog.value.set(...light.horizon);
                lighting.uNight.value = night ? 1 : 0;
                skyProgram.uniforms.uZenith.value.set(...light.zenith);
                skyProgram.uniforms.uHorizon.value.set(...light.horizon);
                skyProgram.uniforms.uMoonDir.value
                    .set(...direction(moon.alt, moon.hour))
                    .normalize();
                skyProgram.uniforms.uInvProj.value.copy(
                    invProj.copy(camera.projectionMatrix).inverse(),
                );
                skyProgram.uniforms.uCamWorld.value.copy(camera.worldMatrix);

                gl.clearColor(0, 0, 0, 1);
                renderer.render({ scene: skyMesh, camera });
                renderer.autoClear = false;
                renderer.render({ scene, camera });
                renderer.autoClear = true;
            };

            let frame = 0;
            const schedule = () => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(draw);
            };
            const resize = () => {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.perspective({ aspect: window.innerWidth / window.innerHeight });
                schedule();
            };
            redrawRef.current = schedule;
            resizeRef.current = resize;
            resize();
            const minute = window.setInterval(schedule, 60_000);
            cleanup = () => {
                cancelAnimationFrame(frame);
                window.clearInterval(minute);
                gl.getExtension('WEBGL_lose_context')?.loseContext();
            };
        })();

        return () => {
            disposed = true;
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll);
            cleanup();
        };
    }, []);

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
