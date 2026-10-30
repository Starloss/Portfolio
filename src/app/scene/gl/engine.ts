// Adaptador delgado sobre ogl (ADR 0003). Corre en un Worker, con el canvas transferido a un
// OffscreenCanvas: crear el contexto y dibujar nunca traban la página. Sube las texturas, fija los
// uniforms que calcula frame.ts y dibuja las capas en orden. La lógica vive en frame.ts y
// watchdog.ts, con tests; esto se prueba con Playwright.
import { Geometry, Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import { isSoftwareGpu, rendererName } from './detect';
import { advanceClocks, cssEase, escenaFrame, type ClockAnchor, type Clocks } from './frame';
import type { FallbackReason, Layout, TextureRequest } from './protocol';
import {
    CLOUDS_FRAGMENT,
    FULLSCREEN_VERTEX,
    LAYER_FRAGMENT,
    MOON_FRAGMENT,
    SKY_FRAGMENT,
    SPRITE_FRAGMENT,
    SPRITE_VERTEX,
} from './shaders';
import type { LayerName } from './textures';
import { createWatchdog } from './watchdog';

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
const RESIZE_SETTLE_MS = 250;

// requestAnimationFrame existe en los Workers de Chrome, Firefox y Safari 17 con OffscreenCanvas.
const nextFrame = (run: (now: number) => void): number =>
    typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(run)
        : (setTimeout(() => run(performance.now()), 16) as unknown as number);
const cancelFrame = (id: number) =>
    typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id);
const epoch = () => performance.timeOrigin + performance.now();

export interface EngineOptions {
    dpr: number;
    /** Con `?escena=webgl` no hay vigilante de FPS. */
    watch: boolean;
    /** La página rasteriza las piezas SVG y devuelve las texturas como ImageBitmap. */
    requestTextures: (request: TextureRequest) => Promise<Record<string, ImageBitmap>>;
}

export class EscenaGL {
    onFirstFrame?: () => void;
    /** Hay que volver a la SVG: lento (vigilante), contexto perdido o texturas que fallaron. */
    onFailed?: (reason: FallbackReason) => void;

    private renderer: Renderer;
    private gl: Renderer['gl'];
    private dpr: number;
    private textures = new Map<string, Texture>();
    private passes: Record<Pass, PassSpec>;
    private layout: Layout | null = null;
    private sizeKey = '';
    // Cada cambio de tamaño es una generación nueva de texturas. Mientras se rasterizan, se sigue
    // dibujando con las anteriores (estiradas) en vez de dejar el canvas vacío.
    private generation = 0;
    private ready: Record<Theme, number> = { day: -1, night: -1 };
    private pending: Partial<Record<Theme, { generation: number; promise: Promise<boolean> }>> = {};
    private resizeTimer: ReturnType<typeof setTimeout> | undefined;
    // Quienes esperan que un tema termine de subirse (load), por generación.
    private waiting: Array<{ theme: Theme; generation: number; resolve: (ok: boolean) => void }> =
        [];
    private maxTexture: number;
    // Se sube una textura por cuadro, para que ningún cuadro se alargue.
    private uploads: Array<{
        theme: Theme;
        generation: number;
        texture: Texture;
        image: ImageBitmap;
    }> = [];
    private wanted = 0;
    private night = 0;
    private target = 0;
    private themeFrom = 0;
    private themeStart = -1;
    private progress = 0;
    private units = { vw: 1, vh: 1 };
    private clocks: ClockAnchor = { at: epoch(), clocks: STILL };
    private raf = 0;
    private running = false;
    private disposed = false;
    private failed = false;
    private drawn = false;
    private watchdog: ReturnType<typeof createWatchdog> | null;
    // Con una GPU por software (solo forzada, en CI) cada cuadro cuesta unos 100 ms de CPU: dibuja
    // solo cuando algo cambia (scroll, tamaño, tema, texturas), con las animaciones quietas como con
    // reduced-motion y a media resolución.
    private onDemand: boolean;
    private dirty = true;

