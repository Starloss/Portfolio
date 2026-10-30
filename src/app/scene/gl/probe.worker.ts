// Prueba de la detección previa: ¿hay WebGL2 en un OffscreenCanvas, y qué GPU hay detrás? Corre en
// un Worker para que crear el contexto no trabe la página.
import { rendererName } from './detect';

let result: { webgl2: boolean; renderer: string | null } = { webgl2: false, renderer: null };
try {
    const gl = new OffscreenCanvas(1, 1).getContext('webgl2');
    if (gl) {
        result = { webgl2: true, renderer: rendererName(gl) };
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
} catch {
    // Sin WebGL2 en OffscreenCanvas: la Escena se queda en SVG.
}
self.postMessage(result);
