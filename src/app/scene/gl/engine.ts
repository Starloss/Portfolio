// Adaptador delgado sobre ogl (ADR 0003): sube las texturas, fija los uniforms que calcula
// frame.ts y dibuja las capas en orden. La lógica vive en frame.ts y watchdog.ts, con tests; esto
// se prueba con Playwright.
import { Geometry, Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import type { SceneFrame, Viewport } from '../camera';

import { readClocks } from './clocks';
import { isSoftwareGpu, rendererName } from './detect';
import { cssEase, escenaFrame, type Clocks } from './frame';
import {
    CLOUDS_FRAGMENT,
    FULLSCREEN_VERTEX,
    LAYER_FRAGMENT,
    MOON_FRAGMENT,
    SKY_FRAGMENT,
    SPRITE_FRAGMENT,
    SPRITE_VERTEX,
} from './shaders';
import { themeLayers, type LayerName } from './textures';

export interface Layout {
    viewport: Viewport;
    frame: SceneFrame;
    sink: number;
    moon: { x: number; y: number } | null;
}

type Theme = 'day' | 'night';
type Uniforms = Record<string, { value: unknown }>;
/** Un pase: su malla (con un programa compartido) y los uniforms que no cambian entre cuadros. */
interface PassSpec {
    mesh: Mesh;
    fixed: Record<string, unknown>;
}

// Las capas, de atrás hacia adelante, en el mismo orden que las de la Escena SVG.
const ORDER = [
    'sky',
    'stars',
    'moon',
    'macaws',
    'clouds',
    'far',
    'avilaBack',
    'cabin0',
    'cabin1',
    'avilaFront',
    'visitor',
    'city',
    'towers',
] as const;
type Pass = (typeof ORDER)[number];

// El mismo cambio de colores que la SVG (transition: 0.6s ease).
const THEME_SECONDS = 0.6;
const MOON_RADIUS = 26;
const STILL: Clocks = { cabins: 0, macaws: 0, drift: 0, twinkle: 0 };
const SOFTWARE_DPR = 0.5;

export class EscenaGL {
    onFirstFrame?: () => void;
    /** Cada cuadro dibujado, con su hora: lo usa el vigilante de FPS. */
    onFrame?: (now: number) => void;
    /** Se perdió el contexto o no se pudieron preparar las texturas: hay que volver a la SVG. */
    onFailed?: (reason: 'context-lost' | 'init-failed') => void;

    private renderer: Renderer;
    private gl: Renderer['gl'];
    private textures = new Map<string, Texture>();
    private passes: Record<Pass, PassSpec>;
    private layout: Layout | null = null;
    private sizeKey = '';
    // Cada cambio de tamaño es una generación nueva de texturas. Mientras se rasterizan, se sigue
    // dibujando con las anteriores (estiradas) en vez de dejar el canvas vacío.
    private generation = 0;
    private ready: Record<Theme, number> = { day: -1, night: -1 };
    private pending: Partial<Record<Theme, { generation: number; promise: Promise<void> }>> = {};
    private wanted = 0;
    private night = 0;
    private target = 0;
    private themeFrom = 0;
    private themeStart = -1;
    private raf = 0;
    private running = false;
    private disposed = false;
    private drawn = false;
    // Con una GPU por software (solo forzada, en CI), cada cuadro bloquea el hilo principal unos
    // 100 ms: entonces dibuja solo cuando algo cambia (scroll, tamaño, tema, texturas), con las
    // animaciones quietas como con reduced-motion y a media resolución.
    private onDemand: boolean;
    private dirty = true;
    // Subir una textura SVG la rasteriza en el hilo principal: se sube una por cuadro, para que
    // ninguna tarea se alargue.
    private uploads: Array<{
        theme: Theme;
        generation: number;
        texture: Texture;
        image: HTMLImageElement;
    }> = [];

    constructor(
        private canvas: HTMLCanvasElement,
        private dpr: number,
    ) {
        this.renderer = new Renderer({ canvas, webgl: 2, dpr, alpha: false, antialias: false });
        if (!this.renderer.isWebgl2) throw new Error('Sin WebGL2');
        this.renderer.autoClear = false;
        this.gl = this.renderer.gl;
        this.onDemand = isSoftwareGpu(rendererName(this.gl as unknown as WebGL2RenderingContext));
        if (this.onDemand) this.dpr = this.renderer.dpr = SOFTWARE_DPR;
        canvas.addEventListener('webglcontextlost', this.onContextLost);
        if (this.onDemand) window.addEventListener('scroll', this.markDirty, { passive: true });
        this.passes = this.build();
    }

    private markDirty = () => {
        this.dirty = true;
    };

    private texture(name: string): Texture {
        let t = this.textures.get(name);
        if (!t) {
            t = new Texture(this.gl, {
                generateMipmaps: false,
                premultiplyAlpha: true,
                flipY: false,
            });
            this.textures.set(name, t);
        }
        return t;
    }

    private program(vertex: string, fragment: string, uniforms: Uniforms = {}) {
        const program = new Program(this.gl, {
            vertex,
            fragment,
            uniforms: {
                uRes: { value: [1, 1] },
                uDpr: { value: this.dpr },
                uNight: { value: 0 },
                ...uniforms,
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            // Los sprites van en px con y hacia abajo: quedan de espaldas y no hay que descartarlos.
            cullFace: false,
        });
        program.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        return program;
    }

    // Cinco programas para trece pases: compilar shaders es lo más caro del arranque (con una GPU
    // por software, cientos de ms). Cada pase fija sus uniforms justo antes de dibujarse.
    private build(): Record<Pass, PassSpec> {
        const gl = this.gl;
        const fullscreen = new Triangle(gl);
        const quad = new Geometry(gl, {
            position: { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]) },
        });
        const textures = { tDay: { value: null }, tNight: { value: null } };
        const sky = this.program(FULLSCREEN_VERTEX, SKY_FRAGMENT, { uSkyHigh: { value: 0 } });
        const moon = this.program(FULLSCREEN_VERTEX, MOON_FRAGMENT, {
            uMoon: { value: [0, 0, 0] },
        });
        const clouds = this.program(FULLSCREEN_VERTEX, CLOUDS_FRAGMENT, {
            uOpacity: { value: 0 },
            uCloud0: { value: [0, 0, 1, 1] },
            uCloud1: { value: [0, 0, 1, 1] },
            uCloud2: { value: [0, 0, 1, 1] },
        });
        const layer = this.program(FULLSCREEN_VERTEX, LAYER_FRAGMENT, {
            ...textures,
            uOffset: { value: [0, 0] },
            uOpacity: { value: 1 },
            uTwinkle: { value: -1 },
        });
        const sprite = this.program(SPRITE_VERTEX, SPRITE_FRAGMENT, {
            ...textures,
            uRect: { value: [0, 0, 0, 0] },
        });
        const pass = (geometry: Geometry, program: Program, fixed: PassSpec['fixed'] = {}) => ({
            mesh: new Mesh(gl, { geometry, program, frustumCulled: false }),
            fixed,
        });
        // Una capa rasterizada; las de un solo tema usan la misma textura de los dos lados.
        const still = { uOffset: [0, 0], uOpacity: 1, uTwinkle: -1 };
        const tex = (day: string, night: string) => ({
            tDay: this.texture(day),
            tNight: this.texture(night),
        });
        const both = (name: LayerName) =>
            pass(fullscreen, layer, { ...still, ...tex(`${name}:day`, `${name}:night`) });
        const cabin = () => pass(quad, sprite, tex('cabin:day', 'cabin:night'));
        return {
            sky: pass(fullscreen, sky),
            stars: pass(fullscreen, layer, { ...still, ...tex('stars:night', 'stars:night') }),
            moon: pass(fullscreen, moon),
            macaws: pass(fullscreen, layer, { ...still, ...tex('macaws:day', 'macaws:day') }),
            clouds: pass(fullscreen, clouds),
            far: both('far'),
            avilaBack: both('avilaBack'),
            cabin0: cabin(),
            cabin1: cabin(),
            avilaFront: both('avilaFront'),
            visitor: cabin(),
            city: both('city'),
            towers: both('towers'),
        };
    }

    private onContextLost = (event: Event) => {
        event.preventDefault();
        this.stop();
        this.onFailed?.('context-lost');
    };

    /** Rasteriza y sube las capas de un tema para el tamaño actual; una sola vez por generación. */
    private load(theme: Theme): Promise<void> {
        const layout = this.layout;
        const generation = this.generation;
        if (!layout || this.ready[theme] === generation) return Promise.resolve();
        const pending = this.pending[theme];
        if (pending?.generation === generation) return pending.promise;
        const promise = themeLayers(theme === 'night', layout.frame, layout.viewport, this.dpr)
            .then((images) => {
                // Si la pantalla cambió de tamaño mientras tanto, ya viene otra generación.
                if (this.disposed || generation !== this.generation) return;
                for (const [name, image] of Object.entries(images)) {
                    this.uploads.push({
                        theme,
                        generation,
                        texture: this.texture(`${name}:${theme}`),
                        image,
                    });
                }
            })
            .catch(() => {
                if (this.disposed) return;
                this.stop();
                this.onFailed?.('init-failed');
            })
            .finally(() => {
                if (this.pending[theme]?.promise === promise) delete this.pending[theme];
            });
        this.pending[theme] = { generation, promise };
        return promise;
    }

    private get theme(): Theme {
        return this.target > 0.5 ? 'night' : 'day';
    }

    setLayout(layout: Layout) {
        this.layout = layout;
        const key = `${layout.viewport.width}x${layout.viewport.height}`;
        if (key === this.sizeKey) return;
        this.sizeKey = key;
        this.generation++;
        this.dirty = true;
        this.renderer.setSize(layout.viewport.width, layout.viewport.height);
        const current = this.theme;
        const other: Theme = current === 'night' ? 'day' : 'night';
        void this.load(current).then(() => {
            if (this.ready[other] >= 0) void this.load(other);
        });
    }

    /** Cambia de tema: de entrada, sin transición; después, con el mismo fundido que la SVG. */
    async setNight(night: boolean) {
        const goal = night ? 1 : 0;
        this.wanted = goal;
        if (!this.drawn) {
            this.night = this.target = goal;
            return this.load(this.theme);
        }
        if (goal === this.target) return;
        await this.load(night ? 'night' : 'day');
        // Si mientras se preparaba el tema se pidió el otro, manda el último pedido.
        if (this.wanted !== goal || this.disposed) return;
        this.themeFrom = this.night;
        this.target = goal;
        this.themeStart = performance.now();
    }

    start() {
        if (this.running || this.disposed) return;
        this.running = true;
        const loop = (now: number) => {
            if (!this.running) return;
            this.upload();
            this.draw(now);
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    /** Sube la próxima textura en cola; el tema queda listo cuando subió todas las suyas. */
    private upload() {
        const next = this.uploads.shift();
        if (!next) return;
        const { theme, generation, texture, image } = next;
        if (generation !== this.generation) return;
        texture.image = image;
        texture.needsUpdate = true;
        texture.update();
        if (!this.uploads.some((u) => u.theme === theme && u.generation === generation)) {
            this.ready[theme] = generation;
            this.dirty = true;
        }
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.raf);
    }

    destroy() {
        this.stop();
        this.disposed = true;
        this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
        window.removeEventListener('scroll', this.markDirty);
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    private draw(now: number) {
        const layout = this.layout;
        if (!layout || this.ready[this.theme] < 0) return;
        if (this.onDemand && !this.dirty && this.themeStart < 0) return;
        this.dirty = false;
        const { viewport, frame, sink, moon } = layout;

        if (this.themeStart >= 0) {
            const t = Math.min(1, (now - this.themeStart) / 1000 / THEME_SECONDS);
            this.night = this.themeFrom + (this.target - this.themeFrom) * cssEase(t);
            if (t >= 1) this.themeStart = -1;
        }
        const doc = document.documentElement;
        const f = escenaFrame({
            progress: window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight),
            sink,
            viewport,
            frame,
            clocks: this.onDemand ? STILL : readClocks(now / 1000),
            units: { vw: window.innerWidth / 100, vh: window.innerHeight / 100 },
        });

        const rect = (r: { x: number; y: number; width: number; height: number }) => [
            r.x,
            r.y,
            r.width,
            r.height,
        ];
        const values: Record<Pass, Record<string, unknown>> = {
            sky: { uSkyHigh: f.skyHigh },
            stars: { uOpacity: this.night, uTwinkle: f.twinkle },
            moon: { uMoon: moon ? [moon.x, moon.y, MOON_RADIUS] : [0, 0, 0] },
            macaws: { uOffset: [f.macaws.x, f.macaws.y], uOpacity: 1 - this.night },
            clouds: {
                uOpacity: f.cloudsOpacity,
                ...Object.fromEntries(
                    f.clouds.map((c, i) => [`uCloud${i}`, [c.x, c.y, c.rx, c.ry]]),
                ),
            },
            far: { uOffset: [0, f.shifts.farRidge] },
            avilaBack: { uOffset: [0, f.shifts.avila] },
            cabin0: { uRect: rect(f.cabins[0]) },
            cabin1: { uRect: rect(f.cabins[1]) },
            avilaFront: { uOffset: [0, f.shifts.avila] },
            visitor: { uRect: rect(f.cabins[2]) },
            city: { uOffset: [0, f.shifts.city] },
            towers: { uOffset: [0, f.shifts.towers] },
        };
        ORDER.forEach((pass, i) => {
            const { mesh, fixed } = this.passes[pass];
            const u = mesh.program.uniforms;
            u.uRes.value = [viewport.width, viewport.height];
            u.uNight.value = this.night;
            for (const [k, v] of Object.entries({ ...fixed, ...values[pass] })) u[k].value = v;
            this.renderer.render({ scene: mesh, clear: i === 0 });
        });

        if (!this.drawn) {
            this.drawn = true;
            this.onFirstFrame?.();
            // Con la Escena ya a la vista, el otro tema se prepara para cambiar sin espera.
            void this.load(this.theme === 'night' ? 'day' : 'night');
        }
        this.onFrame?.(now);
    }
}
