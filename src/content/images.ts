// Las capturas se publican como WebP de dos anchos (los genera scripts/images.ts). En el
// contenido, una imagen se nombra por su ruta sin extensión: "/projects/superwallet-1".
import { IMAGE_SIZES } from './data/image-sizes';

export const IMAGE_WIDTHS = [640, 1280] as const;

/** Los archivos publicados de una imagen, del más chico al más grande. */
export const imageFiles = (src: string) => IMAGE_WIDTHS.map((w) => `${src}-${w}.webp`);

/**
 * Atributos de un <img> adaptable: src, srcSet y las medidas que reservan su espacio. El script
 * no agranda las imágenes, así que una captura más angosta que un ancho trae ese archivo con su
 * ancho real; si dos archivos quedan iguales, se declara solo el primero.
 */
export function responsiveImage(src: string) {
    const files = imageFiles(src);
    const size = IMAGE_SIZES[src];
    const candidates: string[] = [];
    let previous = 0;
    IMAGE_WIDTHS.forEach((width, i) => {
        const real = size ? Math.min(width, size.width) : width;
        if (real > previous) candidates.push(`${files[i]} ${real}w`);
        previous = real;
    });
    return {
        src: files[files.length - 1],
        srcSet: candidates.join(', '),
        width: size?.width,
        height: size?.height,
    };
}
