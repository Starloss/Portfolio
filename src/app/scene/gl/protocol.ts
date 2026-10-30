// Mensajes entre la página y el Worker que dibuja la Escena WebGL (ADR 0003). La página no hace
// nada de WebGL: le pasa al Worker el canvas, el scroll, las medidas, el tema y el reloj de las
// animaciones de CSS, y le rasteriza las texturas cuando las pide.
import type { SceneFrame, Viewport } from '../camera';

import type { ClockAnchor } from './frame';

export type FallbackReason = 'slow' | 'context-lost' | 'init-failed';

export interface Layout {
    viewport: Viewport;
    frame: SceneFrame;
    sink: number;
    moon: { x: number; y: number } | null;
}

export interface TextureRequest {
    night: boolean;
    viewport: Viewport;
    frame: SceneFrame;
    dpr: number;
}

export type ToWorker =
    | { type: 'init'; canvas: OffscreenCanvas; dpr: number; watch: boolean }
    | { type: 'layout'; layout: Layout }
    | { type: 'night'; night: boolean }
    | { type: 'scroll'; progress: number }
    | { type: 'units'; units: { vw: number; vh: number } }
    | { type: 'clocks'; anchor: ClockAnchor }
    | { type: 'run'; running: boolean }
    | { type: 'textures'; id: number; images: Record<string, ImageBitmap> | null }
    // Solo con ?escena=webgl: lo usa Playwright para probar la vuelta a la SVG.
    | { type: 'lose-context' };

export type FromWorker =
    | { type: 'first-frame' }
    | { type: 'failed'; reason: FallbackReason }
    | ({ type: 'need-textures'; id: number } & TextureRequest);
