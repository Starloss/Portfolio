// Imagen OG de 1200 × 630: la Escena de Día en el encuadre del Hero, con el texto en el cielo.
// Usa las mismas piezas SVG que el sitio, con los colores de Día en vez de variables CSS.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import { heroSink, sceneFrame } from '@app/scene/camera';
import { skyline } from '@app/scene/geometry';
import { DAY } from '@app/scene/palette';
import { Avila, City, FarRidge, Macaws, Towers } from '@app/scene/parts';

import { OG_SIZE, type OgCard } from '../artifacts';

import { woffToSfnt } from './woff';

const FONT = { pkg: 'space-grotesk', file: 'space-grotesk-latin-700-normal.woff' };

let fontFile: string | null = null;

// resvg solo carga fuentes desde archivos TTF/OTF: el WOFF de Fontsource se convierte una vez y se
// deja en una carpeta temporal fija, que cada build sobrescribe.
function loadFont(): string {
    if (fontFile) return fontFile;
    const dir = path.join(os.tmpdir(), 'portfolio-og-fonts');
    fs.mkdirSync(dir, { recursive: true });
    const woff = fs.readFileSync(
        path.resolve(process.cwd(), 'node_modules', '@fontsource', FONT.pkg, 'files', FONT.file),
    );
    fontFile = path.join(dir, FONT.file.replace(/\.woff$/, '.ttf'));
    fs.writeFileSync(fontFile, woffToSfnt(woff));
    return fontFile;
}

const MARGIN = 64;
const INK = '#0f172a';
const CHIP = '#1e40af';

// Ancho aproximado de un texto: alcanza para dejar el paisaje por debajo de la columna de texto.
const textWidth = (text: string, size: number, em: number) => text.length * size * em;

function layout(card: OgCard) {
    const titleSize = Math.min(84, 1000 / (card.title.length * 0.6));
    const chip = { size: 26, padX: 18, height: 46 };
    const chipWidth = textWidth(card.label, chip.size, 0.56) + chip.padX * 2;
    if (card.detail) {
        // Caso de estudio: rótulo arriba, título y tech.
        const chipTop = 72;
        const titleBase = chipTop + chip.height + 24 + titleSize * 0.8;
        const detailBase = titleBase + 52;
        return {
            chip: { ...chip, top: chipTop, width: chipWidth },
            title: { size: titleSize, base: titleBase },
            detail: { size: 28, base: detailBase },
            bottom: detailBase + 10,
            right:
                MARGIN +
                Math.max(
                    chipWidth,
                    textWidth(card.title, titleSize, 0.6),
                    textWidth(card.detail, 28, 0.56),
                ),
        };
    }
    // Home: nombre grande y el rol en un chip debajo, como en el Hero.
    const titleBase = 96 + titleSize * 0.8;
    const chipTop = titleBase + 28;
    return {
        chip: { ...chip, top: chipTop, width: chipWidth },
        title: { size: titleSize, base: titleBase },
        detail: null,
        bottom: chipTop + chip.height,
        right: MARGIN + Math.max(chipWidth, textWidth(card.title, titleSize, 0.6)),
    };
}

export function ogSvg(card: OgCard): string {
    const { width, height } = OG_SIZE;
    const viewport = { width, height };
    const frame = sceneFrame(viewport);
    const l = layout(card);
    const sink = heroSink(
        viewport,
        { left: MARGIN - 16, right: l.right + 16, top: 0, bottom: l.bottom },
        skyline(false),
    );
    const landscape = (y: number, children: React.ReactNode) => (
        <svg
            x={0}
            y={y}
            width={width}
            height={height}
            viewBox={frame.viewBox}
            preserveAspectRatio="xMidYMax slice"
        >
            {children}
        </svg>
    );
    return renderToStaticMarkup(
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
            <defs>
                <linearGradient id="og-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: DAY.skyTop }} />
                    <stop offset="1" style={{ stopColor: DAY.skyBottom }} />
                </linearGradient>
            </defs>
            <rect width={width} height={height} style={{ fill: 'url(#og-sky)' }} />
            {landscape(0, <Macaws animate={false} />)}
            {landscape(
                sink,
                <>
                    <FarRidge c={DAY} />
                    <Avila c={DAY} night={false} animate={false} stillCabins />
                    <City c={DAY} night={false} animate={false} />
                    <Towers c={DAY} night={false} animate={false} />
                </>,
            )}
            <text
                x={MARGIN}
                y={l.title.base}
                fontFamily="Space Grotesk"
                fontWeight={700}
                fontSize={l.title.size}
                style={{ fill: INK }}
            >
                {card.title}
            </text>
            <rect
                x={MARGIN}
                y={l.chip.top}
                width={l.chip.width}
                height={l.chip.height}
                rx={l.chip.height / 2}
                style={{ fill: CHIP }}
            />
            <text
                x={MARGIN + l.chip.padX}
                y={l.chip.top + l.chip.height / 2 + l.chip.size * 0.36}
                fontFamily="Space Grotesk"
                fontWeight={700}
                fontSize={l.chip.size}
                style={{ fill: '#ffffff' }}
            >
                {card.label}
            </text>
            {l.detail && (
                <text
                    x={MARGIN}
                    y={l.detail.base}
                    fontFamily="Space Grotesk"
                    fontWeight={700}
                    fontSize={l.detail.size}
                    style={{ fill: INK }}
                >
                    {card.detail}
                </text>
            )}
        </svg>,
    );
}

export async function renderOgImage(card: OgCard): Promise<Buffer> {
    const resvg = new Resvg(ogSvg(card), {
        font: {
            fontFiles: [loadFont()],
            loadSystemFonts: false,
            defaultFontFamily: 'Space Grotesk',
        },
    });
    return Buffer.from(resvg.render().asPng());
}

/** Ancho y alto de un PNG, leídos de su cabecera IHDR. */
export function pngSize(png: Buffer): { width: number; height: number } {
    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}
