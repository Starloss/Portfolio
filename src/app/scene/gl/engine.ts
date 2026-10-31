// Adaptador delgado sobre ogl (ADR 0003). Corre en un Worker, con el canvas transferido a un
// OffscreenCanvas: crear el contexto y dibujar nunca traban la página. Sube las texturas, fija los
// uniforms que calcula frame.ts y dibuja las capas en orden. La lógica vive en frame.ts y
// watchdog.ts, con tests; esto se prueba con Playwright.
import { Geometry, Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import { BovedaSim, type BovedaParams } from '../prototype-boveda/sim';
import { STREET_ABOVE, streetAgents } from '../street';

import { isSoftwareGpu, rendererName } from './detect';
import {
    advanceClocks,
    cssEase,
    duskAt,
    escenaFrame,
    followPointer,
    type ClockAnchor,
    type Clocks,
    sunAt,
} from './frame';
import { noiseData } from './noise';
import type { FallbackReason, Layout, TextureRequest } from './protocol';
import { createInstances, writeInstances } from './agents';
import {
    AGENT_FRAGMENT,
    AGENT_VERTEX,
    CLOUDS_FRAGMENT,
    FRONT_FRAGMENT,
    FULLSCREEN_VERTEX,
    LAYER_FRAGMENT,
    LIGHTS_FRAGMENT,
    MIST_FRAGMENT,
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
    'farMist',
    'avilaBack',
    'cabin0',
    'cabin1',
    'avilaFront',
    'visitor',
    'avilaMist',
    'city',
    'cityLights',
    'towers',
    'towersLights',
    'street',
    'agents',
    'front',
] as const;
type Pass = (typeof ORDER)[number];

// El cambio de tema dura algo más que en la SVG (0,6 s), para que se vea el atardecer o el amanecer
// a la mitad, pero no tanto como para que el texto, que cambia enseguida, quede sobre el otro cielo.
const THEME_SECONDS = 1.2;
// Las luces llevan mipmaps: un nivel chico es su resplandor.
const MIPMAPPED: readonly LayerName[] = ['cityLights', 'towersLights'];
const MOON_RADIUS = 26;
const STILL: Clocks = { cabins: 0, macaws: 0, twinkle: 0 };
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
    private pointer = 0;
    private pointerTarget = 0;
    // Al ir hacia la Noche el sol se pone (al oeste); al volver al Día, sale (al este).
    private setting = true;
    private boveda: BovedaParams | null = null;
    private sim = new BovedaSim();
    private lastFrame = 0;
    private clocks: ClockAnchor = { at: epoch(), clocks: STILL };
    private raf = 0;
    private running = false;
    private disposed = false;
    // La Avenida Bolívar: la misma formación que la SVG, en movimiento.
    private agents = streetAgents();
    private instances = createInstances();
    private agentGeometry!: Geometry;
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
            // Las ImageBitmap llegan ya premultiplicadas y sin voltear. Los mipmaps se piden al
            // subir la imagen: antes, un filtro con mipmaps dejaría la textura incompleta.
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

    // Ocho programas para dieciocho pases: compilar shaders es lo más caro del arranque (con una
    // GPU por software, cientos de ms). Cada pase fija sus uniforms justo antes de dibujarse.
    private build(): Record<Pass, PassSpec> {
        const gl = this.gl;
        const fullscreen = new Triangle(gl);
        const quad = new Geometry(gl, {
            position: { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]) },
        });
        const noise = new Texture(gl, {
            image: noiseData(),
            width: 256,
            height: 256,
            wrapS: gl.REPEAT,
            wrapT: gl.REPEAT,
            generateMipmaps: false,
            flipY: false,
        });
        const textures = { tDay: { value: null }, tNight: { value: null } };
        // Ruido, tiempo y atardecer: lo comparten el cielo, las nubes y la niebla.
        const atmosphere = {
            tNoise: { value: noise },
            uTime: { value: 0 },
            uDusk: { value: 0 },
        };
        const sky = this.program(FULLSCREEN_VERTEX, SKY_FRAGMENT, {
            ...atmosphere,
            uSkyHigh: { value: 0 },
            uSun: { value: [0.12, 0.6] },
            uSunAlpha: { value: 0 },
            uStars: { value: [0, 0] },
            uSweep: { value: -1 },
        });
        const moon = this.program(FULLSCREEN_VERTEX, MOON_FRAGMENT, {
            uMoon: { value: [0, 0, 0] },
            uPhase: { value: 0.5 },
            uMoonAlpha: { value: 0 },
        });
        const clouds = this.program(FULLSCREEN_VERTEX, CLOUDS_FRAGMENT, {
            ...atmosphere,
            uClouds: { value: [0, 0] },
            uParallax: { value: 0 },
        });
        const mist = this.program(FULLSCREEN_VERTEX, MIST_FRAGMENT, {
            ...atmosphere,
            uMist: { value: [0, 1] },
            uFlow: { value: [1, 0, 0] },
        });
        const front = this.program(FULLSCREEN_VERTEX, FRONT_FRAGMENT, {
            ...atmosphere,
            uFront: { value: 0 },
            uHeight: { value: 0 },
            uParallax: { value: 0 },
        });
        const lights = this.program(FULLSCREEN_VERTEX, LIGHTS_FRAGMENT, {
            tLights: { value: null },
            uTime: { value: 0 },
            uOffset: { value: [0, 0] },
            uCell: { value: 1 },
        });
        // Las luces suman: alfa 0 con ONE, ONE_MINUS_SRC_ALPHA.
        const layer = this.program(FULLSCREEN_VERTEX, LAYER_FRAGMENT, {
            ...textures,
            uDusk: { value: 0 },
            uOffset: { value: [0, 0] },
            uOpacity: { value: 1 },
            uTwinkle: { value: -1 },
            uRim: { value: 0 },
            uSunSide: { value: -1 },
            uSize: { value: [1, 1] },
        });
        // La gente y los vehículos de la calle: un quad por instancia (agents.ts).
        const agents = this.program(AGENT_VERTEX, AGENT_FRAGMENT, { uTime: { value: 0 } });
        const i = this.instances;
        this.agentGeometry = new Geometry(gl, {
            position: { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]) },
            aAnchor: { size: 2, instanced: 1, data: i.anchor },
            aSize: { size: 2, instanced: 1, data: i.size },
            aMeta: { size: 4, instanced: 1, data: i.meta },
            aColor: { size: 3, instanced: 1, data: i.color },
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
        const still = { uOffset: [0, 0], uOpacity: 1, uTwinkle: -1, uRim: 0 };
        const tex = (day: string, night: string) => ({
            tDay: this.texture(day),
            tNight: this.texture(night),
        });
        // Los bordes de las crestas que dan al sol se iluminan en el atardecer.
        const both = (name: LayerName, rim = 0) =>
            pass(fullscreen, layer, {
                ...still,
                uRim: rim,
                ...tex(`${name}:day`, `${name}:night`),
            });
        // La niebla de cada cresta: tamaño del ruido (px), deriva (px/s) e intensidad.
        const mistOf = ({
            scale,
            drift,
            strength,
        }: {
            scale: number;
            drift: number;
            strength: number;
        }) => pass(fullscreen, mist, { uFlow: [scale, drift, strength] });
        const lightsOf = (name: 'cityLights' | 'towersLights') =>
            pass(fullscreen, lights, { tLights: this.texture(`${name}:night`) });
        const cabin = () => pass(quad, sprite, tex('cabin:day', 'cabin:night'));
        return {
            sky: pass(fullscreen, sky),
            stars: pass(fullscreen, layer, { ...still, ...tex('stars:night', 'stars:night') }),
            moon: pass(fullscreen, moon),
            macaws: pass(fullscreen, layer, { ...still, ...tex('macaws:day', 'macaws:day') }),
            clouds: pass(fullscreen, clouds),
            far: both('far', 0.8),
            farMist: mistOf({ scale: 1300, drift: 5, strength: 0.4 }),
            avilaBack: both('avilaBack', 1),
            cabin0: cabin(),
            cabin1: cabin(),
            avilaFront: both('avilaFront', 1),
            visitor: cabin(),
            avilaMist: mistOf({ scale: 1100, drift: -4, strength: 0.55 }),
            city: both('city'),
            cityLights: lightsOf('cityLights'),
            towers: both('towers'),
            towersLights: lightsOf('towersLights'),
            street: both('street'),
            agents: pass(this.agentGeometry, agents),
            front: pass(fullscreen, front),
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
        if (MIPMAPPED.some((name) => texture === this.textures.get(`${name}:${theme}`))) {
            texture.generateMipmaps = true;
            texture.minFilter = this.gl.LINEAR_MIPMAP_LINEAR;
        }
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
            this.sim.set(night);
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
        this.setting = goal > this.night;
        this.target = goal;
        if (this.boveda) this.sim.change(night, performance.now(), this.boveda);
        else this.themeStart = performance.now();
    }

    setBoveda(params: BovedaParams | null) {
        this.boveda = params;
        this.dirty = true;
    }

    setScroll(progress: number) {
        this.progress = progress;
        this.dirty = true;
    }

    setClocks(anchor: ClockAnchor) {
        this.clocks = anchor;
    }

    /** Dónde quiere ir el puntero en x (-1 a 1); el parallax lo sigue con suavidad. */
    setPointer(target: number) {
        this.pointerTarget = target;
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
        if (this.onDemand && !this.dirty && this.themeStart < 0 && !this.boveda) return;
        this.dirty = false;
        const { viewport, frame, sink, moon } = layout;
        const dt = Math.min(0.1, (now - (this.lastFrame || now)) / 1000);
        this.lastFrame = now;
        // Con una GPU por software no hay parallax: dibujar solo cuando algo cambia lo dejaría a
        // saltos.
        if (!this.onDemand) this.pointer = followPointer(this.pointer, this.pointerTarget, dt);

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
            pointer: this.pointer,
        });
        const b = this.boveda ? this.sim.tick(now, this.boveda) : null;
        if (b) this.night = b.night;
        const dusk = b ? b.dusk : duskAt(this.night);
        const time = this.onDemand ? 0 : now / 1000;
        const parallax = f.parallax;
        const sun = b ? b.sun : sunAt(this.night, this.setting);
        // De qué lado está el sol para los bordes iluminados: -1 a la izquierda, 1 a la derecha.
        const side = Math.sign(sun.x - 0.5);
        const rect = (r: { x: number; y: number; width: number; height: number }) => [
            r.x,
            r.y,
            r.width,
            r.height,
        ];
        const values: Record<Pass, Record<string, unknown>> = {
            sky: {
                uSkyHigh: f.skyHigh,
                uDusk: b ? b.skyDusk : dusk,
                uTime: time,
                uSun: [sun.x, sun.y],
                uSunAlpha: b ? b.sun.alpha : dusk,
                uStars: b ? [b.stars.alpha, b.stars.angle] : [0, 0],
                uSweep: b ? b.sweep : -1,
            },
            stars: {
                uOpacity: b ? 0 : this.night,
                uTwinkle: f.twinkle,
                uOffset: [parallax.sky, 0],
            },
            moon: {
                uMoon: b
                    ? [b.moon.x * viewport.width + parallax.sky, b.moon.y * viewport.height, MOON_RADIUS]
                    : moon
                      ? [moon.x + parallax.sky, moon.y, MOON_RADIUS]
                      : [0, 0, 0],
                uPhase: b ? b.moon.phase : 0.5,
                uMoonAlpha: b ? b.moon.alpha : this.night,
            },
            macaws: { uOffset: [f.macaws.x, f.macaws.y], uOpacity: 1 - this.night },
            clouds: {
                uClouds: [f.cloudsShift, f.cloudsOpacity],
                uParallax: parallax.sky,
                uDusk: dusk,
                uTime: time,
            },
            far: { uOffset: [parallax.farRidge, f.shifts.farRidge], uDusk: dusk, uSunSide: side },
            farMist: { uMist: [f.mist.farRidge, f.mist.halfHeight], uDusk: dusk, uTime: time },
            avilaBack: { uOffset: [parallax.avila, f.shifts.avila], uDusk: dusk, uSunSide: side },
            cabin0: { uRect: rect(f.cabins[0]) },
            cabin1: { uRect: rect(f.cabins[1]) },
            avilaFront: { uOffset: [parallax.avila, f.shifts.avila], uDusk: dusk, uSunSide: side },
            visitor: { uRect: rect(f.cabins[2]) },
            avilaMist: { uMist: [f.mist.avila, f.mist.halfHeight], uDusk: dusk, uTime: time },
            city: { uOffset: [parallax.city, f.shifts.city], uDusk: dusk },
            cityLights: {
                uOffset: [parallax.city, f.shifts.city],
                uTime: time,
                uCell: frame.scale,
            },
            towers: { uOffset: [parallax.towers, f.shifts.towers], uDusk: dusk },
            towersLights: {
                uOffset: [parallax.towers, f.shifts.towers],
                uTime: time,
                uCell: frame.scale,
            },
            street: {
                uOffset: [parallax.street, f.street.layerTop],
                uSize: [viewport.width, f.street.height * (1 + STREET_ABOVE)],
                uDusk: dusk,
            },
            agents: { uTime: time },
            front: {
                uFront: f.frontClouds,
                uHeight: f.height,
                uParallax: parallax.city,
                uDusk: dusk,
                uTime: time,
            },
        };
        // Con la calle a la vista, la gente y los vehículos avanzan a su ritmo.
        const streetVisible = f.street.layerTop < viewport.height;
        if (streetVisible) {
            writeInstances(this.instances, this.agents, {
                time,
                top: f.street.top,
                H: f.street.height,
                width: viewport.width,
                night: this.night,
                shiftX: parallax.street,
            });
            for (const name of ['aAnchor', 'aSize', 'aMeta', 'aColor']) {
                this.agentGeometry.attributes[name].needsUpdate = true;
            }
            this.agentGeometry.setInstancedCount(Math.max(1, this.instances.count));
        }
        ORDER.forEach((pass, i) => {
            if ((pass === 'street' || pass === 'agents') && !streetVisible) return;
            const { mesh, fixed } = this.passes[pass];
            const u = mesh.program.uniforms;
            u.uRes.value = [viewport.width, viewport.height];
            u.uNight.value = this.night;
            if (u.uSize) u.uSize.value = [viewport.width, viewport.height];
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
