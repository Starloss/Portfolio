// Adaptador delgado sobre ogl (ADR 0003): sube las texturas, fija los uniforms que calcula
// frame.ts y dibuja las capas en orden. La lógica vive en frame.ts y watchdog.ts, con tests; esto
// se prueba con Playwright.
import { Geometry, Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import type { SceneFrame, Viewport } from '../camera';
import { CLOUDS } from '../Scene';

import { escenaFrame } from './frame';
import {
    CLOUDS_FRAGMENT,
    FULLSCREEN_VERTEX,
    LAYER_FRAGMENT,
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

type Gl = Renderer['gl'];
type Theme = 'day' | 'night';

// El mismo atardecer de colores que la SVG (transition: 0.6s ease).
const THEME_SECONDS = 0.6;
const MOON_RADIUS = 26;
const ease = (t: number) => t * t * (3 - 2 * t);

export class EscenaGL {
    onFirstFrame?: () => void;
    /** Cada cuadro dibujado, con su hora: lo usa el vigilante de FPS. */
    onFrame?: (now: number) => void;
    onLost?: () => void;

    private renderer: Renderer;
    private gl: Gl;
    private textures = new Map<string, Texture>();
    private loaded: Record<Theme, boolean> = { day: false, night: false };
    private loading: Partial<Record<Theme, Promise<void>>> = {};
    private layout: Layout | null = null;
    private sizeKey = '';
    private night = 0;
    private target = 0;
    private themeFrom = 0;
    private themeStart = -1;
    private raf = 0;
    private running = false;
    private disposed = false;
    private drawn = false;

    constructor(
        private canvas: HTMLCanvasElement,
        private dpr: number,
    ) {
        this.renderer = new Renderer({ canvas, webgl: 2, dpr, alpha: false, antialias: false });
        if (!this.renderer.isWebgl2) throw new Error('Sin WebGL2');
        this.renderer.autoClear = false;
        this.gl = this.renderer.gl;
        canvas.addEventListener('webglcontextlost', this.onContextLost);
        this.build();
    }

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

    private program(
        vertex: string,
        fragment: string,
        uniforms: Record<string, { value: unknown }>,
    ) {
        const program = new Program(this.gl, {
            vertex,
            fragment,
            uniforms: { uRes: { value: [1, 1] }, uDpr: { value: this.dpr }, ...uniforms },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            // Los sprites van en px con y hacia abajo: quedan de espaldas y no hay que descartarlos.
            cullFace: false,
        });
        program.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        return program;
    }

    private build() {
        const gl = this.gl;
        const fullscreen = new Triangle(gl);
        const quad = new Geometry(gl, {
            position: { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]) },
        });
        const mesh = (geometry: Geometry, program: Program) =>
            new Mesh(gl, { geometry, program, frustumCulled: false });

        const sky = mesh(
            fullscreen,
            this.program(FULLSCREEN_VERTEX, SKY_FRAGMENT, {
                uNight: { value: 0 },
                uSkyHigh: { value: 0 },
                uMoon: { value: [0, 0, 0] },
            }),
        );
        const clouds = mesh(
            fullscreen,
            this.program(FULLSCREEN_VERTEX, CLOUDS_FRAGMENT, {
                uNight: { value: 0 },
                uOpacity: { value: 0 },
                uCloud0: { value: [0, 0, 1, 1] },
                uCloud1: { value: [0, 0, 1, 1] },
                uCloud2: { value: [0, 0, 1, 1] },
            }),
        );
        // Las de un solo tema usan la misma textura de los dos lados de la mezcla.
        const layer = (name: LayerName, day = name, night = name) =>
            mesh(
                fullscreen,
                this.program(FULLSCREEN_VERTEX, LAYER_FRAGMENT, {
                    tDay: { value: this.texture(`${day}:day`) },
                    tNight: { value: this.texture(`${night}:night`) },
                    uNight: { value: 0 },
                    uOffset: { value: [0, 0] },
                    uOpacity: { value: 1 },
                    uTwinkle: { value: -1 },
                }),
            );
        const sprite = () =>
            mesh(
                quad,
                this.program(SPRITE_VERTEX, SPRITE_FRAGMENT, {
                    tDay: { value: this.texture('cabin:day') },
                    tNight: { value: this.texture('cabin:night') },
                    uNight: { value: 0 },
                    uRect: { value: [0, 0, 0, 0] },
                }),
            );
        const stars = mesh(
            fullscreen,
            this.program(FULLSCREEN_VERTEX, LAYER_FRAGMENT, {
                tDay: { value: this.texture('stars:night') },
                tNight: { value: this.texture('stars:night') },
                uNight: { value: 0 },
                uOffset: { value: [0, 0] },
                uOpacity: { value: 0 },
                uTwinkle: { value: 0 },
            }),
        );
        const macaws = mesh(
            fullscreen,
            this.program(FULLSCREEN_VERTEX, LAYER_FRAGMENT, {
                tDay: { value: this.texture('macaws:day') },
                tNight: { value: this.texture('macaws:day') },
                uNight: { value: 0 },
                uOffset: { value: [0, 0] },
                uOpacity: { value: 1 },
                uTwinkle: { value: -1 },
            }),
        );
        const [cabin0, cabin1, visitor] = [sprite(), sprite(), sprite()];
        this.meshes = {
            sky,
            stars,
            macaws,
            clouds,
            far: layer('far'),
            avilaBack: layer('avilaBack'),
            cabin0,
            cabin1,
            avilaFront: layer('avilaFront'),
            visitor,
            city: layer('city'),
            towers: layer('towers'),
        };
    }

    // En el mismo orden que las capas de la Escena SVG, de atrás hacia adelante.
    private meshes!: Record<string, Mesh>;

    private onContextLost = (event: Event) => {
        event.preventDefault();
        this.stop();
        this.onLost?.();
    };

    private async loadTheme(theme: Theme) {
        const layout = this.layout;
        if (!layout) return;
        const key = this.sizeKey;
        const images = await themeLayers(
            theme === 'night',
            layout.frame,
            layout.viewport,
            this.dpr,
        );
        // Si la pantalla cambió de tamaño mientras tanto, estas ya no sirven.
        if (this.disposed || key !== this.sizeKey) return;
        for (const [name, image] of Object.entries(images)) {
            const t = this.texture(`${name}:${theme}`);
            t.image = image;
            t.needsUpdate = true;
        }
        this.loaded[theme] = true;
    }

    private ensureTheme(theme: Theme) {
        if (this.loaded[theme]) return Promise.resolve();
        this.loading[theme] ??= this.loadTheme(theme).finally(() => {
            delete this.loading[theme];
        });
        return this.loading[theme]!;
    }

    setLayout(layout: Layout) {
        this.layout = layout;
        const key = `${layout.viewport.width}x${layout.viewport.height}`;
        if (key === this.sizeKey) return;
        this.sizeKey = key;
        this.renderer.setSize(layout.viewport.width, layout.viewport.height);
        const had = { ...this.loaded };
        this.loaded = { day: false, night: false };
        this.loading = {};
        const current: Theme = this.target > 0.5 ? 'night' : 'day';
        void this.ensureTheme(current).then(() => {
            const other: Theme = current === 'night' ? 'day' : 'night';
            if (had[other]) void this.ensureTheme(other);
        });
    }

    /** Cambia de tema: de entrada, sin transición; después, con el mismo fundido que la SVG. */
    async setNight(night: boolean) {
        const goal = night ? 1 : 0;
        const theme: Theme = night ? 'night' : 'day';
        if (!this.drawn) {
            this.night = this.target = goal;
            return this.ensureTheme(theme);
        }
        if (goal === this.target) return;
        await this.ensureTheme(theme);
        this.themeFrom = this.night;
        this.target = goal;
        this.themeStart = performance.now();
    }

    start() {
        if (this.running || this.disposed) return;
        this.running = true;
        const loop = (now: number) => {
            if (!this.running) return;
            this.draw(now);
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
        this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    private draw(now: number) {
        const layout = this.layout;
        const theme: Theme = this.target > 0.5 ? 'night' : 'day';
        if (!layout || !this.loaded[theme]) return;
        const { viewport, frame, sink, moon } = layout;

        if (this.themeStart >= 0) {
            const t = Math.min(1, (now - this.themeStart) / 1000 / THEME_SECONDS);
            this.night = this.themeFrom + (this.target - this.themeFrom) * ease(t);
            if (t >= 1) this.themeStart = -1;
        }
        const doc = document.documentElement;
        const progress = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
        const f = escenaFrame({ progress, sink, viewport, frame, time: now / 1000 });

        const m = this.meshes;
        const set = (mesh: Mesh, values: Record<string, unknown>) => {
            const u = mesh.program.uniforms;
            u.uRes.value = [viewport.width, viewport.height];
            if (u.uNight) u.uNight.value = this.night;
            for (const [k, v] of Object.entries(values)) u[k].value = v;
        };
        set(m.sky, {
            uSkyHigh: f.skyHigh,
            uMoon: moon ? [moon.x, moon.y, MOON_RADIUS] : [0, 0, 0],
        });
        set(m.stars, { uOpacity: this.night, uTwinkle: now / 1000 });
        set(m.macaws, { uOffset: [f.macaws.x, f.macaws.y], uOpacity: 1 - this.night });
        const vw = window.innerWidth / 100;
        const vh = window.innerHeight / 100;
        CLOUDS.forEach((c, i) => {
            m.clouds.program.uniforms[`uCloud${i}`].value = [
                (c.left + c.width / 2 + c.drift * f.cloudDrift) * vw,
                c.top * vh + (c.width / 3.2 / 2) * vw + f.clouds.y,
                (c.width / 2) * vw,
                (c.width / 3.2 / 2) * vw,
            ];
        });
        set(m.clouds, { uOpacity: f.clouds.opacity });
        set(m.far, { uOffset: [0, f.shifts.farRidge] });
        set(m.avilaBack, { uOffset: [0, f.shifts.avila] });
        set(m.avilaFront, { uOffset: [0, f.shifts.avila] });
        set(m.city, { uOffset: [0, f.shifts.city] });
        set(m.towers, { uOffset: [0, f.shifts.towers] });
        const cabin = (x: number, y: number) => [x, y, 12 * frame.scale, 17 * frame.scale];
        set(m.cabin0, { uRect: cabin(f.movingCabins[0].x - 6 * frame.scale, f.movingCabins[0].y) });
        set(m.cabin1, { uRect: cabin(f.movingCabins[1].x - 6 * frame.scale, f.movingCabins[1].y) });
        set(m.visitor, { uRect: cabin(f.visitorCabin.x, f.visitorCabin.y) });

        Object.values(m).forEach((mesh, i) =>
            this.renderer.render({ scene: mesh, clear: i === 0 }),
        );

        if (!this.drawn) {
            this.drawn = true;
            this.onFirstFrame?.();
            // Con la Escena ya visible, el otro tema se prepara para cambiar sin espera.
            void this.ensureTheme(theme === 'night' ? 'day' : 'night');
        }
        this.onFrame?.(now);
    }
}
