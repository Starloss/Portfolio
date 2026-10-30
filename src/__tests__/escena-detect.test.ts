import { afterEach, describe, it, expect, vi } from 'vitest';
import {
    chooseEscena,
    FALLBACK_DAYS,
    isFallbackRemembered,
    readSignals,
    rememberFallback,
    type DeviceSignals,
} from '@app/scene/gl/detect';

// Detección previa de la Escena WebGL (ADR 0003): decide antes de descargar nada más.

const capable: DeviceSignals = {
    forced: null,
    reducedMotion: false,
    saveData: false,
    mobile: false,
    webgl2: true,
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    memory: 16,
    cores: 16,
    rememberedFallback: false,
};

describe('chooseEscena', () => {
    it('un escritorio capaz recibe la Escena WebGL', () => {
        expect(chooseEscena(capable)).toEqual({ version: 'webgl', reason: 'capable' });
    });

    it('?escena=webgl salta toda la detección; ?escena=svg la apaga', () => {
        const weak: DeviceSignals = {
            ...capable,
            reducedMotion: true,
            mobile: true,
            webgl2: false,
            rememberedFallback: true,
        };
        expect(chooseEscena({ ...weak, forced: 'webgl' })).toEqual({
            version: 'webgl',
            reason: 'forced',
        });
        expect(chooseEscena({ ...capable, forced: 'svg' })).toEqual({
            version: 'svg',
            reason: 'forced',
        });
    });

    it.each([
        ['reduced-motion', { reducedMotion: true }],
        ['save-data', { saveData: true }],
        ['mobile', { mobile: true }],
        ['fallback-remembered', { rememberedFallback: true }],
        ['no-webgl2', { webgl2: false }],
        ['low-memory', { memory: 2 }],
        ['few-cores', { cores: 2 }],
    ] as const)('deja la SVG por %s', (reason, signals) => {
        expect(chooseEscena({ ...capable, ...signals })).toEqual({ version: 'svg', reason });
    });

    it('sin datos de memoria o núcleos (Safari, Firefox) no los usa para descartar', () => {
        expect(chooseEscena({ ...capable, memory: undefined, cores: undefined }).version).toBe(
            'webgl',
        );
    });

    it.each([
        'Google SwiftShader',
        'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
        'llvmpipe (LLVM 15.0.7, 256 bits)',
        'Microsoft Basic Render Driver',
    ])('una GPU por software deja la SVG: %s', (renderer) => {
        expect(chooseEscena({ ...capable, renderer })).toEqual({
            version: 'svg',
            reason: 'software-gpu',
        });
    });

    it.each([
        'ANGLE (Intel, Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'Mali-G52 MC2',
        'Adreno (TM) 506',
        'PowerVR Rogue GE8320',
    ])('una GPU de gama baja deja la SVG: %s', (renderer) => {
        expect(chooseEscena({ ...capable, renderer })).toEqual({
            version: 'svg',
            reason: 'low-end-gpu',
        });
    });

    it.each([
        'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'Apple M2',
        'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    ])('una GPU integrada reciente o dedicada pasa (la vigila el vigilante): %s', (renderer) => {
        expect(chooseEscena({ ...capable, renderer }).version).toBe('webgl');
    });

    it('sin nombre de GPU no la descarta por eso', () => {
        expect(chooseEscena({ ...capable, renderer: null }).version).toBe('webgl');
    });
});

describe('isFallbackRemembered', () => {
    const now = Date.UTC(2026, 9, 30);
    const day = 24 * 60 * 60 * 1000;

    it('recuerda una caída reciente', () => {
        expect(isFallbackRemembered(String(now - 3 * day), now)).toBe(true);
    });

    it(`olvida la caída después de ${FALLBACK_DAYS} días: el equipo o el navegador pudo cambiar`, () => {
        expect(isFallbackRemembered(String(now - (FALLBACK_DAYS + 1) * day), now)).toBe(false);
    });

    it('sin valor, o con uno que no es una fecha, no hay caída recordada', () => {
        expect(isFallbackRemembered(null, now)).toBe(false);
        expect(isFallbackRemembered('basura', now)).toBe(false);
    });
});

