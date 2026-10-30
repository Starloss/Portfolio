// Las texturas de la Escena WebGL salen de las mismas piezas SVG que la Escena SVG, rasterizadas en
// el navegador al tamaño de la pantalla: una sola fuente de verdad y nada que descargar.
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { CABIN_WIDTH, type SceneFrame, type Viewport } from '../camera';
import { DAY, NIGHT } from '../palette';
import { Avila, CabinShape, City, FarRidge, HaloGradient, Macaws, Stars, Towers } from '../parts';

// Fuera del ciclo de React (un efecto no puede usar flushSync), por eso cede un turno antes.
async function markup(node: React.ReactNode): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve));
    const host = document.createElement('div');
    const root = createRoot(host);
    // Hace falta el SVG ya renderizado para serializarlo; es un árbol aparte, fuera de la página.
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync
    flushSync(() => root.render(node));
    // XMLSerializer y no innerHTML: así el SVG sale como XML válido, con su namespace.
    const xml = new XMLSerializer().serializeToString(host.firstElementChild!);
    root.unmount();
    return xml;
}

async function rasterize(svg: string): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export type LayerName =
    | 'far'
    | 'avilaBack'
    | 'avilaFront'
    | 'city'
    | 'towers'
    | 'stars'
    | 'macaws'
    | 'cabin';

/** Las capas de un tema, al tamaño de la pantalla × dpr. Las de un solo tema faltan en el otro. */
export async function themeLayers(
    night: boolean,
    frame: SceneFrame,
    viewport: Viewport,
    dpr: number,
): Promise<Partial<Record<LayerName, HTMLImageElement>>> {
    const c = night ? NIGHT : DAY;
    const full = (children: React.ReactNode) =>
        markup(
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={frame.viewBox}
                preserveAspectRatio="xMidYMax slice"
                width={Math.round(viewport.width * dpr)}
                height={Math.round(viewport.height * dpr)}
            >
                {children}
            </svg>,
        ).then(rasterize);
    const still = { night, animate: false };
    const [far, avilaBack, avilaFront, city, towers, extra, cabin] = await Promise.all([
        full(<FarRidge c={c} />),
        full(<Avila c={c} {...still} slice="back" />),
        full(
            <>
                <HaloGradient />
                <Avila c={c} {...still} slice="front" />
            </>,
        ),
        full(<City c={c} {...still} />),
        full(<Towers c={c} {...still} />),
        full(night ? <Stars count={60} groups={3} animate={false} /> : <Macaws animate={false} />),
        markup(
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-6 0 12 17"
                width={Math.round(CABIN_WIDTH * frame.scale * dpr)}
                height={Math.round(17 * frame.scale * dpr)}
            >
                <CabinShape c={c} />
            </svg>,
        ).then(rasterize),
    ]);
    return {
        far,
        avilaBack,
        avilaFront,
        city,
        towers,
        cabin,
        ...(night ? { stars: extra } : { macaws: extra }),
    };
}
