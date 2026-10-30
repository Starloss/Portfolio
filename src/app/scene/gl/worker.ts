// El Worker de la Escena WebGL: recibe el canvas y el estado de la página, y dibuja (ADR 0003).
import { EscenaGL } from './engine';
import type { FromWorker, TextureRequest, ToWorker } from './protocol';

let engine: EscenaGL | null = null;
let nextId = 1;
const waiting = new Map<number, (images: Record<string, ImageBitmap> | null) => void>();

const post = (message: FromWorker) => self.postMessage(message);

function requestTextures(request: TextureRequest): Promise<Record<string, ImageBitmap>> {
    const id = nextId++;
    post({ type: 'need-textures', id, ...request });
    return new Promise((resolve, reject) =>
        waiting.set(id, (images) => (images ? resolve(images) : reject(new Error('texturas')))),
    );
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
    const message = event.data;
    if (message.type === 'init') {
        try {
            engine = new EscenaGL(message.canvas, {
                dpr: message.dpr,
                watch: message.watch,
                requestTextures,
            });
        } catch {
            post({ type: 'failed', reason: 'init-failed' });
            return;
        }
        engine.onFirstFrame = () => post({ type: 'first-frame' });
        engine.onFailed = (reason) => post({ type: 'failed', reason });
        return;
    }
    if (message.type === 'textures') {
        waiting.get(message.id)?.(message.images);
        waiting.delete(message.id);
        return;
    }
    if (!engine) return;
    switch (message.type) {
        case 'layout':
            return engine.setLayout(message.layout);
        case 'night':
            return void engine.setNight(message.night);
        case 'scroll':
            return engine.setScroll(message.progress);
        case 'units':
            return engine.setUnits(message.units);
        case 'clocks':
            return engine.setClocks(message.anchor);
        case 'pointer':
            return engine.setPointer(message.pointer);
        case 'run':
            return message.running ? engine.start() : engine.stop();
        case 'lose-context':
            return engine.loseContext();
    }
};
