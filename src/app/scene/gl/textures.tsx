// Prototipo #40: las capas de la Escena WebGL salen de las mismas piezas SVG que la Escena SVG,
// rasterizadas en el navegador al tamaño de la pantalla. No hay imágenes que descargar.
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import type { SceneFrame, Viewport } from '../camera';
import { DAY, NIGHT, type ScenePalette } from '../palette';
import { Avila, City, FarRidge, HaloGradient, Macaws, Towers } from '../parts';

// Fuera del ciclo de React (un efecto no puede usar flushSync), por eso cede un turno antes.
async function markup(node: React.ReactNode): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve));
    const host = document.createElement('div');
    const root = createRoot(host);
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

// Las luces de Noche van solas, sobre las siluetas en negro: así las de atrás quedan tapadas por
// los edificios de adelante y el shader puede hacerlas titilar y brillar sin tocar las siluetas.
const BLACK = Object.fromEntries(Object.keys(DAY).map((k) => [k, '#000'])) as ScenePalette;

export interface LayerImages {
    far: HTMLImageElement;
    avila: HTMLImageElement;
    city: HTMLImageElement;
    towers: HTMLImageElement;
    cityLights?: HTMLImageElement;
    towersLights?: HTMLImageElement;
}

export async function layerImages(
    night: boolean,
    frame: SceneFrame,
    viewport: Viewport,
    scale: number,
): Promise<LayerImages> {
    const c = night ? NIGHT : DAY;
    const svg = (children: React.ReactNode) =>
        markup(
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={frame.viewBox}
                preserveAspectRatio="xMidYMax slice"
                width={Math.round(viewport.width * scale)}
                height={Math.round(viewport.height * scale)}
            >
                {children}
            </svg>,
        );
    const [far, avila, city, towers, cityLights, towersLights] = await Promise.all([
        rasterize(await svg(<FarRidge c={c} />)),
        rasterize(
            await svg(
                <>
                    <HaloGradient />
                    <Avila c={c} night={night} animate={false} cabins={false} />
                </>,
            ),
        ),
        rasterize(await svg(<City c={c} night={false} animate={false} />)),
        rasterize(await svg(<Towers c={c} night={false} animate={false} />)),
        night ? rasterize(await svg(<City c={BLACK} night animate={false} />)) : undefined,
        night ? rasterize(await svg(<Towers c={BLACK} night animate={false} />)) : undefined,
    ]);
    return { far, avila, city, towers, cityLights, towersLights };
}

/** La pareja de guacamayas recortada en su propio sprite: en WebGL cruzan el cielo. */
export const MACAW_BOX = { x: 1110, y: 150, width: 200, height: 110 };

export async function macawImage(): Promise<HTMLImageElement> {
    const { x, y, width, height } = MACAW_BOX;
    return rasterize(
        await markup(
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`${x} ${y} ${width} ${height}`}
                width={width * 3}
                height={height * 3}
            >
                <Macaws animate={false} />
            </svg>,
        ),
    );
}

/** Ruido de valor fractal que se repite en mosaico: R y G son dos semillas distintas. */
export function noiseData(size = 256): Uint8Array {
    const data = new Uint8Array(size * size * 4);
    const lattice = (seed: number, cells: number) => {
        const values = new Float32Array(cells * cells);
        let s = seed;
        for (let i = 0; i < values.length; i++) {
            s = (s * 16807) % 2147483647;
            values[i] = s / 2147483647;
        }
        return (x: number, y: number) => {
            const x0 = Math.floor(x);
            const y0 = Math.floor(y);
            const fx = x - x0;
            const fy = y - y0;
            const sx = fx * fx * (3 - 2 * fx);
            const sy = fy * fy * (3 - 2 * fy);
            const at = (i: number, j: number) =>
                values[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
            const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
            const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
            return top + (bottom - top) * sy;
        };
    };
    const octaves = (seed: number) =>
        [4, 8, 16, 32, 64].map((cells, i) => ({ fn: lattice(seed + i * 101, cells), cells }));
    const channels = [octaves(7), octaves(9137)];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            channels.forEach((oct, ch) => {
                let v = 0;
                let amp = 0.5;
                let total = 0;
                for (const { fn, cells } of oct) {
                    v += fn((x / size) * cells, (y / size) * cells) * amp;
                    total += amp;
                    amp *= 0.5;
                }
                data[(y * size + x) * 4 + ch] = Math.round((v / total) * 255);
            });
            data[(y * size + x) * 4 + 3] = 255;
        }
    }
    return data;
}