describe('readSignals', () => {
    // jsdom no tiene OffscreenCanvas ni Workers: un Worker de prueba que contesta lo que se le pida.
    const workers = { created: 0 };
    const fakeProbe = (answer: { webgl2: boolean; renderer: string | null } | 'silence') => {
        vi.stubGlobal('OffscreenCanvas', class {});
        vi.stubGlobal(
            'Worker',
            class {
                onmessage: ((event: { data: unknown }) => void) | null = null;
                onerror: (() => void) | null = null;
                constructor() {
                    workers.created++;
                    if (answer !== 'silence') {
                        setTimeout(() => this.onmessage?.({ data: answer }));
                    }
                }
                terminate() {}
            },
        );
        Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', {
            value: () => ({}),
            configurable: true,
        });
    };

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
        Reflect.deleteProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen');
        window.history.replaceState(null, '', '/');
        localStorage.clear();
        workers.created = 0;
    });

    it('pregunta por la GPU desde un Worker, sin trabar la página', async () => {
        fakeProbe({ webgl2: true, renderer: 'ANGLE (NVIDIA GeForce RTX 3060 Ti)' });
        const s = await readSignals();
        expect(s).toMatchObject({ webgl2: true, renderer: 'ANGLE (NVIDIA GeForce RTX 3060 Ti)' });
        expect(chooseEscena(s)).toEqual({ version: 'webgl', reason: 'capable' });
    });

    it('sin OffscreenCanvas (Safari viejo) no hay Escena WebGL', async () => {
        expect(await readSignals()).toMatchObject({ webgl2: false, renderer: null });
    });

    it('si el Worker de prueba no contesta, se queda la SVG', async () => {
        vi.useFakeTimers();
        fakeProbe('silence');
        const pending = readSignals();
        await vi.advanceTimersByTimeAsync(3000);
        expect(chooseEscena(await pending)).toEqual({ version: 'svg', reason: 'no-webgl2' });
    });

    it('con ?escena=webgl no hace la prueba', async () => {
        fakeProbe({ webgl2: true, renderer: 'x' });
        window.history.replaceState(null, '', '/?escena=webgl');
        expect(chooseEscena(await readSignals())).toEqual({ version: 'webgl', reason: 'forced' });
        expect(workers.created).toBe(0);
    });

    it('descarta por poca memoria con esa razón, sin hacer la prueba', async () => {
        fakeProbe({ webgl2: true, renderer: 'x' });
        Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
        try {
            expect(chooseEscena(await readSignals())).toEqual({
                version: 'svg',
                reason: 'low-memory',
            });
            expect(workers.created).toBe(0);
        } finally {
            Reflect.deleteProperty(navigator, 'deviceMemory');
        }
    });

    it('descarta por pocos núcleos con esa razón, sin hacer la prueba', async () => {
        fakeProbe({ webgl2: true, renderer: 'x' });
        vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(2);
        expect(chooseEscena(await readSignals())).toEqual({ version: 'svg', reason: 'few-cores' });
        expect(workers.created).toBe(0);
    });

    it('un teléfono acostado (ventana ancha, pantalla chica) es un teléfono', async () => {
        vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390);
        vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844);
        expect(chooseEscena(await readSignals())).toEqual({ version: 'svg', reason: 'mobile' });
    });

    it('con una caída recordada tampoco hace la prueba', async () => {
        fakeProbe({ webgl2: true, renderer: 'x' });
        rememberFallback();
        expect(chooseEscena(await readSignals())).toEqual({
            version: 'svg',
            reason: 'fallback-remembered',
        });
        expect(workers.created).toBe(0);
    });
});
