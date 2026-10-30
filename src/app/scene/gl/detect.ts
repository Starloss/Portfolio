// Detección previa de la Escena WebGL (ADR 0003). Vive en su propio chunk, que se carga con el
// navegador ocioso, y decide antes de descargar la versión WebGL: ante cualquier duda, la SVG.

export type EscenaVersion = 'svg' | 'webgl';

export type EscenaReason =
    | 'forced'
    | 'reduced-motion'
    | 'save-data'
    | 'mobile'
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
    mobile: boolean;
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
// Integradas viejas y GPUs de teléfono. Las Intel recientes (UHD, Iris) pasan: si no rinden, el
// vigilante de FPS las devuelve a la SVG.
const LOW_END_GPU = /\bHD Graphics\b|\bMali\b|\bAdreno\b|\bPowerVR\b/i;

export function chooseEscena(s: DeviceSignals): EscenaChoice {
    const svg = (reason: EscenaReason): EscenaChoice => ({ version: 'svg', reason });
    if (s.forced === 'webgl') return { version: 'webgl', reason: 'forced' };
    if (s.forced === 'svg') return svg('forced');
    if (s.reducedMotion) return svg('reduced-motion');
    if (s.saveData) return svg('save-data');
    if (s.mobile) return svg('mobile');
    if (s.rememberedFallback) return svg('fallback-remembered');
    if (!s.webgl2) return svg('no-webgl2');
    if (s.memory !== undefined && s.memory < MIN_MEMORY_GB) return svg('low-memory');
    if (s.cores !== undefined && s.cores < MIN_CORES) return svg('few-cores');
    if (s.renderer && SOFTWARE_GPU.test(s.renderer)) return svg('software-gpu');
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

// Pide un contexto WebGL2 de prueba para saber si existe y qué GPU hay detrás, y lo suelta.
function probeWebGL(): { webgl2: boolean; renderer: string | null } {
    try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return { webgl2: false, renderer: null };
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = String(
            gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '',
        );
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return { webgl2: true, renderer: renderer || null };
    } catch {
        return { webgl2: false, renderer: null };
    }
}

const matches = (query: string) =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/** Lee del navegador lo que necesita `chooseEscena`. */
export function readSignals(): DeviceSignals {
    const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
    };
    const forced = new URLSearchParams(window.location.search).get('escena');
    const cheap = {
        forced,
        reducedMotion: matches('(prefers-reduced-motion: reduce)'),
        saveData: nav.connection?.saveData === true,
        mobile: matches('(max-width: 767px)'),
        memory: nav.deviceMemory,
        cores: nav.hardwareConcurrency || undefined,
        rememberedFallback: isFallbackRemembered(storedFallback(), Date.now()),
    };
    // Pedir un contexto WebGL cuesta: solo cuando lo demás ya no descartó la WebGL.
    const decided = chooseEscena({ ...cheap, webgl2: true, renderer: null });
    if (decided.version === 'svg' || decided.reason === 'forced') {
        return { ...cheap, webgl2: decided.reason === 'forced', renderer: null };
    }
    return { ...cheap, ...probeWebGL() };
}
