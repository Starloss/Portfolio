// Lo que la Escena lee del entorno además del tema y las media queries.
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
    useSyncExternalStore,
    type RefObject,
} from 'react';
import { caracasNow, useCaracasClock, useClima } from '@lib/clima';

import type { Viewport } from './camera';
import {
    afluenciaAt,
    dayKind,
    lluviaDe,
    readForcedDay,
    readForcedTrafico,
    traficoAt,
    type AfluenciaParams,
    type NivelTrafico,
} from './rhythm';
import { sky, type Sky } from './sky';

/** Tamaño de un elemento; hasta poder medirlo (o si mide 0, como en jsdom), el de la ventana. */
export function useElementViewport(ref: RefObject<HTMLElement | null>): Viewport {
    const [size, setSize] = useState<Viewport>(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
    }));
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            setSize((prev) =>
                prev.width === width && prev.height === height ? prev : { width, height },
            );
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return size;
}

const onVisibilityChange = (onChange: () => void) => {
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
};

export const useDocumentHidden = () =>
    useSyncExternalStore(onVisibilityChange, () => document.visibilityState === 'hidden');

// Algo que tapa la Escena a pantalla completa (el visor de la galería) la pausa mientras está abierto.
let covers = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Marca la Escena como tapada mientras `active` sea verdadero. */
export function useCoverScene(active: boolean) {
    useEffect(() => {
        if (!active) return;
        covers++;
        notify();
        return () => {
            covers--;
            notify();
        };
    }, [active]);
}

const onCoverChange = (onChange: () => void) => {
    listeners.add(onChange);
    return () => {
        listeners.delete(onChange);
    };
};

export const useSceneCovered = () => useSyncExternalStore(onCoverChange, () => covers > 0);

const skyNow = (): Sky => sky(caracasNow());
const SKY_REFRESH_MS = 60_000;

/** El sol y la luna sobre Caracas ahora: avanzan solos, de a un minuto. */
export function useCaracasSky(): Sky {
    const [current, setCurrent] = useState(skyNow);
    useEffect(() => {
        const timer = window.setInterval(() => setCurrent(skyNow()), SKY_REFRESH_MS);
        return () => window.clearInterval(timer);
    }, []);
    return current;
}

/**
 * La gente de la Avenida ahora: la Afluencia por la hora y el tipo de día de Caracas (o el que fije
 * `?dia=`) y el Clima. Cambia con el minuto y con el Clima.
 */
export function useAfluencia(): AfluenciaParams {
    const { hour, minute } = useCaracasClock();
    const estado = useClima()?.estado ?? null;
    const day = dayKind(caracasNow(), readForcedDay(window.location.search));
    const afluencia = afluenciaAt(hour + minute / 60, day, estado);
    const lluvia = lluviaDe(estado);
    // Un objeto nuevo solo si algo cambió: así los efectos que lo usan no se repiten en cada render.
    return useMemo(() => ({ afluencia, lluvia }), [afluencia, lluvia]);
}

/**
 * El nivel de Tráfico de la Avenida ahora: por la hora, el tipo de día y el Clima de Caracas, o el
 * que fije `?trafico=`. Cambia con el minuto y con el Clima.
 */
export function useTrafico(): NivelTrafico {
    const { hour, minute } = useCaracasClock();
    const estado = useClima()?.estado ?? null;
    const search = window.location.search;
    return (
        readForcedTrafico(search) ??
        traficoAt(hour + minute / 60, dayKind(caracasNow(), readForcedDay(search)), estado)
    );
}
