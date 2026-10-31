// La Escena WebGL vista desde la página: transfiere el canvas a un Worker y le pasa lo que solo se
// sabe aquí (scroll, medidas, tema, reloj de las animaciones de CSS). Cuando el Worker pide
// texturas, las rasteriza de las piezas SVG y se las manda como ImageBitmap.
import { readClocks } from './clocks';
import type { BovedaParams } from '../prototype-boveda/sim';

import type { FallbackReason, FromWorker, Layout, ToWorker } from './protocol';
import { themeLayers } from './textures';

const epoch = () => performance.timeOrigin + performance.now();

export class EscenaClient {
    onFirstFrame?: () => void;
    onFailed?: (reason: FallbackReason) => void;

    private worker: Worker;
    private disposed = false;

    constructor(canvas: HTMLCanvasElement, options: { dpr: number; watch: boolean }) {
        const offscreen = canvas.transferControlToOffscreen();
        this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (event: MessageEvent<FromWorker>) => void this.receive(event.data);
        this.worker.onerror = () => this.onFailed?.('init-failed');
        this.post({ type: 'init', canvas: offscreen, ...options }, [offscreen]);
        window.addEventListener('scroll', this.sendScroll, { passive: true });
        // Parallax solo con mouse (puntero fino): en táctil no hay hacia dónde mirar. Se mira el
        // tipo de cada evento, así sirve también en equipos con pantalla táctil y mouse.
        window.addEventListener('pointermove', this.sendPointer, { passive: true });
        document.documentElement.addEventListener('mouseleave', this.centerPointer);
        // Con ?escena=webgl, Playwright puede pedir que se pierda el contexto.
        if (!options.watch) window.addEventListener('escena:perder-contexto', this.loseContext);
        this.sendScroll();
    }

    private post(message: ToWorker, transfer: Transferable[] = []) {
        if (!this.disposed) this.worker.postMessage(message, transfer);
    }

    private sendScroll = () => {
        const doc = document.documentElement;
        const progress = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
        this.post({ type: 'scroll', progress });
    };

    // El reloj de las animaciones de CSS de la SVG, en este instante: el Worker lo avanza solo.
    private sendClocks() {
        const at = epoch();
        this.post({ type: 'clocks', anchor: { at, clocks: readClocks(performance.now() / 1000) } });
    }

    private loseContext = () => this.post({ type: 'lose-context' });

    // A lo sumo un mensaje por cuadro: el puntero se mueve más seguido que lo que se dibuja.
    private pointerQueued = false;
    private pointerX = 0;
    private queuePointer(x: number) {
        this.pointerX = x;
        if (this.pointerQueued) return;
        this.pointerQueued = true;
        requestAnimationFrame(() => {
            this.pointerQueued = false;
            this.post({ type: 'pointer', x: this.pointerX });
        });
    }

    private sendPointer = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') {
            this.queuePointer((event.clientX / window.innerWidth) * 2 - 1);
        }
    };

    // Si el mouse sale de la ventana, la Escena vuelve al centro.
    private centerPointer = () => this.queuePointer(0);

    private async receive(message: FromWorker) {
        if (message.type === 'first-frame') return this.onFirstFrame?.();
        if (message.type === 'failed') return this.onFailed?.(message.reason);
        const { id, night, viewport, frame, dpr } = message;
        try {
            const layers = await themeLayers(night, frame, viewport, dpr);
            const images: Record<string, ImageBitmap> = {};
            for (const [name, image] of Object.entries(layers)) {
                if (image) {
                    images[name] = await createImageBitmap(image, {
                        premultiplyAlpha: 'premultiply',
                    });
                }
            }
            this.post({ type: 'textures', id, images }, Object.values(images));
        } catch {
            this.post({ type: 'textures', id, images: null });
        }
    }

    setLayout(layout: Layout) {
        this.post({ type: 'layout', layout });
    }

    setBoveda(params: BovedaParams | null) {
        this.post({ type: 'boveda', params });
    }

    setNight(night: boolean) {
        this.post({ type: 'night', night });
        // Las estrellas o las guacamayas recién montadas arrancan su animación de cero.
        this.sendClocks();
    }

    start() {
        this.sendScroll();
        this.sendClocks();
        this.post({ type: 'run', running: true });
    }

    stop() {
        this.post({ type: 'run', running: false });
    }

    destroy() {
        window.removeEventListener('scroll', this.sendScroll);
        window.removeEventListener('pointermove', this.sendPointer);
        document.documentElement.removeEventListener('mouseleave', this.centerPointer);
        window.removeEventListener('escena:perder-contexto', this.loseContext);
        this.disposed = true;
        this.worker.terminate();
    }
}
