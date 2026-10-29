// Prototipo #40: motor de la Escena WebGL con ogl. Lee el mismo modelo del Viaje de cámara que la
// Escena SVG (camera.ts), así que el traspaso entre las dos no salta.
import { Geometry, Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import {
    cabinPoint,
    cameraHeightAt,
    cloudsAt,
    layerShift,
    toScreen,
    type SceneFrame,
    type Viewport,
} from '../camera';
import { cablePoint } from '../geometry';
import { MOVING_CABINS } from '../parts';

import {
    AGENT_FRAGMENT,
    AGENT_VERTEX,
    FLAT_FRAGMENT,
    FULLSCREEN_VERTEX,
    SCENE_FRAGMENT,
} from './shaders';
import { Street } from './street';
import { layerImages, MACAW_BOX, macawImage, noiseData, type LayerImages } from './textures';

export interface Layout {
    viewport: Viewport;
    frame: SceneFrame;
    sink: number;
    moon: { x: number; y: number } | null;
}

export interface Stats {
    fps: number;
    samples: number[];
    /** ms de GPU por cuadro (solo con ?gputime y EXT_disjoint_timer_query_webgl2). */
    gpu: number[];
    width: number;
    height: number;
    dpr: number;
}

const THEME_SECONDS = 2.4;
const PARALLAX_PX = 14;
const DEPTH = { far: 0.3, avila: 0.5, city: 0.8, street: 1.3 };

// ?strip=STREET,CITY…: apaga secciones del shader para perfilar (solo en el prototipo).
const withDefines = (source: string) => {
    const strip = new URLSearchParams(location.search).get('strip');
    if (!strip) return source;
    const defines = strip.split(',').map((name) => `#define NO_${name}`);
    return source.replace(
        'precision highp float;',
        ['precision highp float;', ...defines].join('\n'),
    );
};

const ease = (t: number) => t * t * (3 - 2 * t);

export class EscenaGL {
    readonly stats: Stats = { fps: 0, samples: [], gpu: [], width: 0, height: 0, dpr: 1 };
    private timer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null = null;
    private queries: WebGLQuery[] = [];
    private renderer: Renderer;
    private gl: Renderer['gl'];
    private scene: Mesh;
    private agents: Mesh;
    private agentGeometry: Geometry;
    private street = new Street();
    private textures: Record<string, Texture> = {};
    private loaded = { day: false, night: false };
    private layout: Layout | null = null;
    private sizeKey = '';
    private night = 0;
    private target = 0;
    private from = 0;
    private themeStart = -1;
    private mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    private raf = 0;
    private last = 0;
    private time = 0;
    private frames = 0;
    private windowStart = 0;
    private running = false;
    private disposed = false;
    onFirstFrame?: () => void;
    private firstFrame = true;

    constructor(
        private canvas: HTMLCanvasElement,
        private dpr: number,
    ) {
        this.renderer = new Renderer({ canvas, webgl: 2, dpr, alpha: false, antialias: false });
        this.renderer.autoClear = false;
        this.gl = this.renderer.gl;
        const gl = this.gl;
        const empty = () => new Texture(gl, { generateMipmaps: false });
        for (const name of [
            'FarD',
            'AvilaD',
            'CityD',
            'TowersD',
            'FarN',
            'AvilaN',
            'CityN',
            'TowersN',
            'CityL',
            'TowersL',
            'Macaw',
        ]) {
            this.textures[name] = empty();
        }
        this.textures.Noise = new Texture(gl, {
            image: noiseData(),
            width: 256,
            height: 256,
            wrapS: gl.REPEAT,
            wrapT: gl.REPEAT,
            generateMipmaps: false,
            flipY: false,
        });
        const sampler = (name: string) => ({ value: this.textures[name] });
        this.scene = new Mesh(gl, {
            geometry: new Triangle(gl),
            program: new Program(gl, {
                vertex: FULLSCREEN_VERTEX,
                // ?gl=flat: shader trivial, para medir el piso del navegador sin la Escena.
                fragment: new URLSearchParams(location.search).has('flat')
                    ? FLAT_FRAGMENT
                    : withDefines(SCENE_FRAGMENT),
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    uRes: { value: [1, 1] },
                    uDpr: { value: dpr },
                    uTime: { value: 0 },
                    uHeight: { value: 0 },
                    uNight: { value: 0 },
                    uDusk: { value: 0 },
                    uShift: { value: [0, 0, 0, 0] },
                    uParallax: { value: [0, 0, 0, 0] },
                    uClouds: { value: [0, 0] },
                    uSkyHigh: { value: 0 },
                    uMoon: { value: [0, 0, 0] },
                    uCabin0: { value: [0, 0, 0] },
                    uCabin1: { value: [0, 0, 0] },
                    uCabin2: { value: [0, 0, 0] },
                    uMacaw: { value: [0, 0, 1, 1] },
                    uFront: { value: 0 },
                    uMist: { value: [0, 1] },
                    uStreet: { value: [1e5, 1] },
                    tFarD: sampler('FarD'),
                    tAvilaD: sampler('AvilaD'),
                    tCityD: sampler('CityD'),
                    tTowersD: sampler('TowersD'),
                    tFarN: sampler('FarN'),
                    tAvilaN: sampler('AvilaN'),
                    tCityN: sampler('CityN'),
                    tTowersN: sampler('TowersN'),
                    tCityL: sampler('CityL'),
                    tTowersL: sampler('TowersL'),
                    tNoise: sampler('Noise'),
                    tMacaw: sampler('Macaw'),
                },
            }),
            frustumCulled: false,
        });

        // Un cuadrado por instancia: x de −0,5 a 0,5 e y de 0 a 1.
        const quad = new Float32Array([-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 0, 0.5, 1, -0.5, 1]);
        this.agentGeometry = new Geometry(gl, {
            position: { size: 2, data: quad },
            aAnchor: { size: 2, instanced: 1, data: this.street.anchor },
            aSize: { size: 2, instanced: 1, data: this.street.size },
            aMeta: { size: 4, instanced: 1, data: this.street.meta },
            aColor: { size: 3, instanced: 1, data: this.street.color },
        });
        const agentProgram = new Program(gl, {
            vertex: AGENT_VERTEX,
            fragment: AGENT_FRAGMENT,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                uRes: { value: [1, 1] },
                uNight: { value: 0 },
                uTime: { value: 0 },
                uShiftX: { value: 0 },
            },
        });
        // Alfa premultiplicado: los cuerpos tapan y las luces (alfa 0) suman.
        agentProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        this.agents = new Mesh(gl, {
            geometry: this.agentGeometry,
            program: agentProgram,
            frustumCulled: false,
        });

        if (new URLSearchParams(location.search).has('gputime')) {
            this.timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
        }
        void macawImage().then((img) => this.setImage('Macaw', img));
        window.addEventListener('pointermove', this.onPointer, { passive: true });
    }

    private readQueries(gl: WebGL2RenderingContext) {
        if (!this.timer) return;
        if (gl.getParameter(this.timer.GPU_DISJOINT_EXT)) {
            this.queries.forEach((q) => gl.deleteQuery(q));
            this.queries = [];
            return;
        }
        while (
            this.queries.length &&
            gl.getQueryParameter(this.queries[0], gl.QUERY_RESULT_AVAILABLE)
        ) {
            const q = this.queries.shift()!;
            this.stats.gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
            if (this.stats.gpu.length > 2000) this.stats.gpu.shift();
            gl.deleteQuery(q);
        }
    }

    private onPointer = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };

    private setImage(name: string, image: HTMLImageElement | undefined, mipmaps = false) {
        if (!image) return;
        const gl = this.gl;
        this.textures[name].image = image;
        this.textures[name].flipY = false;
        this.textures[name].generateMipmaps = mipmaps;
        this.textures[name].minFilter = mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
        this.textures[name].needsUpdate = true;
    }

    private async loadTheme(night: boolean) {
        if (!this.layout) return;
        const { frame, viewport } = this.layout;
        const images: LayerImages = await layerImages(night, frame, viewport, this.dpr);
        if (this.disposed) return;
        const k = night ? 'N' : 'D';
        this.setImage(`Far${k}`, images.far);
        this.setImage(`Avila${k}`, images.avila);
        this.setImage(`City${k}`, images.city);
        this.setImage(`Towers${k}`, images.towers);
        if (night) {
            this.setImage('CityL', images.cityLights, true);
            this.setImage('TowersL', images.towersLights, true);
        }
        this.loaded[night ? 'night' : 'day'] = true;
    }

    setLayout(layout: Layout) {
        this.layout = layout;
        const key = `${layout.viewport.width}x${layout.viewport.height}`;
        if (key === this.sizeKey) return;
        this.sizeKey = key;
        this.renderer.setSize(layout.viewport.width, layout.viewport.height);
        this.stats.width = layout.viewport.width;
        this.stats.height = layout.viewport.height;
        this.stats.dpr = this.dpr;
        const wanted = [
            this.target > 0.5,
            ...(this.loaded.day && this.loaded.night ? [this.target <= 0.5] : []),
        ];
        this.loaded = { day: false, night: false };
        void Promise.all(wanted.map((n) => this.loadTheme(n)));
    }

    /** Cambia de tema; si faltan las capas del otro tema, las rasteriza antes del atardecer. */
    async setNight(night: boolean) {
        const goal = night ? 1 : 0;
        if (goal === this.target) return;
        if (!this.loaded[night ? 'night' : 'day']) await this.loadTheme(night);
        if (this.firstFrame) {
            this.night = this.target = goal;
            return;
        }
        this.from = this.night;
        this.target = goal;
        this.themeStart = this.time;
    }

    /** Fija el tema de entrada sin atardecer. */
    async init(night: boolean) {
        this.night = this.target = night ? 1 : 0;
        await this.loadTheme(night);
    }

    start() {
        if (this.running || this.disposed) return;
        this.running = true;
        this.last = performance.now();
        this.windowStart = this.last;
        this.frames = 0;
        const loop = (now: number) => {
            if (!this.running) return;
            this.frame(now);
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.raf);
    }

    destroy() {
        this.stop();
        this.disposed = true;
        window.removeEventListener('pointermove', this.onPointer);
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    private frame(now: number) {
        const dt = Math.min(0.1, (now - this.last) / 1000);
        this.last = now;
        this.time += dt;
        this.frames++;
        if (now - this.windowStart >= 500) {
            this.stats.fps = (this.frames * 1000) / (now - this.windowStart);
            this.stats.samples.push(this.stats.fps);
            if (this.stats.samples.length > 600) this.stats.samples.shift();
            this.frames = 0;
            this.windowStart = now;
        }
        const layout = this.layout;
        if (!layout || !(this.loaded.day || this.loaded.night)) return;
        const { viewport, frame, sink, moon } = layout;
        const vh = viewport.height;

        if (this.themeStart >= 0) {
            const t = Math.min(1, (this.time - this.themeStart) / THEME_SECONDS);
            this.night = this.from + (this.target - this.from) * ease(t);
            if (t >= 1) this.themeStart = -1;
        }
        const dusk = Math.min(1, 4 * this.night * (1 - this.night) * 1.15);

        const m = this.mouse;
        m.x += (m.tx - m.x) * Math.min(1, dt * 3);
        m.y += (m.ty - m.y) * Math.min(1, dt * 3);
        const par = (depth: number) => -m.x * PARALLAX_PX * depth;

        const doc = document.documentElement;
        const progress = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
        const height = cameraHeightAt(progress);
        const shift = {
            far: layerShift('farRidge', height, vh, sink),
            avila: layerShift('avila', height, vh, sink),
            city: layerShift('city', height, vh, sink),
            towers: layerShift('towers', height, vh, sink),
        };
        const clouds = cloudsAt(height, vh);

        // La Avenida Bolívar entra desde abajo en el último tramo y el paisaje sube con ella,
        // como si la cabina llegara al nivel de la calle: así la ciudad queda apoyada en la acera.
        const streetH = Math.max(90, Math.min(150, 0.14 * vh));
        const streetIn = ease(Math.max(0, Math.min(1, 1 - height / 0.2)));
        const streetTop = vh - streetH * 0.95 * streetIn;
        const lift = (vh - streetTop) * 0.92;

        const cabins = new Float32Array(9);
        const cabinAt = (i: number, point: { x: number; y: number }) => {
            const s = toScreen(frame, point.x, point.y);
            cabins.set(
                [s.x + par(DEPTH.avila), s.y + shift.avila - lift * 0.75, frame.scale],
                i * 3,
            );
        };
        MOVING_CABINS.forEach(({ from, to }, i) => {
            const k = 0.5 - 0.5 * Math.cos((this.time / 26) * Math.PI * 2 + i * 1.7);
            cabinAt(i, cablePoint(from + (to - from) * k));
        });
        cabinAt(2, cabinPoint(height));

        // Las guacamayas planean en su lugar de la Escena SVG, fuera de la franja del Hero.
        const macaw = toScreen(frame, MACAW_BOX.x, MACAW_BOX.y);
        const macawW = MACAW_BOX.width * frame.scale;
        const macawX = macaw.x + Math.sin(this.time * 0.23) * 36 + par(0.15);
        const macawY = macaw.y + Math.sin(this.time * 0.6) * 9;

        const u = this.scene.program.uniforms;
        u.uRes.value = [viewport.width, vh];
        u.uTime.value = this.time;
        u.uHeight.value = height;
        u.uNight.value = this.night;
        u.uDusk.value = dusk;
        u.uShift.value = [
            shift.far - lift * 0.55,
            shift.avila - lift * 0.75,
            shift.city - lift,
            shift.towers - lift,
        ];
        u.uParallax.value = [par(DEPTH.far), par(DEPTH.avila), par(DEPTH.city), par(DEPTH.street)];
        u.uClouds.value = [clouds.y, clouds.opacity];
        u.uSkyHigh.value = height * 0.3;
        u.uMoon.value = moon ? [moon.x, moon.y, 26] : [0, 0, 0];
        u.uCabin0.value = cabins.slice(0, 3);
        u.uCabin1.value = cabins.slice(3, 6);
        u.uCabin2.value = cabins.slice(6, 9);
        u.uMacaw.value = [macawX, macawY, macawW, MACAW_BOX.height * frame.scale];
        u.uFront.value = 0.9 * Math.exp(-Math.pow((height - 0.6) / 0.11, 2));
        u.uMist.value = [toScreen(frame, 0, 560).y - lift * 0.65, 42 * frame.scale];
        u.uStreet.value = [streetTop, streetH];

        const gl2 = this.gl as unknown as WebGL2RenderingContext;
        const query = this.timer ? gl2.createQuery() : null;
        if (query && this.timer) gl2.beginQuery(this.timer.TIME_ELAPSED_EXT, query);
        this.renderer.render({ scene: this.scene, clear: true });

        if (streetTop < vh) {
            this.street.step(dt, viewport.width, streetH);
            this.street.write(streetTop, streetH, viewport.width, this.night, this.time);
            for (const a of ['aAnchor', 'aSize', 'aMeta', 'aColor']) {
                this.agentGeometry.attributes[a].needsUpdate = true;
            }
            const au = this.agents.program.uniforms;
            au.uRes.value = [viewport.width, vh];
            au.uNight.value = this.night;
            au.uTime.value = this.time;
            au.uShiftX.value = par(DEPTH.street);
            this.agentGeometry.setInstancedCount(this.street.count || 1);
            if (this.street.count) this.renderer.render({ scene: this.agents, clear: false });
        }
        if (query && this.timer) {
            gl2.endQuery(this.timer.TIME_ELAPSED_EXT);
            this.queries.push(query);
        }
        this.readQueries(gl2);

        if (this.firstFrame) {
            this.firstFrame = false;
            this.onFirstFrame?.();
        }
    }
}
