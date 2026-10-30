// El reloj de la Escena WebGL es el de las animaciones de CSS de la Escena SVG, que siguen
// corriendo aunque la SVG no se pinte y se detienen con ella: así las dos van en fase.
import type { Clocks } from './frame';

function cssClock(anim: string): number | null {
    const el = document.querySelector(`.scene [data-anim='${anim}']`);
    const time = el?.getAnimations?.()[0]?.currentTime;
    return typeof time === 'number' ? time / 1000 : null;
}

/** Segundos de cada animación; si no está montada (p. ej. las guacamayas de Noche), `fallback`. */
export function readClocks(fallback: number): Clocks {
    return {
        cabins: cssClock('cabin') ?? fallback,
        macaws: cssClock('macaws') ?? fallback,
        twinkle: cssClock('twinkle') ?? fallback,
    };
}
