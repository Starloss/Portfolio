// Las texturas de la Escena WebGL salen de las mismas piezas SVG que la Escena SVG, rasterizadas en
// el navegador al tamaño de la pantalla: una sola fuente de verdad y nada que descargar.
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { CABIN_WIDTH, type SceneFrame, type Viewport } from '../camera';
import { DAY, NIGHT, type ScenePalette } from '../palette';
import {
    Avenue,
    Avila,
    CabinShape,
    City,
    FarRidge,
    HaloGradient,
    LampGradient,
    Macaws,
    Towers,
} from '../parts';
import { STREET_ABOVE, streetHeight } from '../street';

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
    | 'macaws'
    | 'cabin'
    | 'cityLights'
    | 'towersLights'
    | 'street';

// Las luces de Noche van aparte, sobre las siluetas en negro: así las de atrás quedan tapadas por
// los edificios de adelante, y el shader puede hacerlas titilar y brillar sin tocar las siluetas.
const BLACK = Object.fromEntries(Object.keys(DAY).map((k) => [k, '#000'])) as ScenePalette;

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
    const H = streetHeight(viewport.height);
    const streetSize = { width: viewport.width, height: H * (1 + STREET_ABOVE) };
    const [
        far,
        avilaBack,
        avilaFront,
        city,
        towers,
        macaws,
        cabin,
        cityLights,
        towersLights,
        street,
    ] = await Promise.all([
        full(<FarRidge c={c} />),
        full(<Avila c={c} {...still} slice="back" />),
        full(
            <>
                <HaloGradient />
                <Avila c={c} {...still} slice="front" />
            </>,
        ),
        // De Noche, las siluetas sin ventanas: las ventanas van en las texturas de luces.
        full(<City c={c} night={false} animate={false} />),
        full(<Towers c={c} night={false} animate={false} />),
        night ? null : full(<Macaws animate={false} />),
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
        night ? full(<City c={BLACK} night animate={false} />) : undefined,
        night ? full(<Towers c={BLACK} night animate={false} />) : undefined,
        // La calle sin gente ni vehículos: la WebGL los dibuja aparte, en movimiento.
        markup(
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${streetSize.width} ${streetSize.height}`}
                width={Math.round(streetSize.width * dpr)}
                height={Math.round(streetSize.height * dpr)}
            >
                <LampGradient />
                <Avenue c={c} width={viewport.width} height={H} night={night} agents={false} />
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
        street,
        ...(night ? { cityLights, towersLights } : {}),
        ...(macaws ? { macaws } : {}),
    };
}