    constructor(
        private canvas: OffscreenCanvas,
        private options: EngineOptions,
    ) {
        this.dpr = options.dpr;
        this.renderer = new Renderer({
            canvas: canvas as unknown as HTMLCanvasElement,
            webgl: 2,
            dpr: this.dpr,
            alpha: false,
            antialias: false,
        });
        if (!this.renderer.isWebgl2) throw new Error('Sin WebGL2');
        this.renderer.autoClear = false;
        this.gl = this.renderer.gl;
        this.maxTexture = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
        this.onDemand = isSoftwareGpu(rendererName(this.gl as unknown as WebGL2RenderingContext));
        if (this.onDemand) this.dpr = this.renderer.dpr = SOFTWARE_DPR;
        this.watchdog = options.watch ? createWatchdog(performance.now()) : null;
        canvas.addEventListener('webglcontextlost', this.onContextLost);
        this.passes = this.build();
    }

    private texture(name: string): Texture {
        let t = this.textures.get(name);
        if (!t) {
            // Las ImageBitmap llegan ya premultiplicadas y sin voltear.
            t = new Texture(this.gl, { generateMipmaps: false, flipY: false });
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
        this.fail('context-lost');
    };

    private settle(which: (w: { theme: Theme; generation: number }) => boolean, ok: boolean) {
        this.waiting = this.waiting.filter((w) => {
            if (!which(w)) return true;
            w.resolve(ok);
            return false;
        });
    }

    // Se avisa una sola vez: lo que falle después (las esperas que quedan) conserva la razón original.
    private fail(reason: FallbackReason) {
        if (this.disposed || this.failed) return;
        this.failed = true;
        this.settle(() => true, false);
        this.stop();
        this.onFailed?.(reason);
    }

    /** Solo con ?escena=webgl: Playwright prueba así la vuelta a la SVG. */
    loseContext() {
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    /**
     * Pide y encola las capas de un tema para el tamaño actual; una sola vez por generación.
     * Resuelve `false` si no se pudieron preparar.
     */
    private load(theme: Theme): Promise<boolean> {
        const layout = this.layout;
        const generation = this.generation;
        if (!layout || this.ready[theme] === generation) return Promise.resolve(true);
        const pending = this.pending[theme];
        if (pending?.generation === generation) return pending.promise;
        // Sin pasar del tamaño máximo de textura de la GPU (pantallas 4K con dpr 2).
        const longest = Math.max(layout.viewport.width, layout.viewport.height);
        const dpr = Math.min(this.dpr, this.maxTexture / longest);
        const promise = this.options
            .requestTextures({
                night: theme === 'night',
                viewport: layout.viewport,
                frame: layout.frame,
                dpr,
            })
            .then((images) => {
                // Si la pantalla cambió de tamaño mientras tanto, ya viene otra generación.
                if (this.disposed || generation !== this.generation) {
                    Object.values(images).forEach((image) => image.close());
                    return true;
                }
                for (const [name, image] of Object.entries(images)) {
                    this.uploads.push({
                        theme,
                        generation,
                        texture: this.texture(`${name}:${theme}`),
                        image,
                    });
                }
                // Listo recién cuando se subieron todas (una por cuadro), no cuando quedan en cola.
                return new Promise<boolean>((resolve) =>
                    this.waiting.push({ theme, generation, resolve }),
                );
            })
            .catch(() => {
                // Una generación vieja o el tema que no se ve no detienen la Escena: si hace falta,
                // se vuelve a pedir. Falla de verdad solo el tema que está a la vista.
                if (this.disposed || generation !== this.generation) return true;
                if (theme === this.theme) this.fail('init-failed');
                return false;
            })
            .finally(() => {
                if (this.pending[theme]?.promise === promise) delete this.pending[theme];
            });
        this.pending[theme] = { generation, promise };
        return promise;
    }

    /** Sube la próxima textura en cola; el tema queda listo cuando subió todas las suyas. */
    private upload() {
        const next = this.uploads.shift();
        if (!next) return;
        const { theme, generation, texture, image } = next;
        if (generation !== this.generation) {
            image.close();
            return;
        }
        texture.image = image as unknown as HTMLImageElement;
        texture.needsUpdate = true;
        texture.update();
        // WebGL copió los píxeles: el ImageBitmap ya no hace falta.
        image.close();
        if (this.gl.getError() !== this.gl.NO_ERROR) {
            this.fail('init-failed');
            return;
        }
        if (!this.uploads.some((u) => u.theme === theme && u.generation === generation)) {
            this.ready[theme] = generation;
            this.dirty = true;
            this.settle((w) => w.theme === theme && w.generation === generation, true);
        }
    }

    private get theme(): Theme {
        return this.target > 0.5 ? 'night' : 'day';
    }

    setLayout(layout: Layout) {
        this.layout = layout;
        this.dirty = true;
        const key = `${layout.viewport.width}x${layout.viewport.height}`;
        if (key === this.sizeKey) return;
        const first = this.sizeKey === '';
        this.sizeKey = key;
        this.generation++;
        // Las esperas de la generación anterior ya no importan: quien esperaba sigue adelante.
        this.settle(() => true, true);
        this.renderer.setSize(layout.viewport.width, layout.viewport.height);
        // Mientras se arrastra el borde de la ventana, se dibuja con las texturas anteriores y se
        // rasteriza una sola vez, cuando el tamaño se queda quieto.
        clearTimeout(this.resizeTimer);
        if (first) this.reload();
        else this.resizeTimer = setTimeout(() => this.reload(), RESIZE_SETTLE_MS);
    }

    private reload() {
        const current = this.theme;
        const other: Theme = current === 'night' ? 'day' : 'night';
        void this.load(current).then((ok) => {
            if (ok && this.ready[other] >= 0) void this.load(other);
        });
    }

    /** Cambia de tema: de entrada, sin transición; después, con el mismo fundido que la SVG. */
    async setNight(night: boolean) {
        const goal = night ? 1 : 0;
        this.wanted = goal;
        if (!this.drawn) {
            this.night = this.target = goal;
            await this.load(this.theme);
            return;
        }
        if (goal === this.target) return;
        const ok = await this.load(night ? 'night' : 'day');
        // Si mientras se preparaba el tema se pidió el otro, manda el último pedido.
        if (this.wanted !== goal || this.disposed) return;
        // El tema que se pidió no se puede mostrar: vuelve a la SVG.
        if (!ok) return this.fail('init-failed');
        this.themeFrom = this.night;
        this.target = goal;
        this.themeStart = performance.now();
    }

    setScroll(progress: number) {
        this.progress = progress;
        this.dirty = true;
    }

    setUnits(units: { vw: number; vh: number }) {
        this.units = units;
        this.dirty = true;
    }

    setClocks(anchor: ClockAnchor) {
        this.clocks = anchor;
    }

    start() {
        if (this.running || this.disposed) return;
        this.running = true;
        // Al volver de una pausa, el vigilante no mide el arranque.
        this.watchdog?.restart(performance.now());
        const loop = (now: number) => {
            if (!this.running) return;
            this.upload();
            this.draw(now);
            if (this.running) this.raf = nextFrame(loop);
        };
        this.raf = nextFrame(loop);
    }

    stop() {
        this.running = false;
        cancelFrame(this.raf);
    }

    destroy() {
        this.stop();
        clearTimeout(this.resizeTimer);
        this.disposed = true;
        this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
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
        const f = escenaFrame({
            progress: this.progress,
            sink,
            viewport,
            frame,
            clocks: this.onDemand ? STILL : advanceClocks(this.clocks, epoch()),
            units: this.units,
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
        if (this.watchdog?.frame(now) === 'fallback') this.fail('slow');
    }
}
