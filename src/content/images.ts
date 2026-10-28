// Las capturas se publican como WebP de dos anchos (los genera scripts/images.ts). En el
// contenido, una imagen se nombra por su ruta sin extensión: "/projects/superwallet-1".
import { IMAGE_SIZES } from './data/image-sizes';

export const IMAGE_WIDTHS = [640, 1280] as const;

/** Los archivos publicados de una imagen, del más chico al más grande. */
export const imageFiles = (src: string) => IMAGE_WIDTHS.map((w) => `${src}-${w}.webp`);

/** Atributos de un <img> adaptable: src, srcSet y las medidas que reservan su espacio. */
export function responsiveImage(src: string) {
    const files = imageFiles(src);
    const size = IMAGE_SIZES[src];
    return {
        src: files[files.length - 1],
        srcSet: files.map((f, i) => `${f} ${IMAGE_WIDTHS[i]}w`).join(', '),
        width: size?.width,
        height: size?.height,
    };
}
