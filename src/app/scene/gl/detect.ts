// Detección previa de la Escena WebGL (ADR 0003). Vive en su propio chunk, que se carga con el
// navegador ocioso, y decide antes de descargar la versión WebGL: ante cualquier duda, la SVG.

export type EscenaVersion = 'svg' | 'webgl';

export type EscenaReason =
    | 'forced'
    | 'reduced-motion'
    | 'save-data'
    | 'fallback-remembered'
    | 'no-webgl2'
    | 'low-memory'
    | 'few-cores'
    | 'software-gpu'
    | 'low-end-gpu'
    | 'capable';

export interface EscenaChoice {
    version: EscenaVersion;
    reason: EscenaReason;
}

export interface DeviceSignals {
    /** Valor de `?escena=`: `webgl` salta la detección y el vigilante, `svg` la apaga. */
    forced: string | null;
    reducedMotion: boolean;
    saveData: boolean;
    /** WebGL2 en un OffscreenCanvas: la Escena WebGL dibuja desde un Worker. */
    webgl2: boolean;
    /** Nombre de la GPU que da WebGL, si lo da. */
    renderer: string | null;
    /** GB (`navigator.deviceMemory`); solo Chromium lo da. */
    memory?: number;
    /** `navigator.hardwareConcurrency`. */
    cores?: number;
    rememberedFallback: boolean;
}

const MIN_MEMORY_GB = 4;
const MIN_CORES = 4;
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/** GPU emulada en la CPU: solo llega a la Escena WebGL forzada con ?escena=webgl. */
export const isSoftwareGpu = (renderer: string | null) => !!renderer && SOFTWARE_GPU.test(renderer);
// Integradas viejas. Las demás pasan, también las de teléfono: el nombre no dice cuánto rinden, y si
// no alcanzan, el vigilante de FPS las devuelve a la SVG.
const LOW_END_GPU = /\bHD Graphics\b/i;

export function chooseEscena(s: DeviceSignals): EscenaChoice {
    const svg = (reason: EscenaReason): EscenaChoice => ({ version: 'svg', reason });
    if (s.forced === 'webgl') return { version: 'webgl', reason: 'forced' };
    if (s.forced === 'svg') return svg('forced');
    if (s.reducedMotion) return svg('reduced-motion');
    if (s.saveData) return svg('save-data');
    if (s.rememberedFallback) return svg('fallback-remembered');
    if (!s.webgl2) return svg('no-webgl2');
    if (s.memory !== undefined && s.memory < MIN_MEMORY_GB) return svg('low-memory');
    if (s.cores !== undefined && s.cores < MIN_CORES) return svg('few-cores');
    if (isSoftwareGpu(s.renderer)) return svg('software-gpu');
    if (s.renderer && LOW_END_GPU.test(s.renderer)) return svg('low-end-gpu');
    return { version: 'webgl', reason: 'capable' };
}

// La caída del vigilante se recuerda por visitante, pero no para siempre: el equipo, el driver o
// el navegador pueden cambiar.
export const FALLBACK_KEY = 'escena-caida';
export const FALLBACK_DAYS = 30;

export function isFallbackRemembered(stored: string | null, now: number): boolean {
    const at = Number(stored);
    if (!stored || !Number.isFinite(at)) return false;
    return now - at < FALLBACK_DAYS * 24 * 60 * 60 * 1000;
}

export function rememberFallback(now = Date.now()) {
    try {
        localStorage.setItem(FALLBACK_KEY, String(now));
    } catch {
        // Sin almacenamiento, la caída vale solo para esta visita.
    }
}

function storedFallback(): string | null {
    try {
        return localStorage.getItem(FALLBACK_KEY);
    } catch {
        return null;
    }
}

/** Nombre de la GPU detrás de un contexto WebGL, si el navegador lo da. */
export function rendererName(gl: WebGL2RenderingContext): string | null {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '') || null;
}

// La Escena WebGL dibuja desde un Worker con OffscreenCanvas: hace falta WebGL2 ahí. La prueba
// también va en un Worker, porque crear un contexto (sobre todo por software) traba el hilo que lo
// pide. Si el Worker no responde a tiempo, se toma como que no hay WebGL2.
const PROBE_TIMEOUT_MS = 3000;

function probeWebGL(): Promise<{ webgl2: boolean; renderer: string | null }> {
    const none = { webgl2: false, renderer: null };
    if (
        typeof OffscreenCanvas === 'undefined' ||
        typeof Worker === 'undefined' ||
        !('transferControlToOffscreen' in HTMLCanvasElement.prototype)
    ) {
        return Promise.resolve(none);
    }
    return new Promise((resolve) => {
        let worker: Worker;
        try {
            worker = new Worker(new URL('./probe.worker.ts', import.meta.url), { type: 'module' });
        } catch {
            resolve(none);
            return;
        }
        const done = (result: { webgl2: boolean; renderer: string | null }) => {
            window.clearTimeout(timer);
            worker.terminate();
            resolve(result);
        };
        const timer = window.setTimeout(() => done(none), PROBE_TIMEOUT_MS);
        worker.onmessage = (event) => done(event.data);
        worker.onerror = () => done(none);
    });
}

const matches = (query: string) =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/** Lee del navegador lo que necesita `chooseEscena`. */
export async function readSignals(): Promise<DeviceSignals> {
    const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
    };
    const forced = new URLSearchParams(window.location.search).get('escena');
    const cheap = {
        forced,
        reducedMotion: matches('(prefers-reduced-motion: reduce)'),
        saveData: nav.connection?.saveData === true,
        memory: nav.deviceMemory,
        cores: nav.hardwareConcurrency || undefined,
        rememberedFallback: isFallbackRemembered(storedFallback(), Date.now()),
    };
    // Pedir un contexto WebGL cuesta: solo cuando lo demás ya no la descartó o forzó. Si no se
    // pregunta, la GPU no es la razón de la decisión: se la da por buena.
    const unasked = { webgl2: true, renderer: null };
    const decided = chooseEscena({ ...cheap, ...unasked });
    if (decided.version === 'svg' || decided.reason === 'forced') return { ...cheap, ...unasked };
    return { ...cheap, ...(await probeWebGL()) };
}
