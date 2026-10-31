// El sol y la luna sobre Caracas en un instante, sin red y sin dependencias: fórmulas de baja
// precisión del Astronomical Almanac, de sobra para una Escena decorativa. No dependen de ninguna
// zona horaria: parten del tiempo UTC y de las coordenadas.
const { PI, sin, cos, tan, asin, atan2 } = Math;
const R = PI / 180;
const LAT = 10.4806 * R;
const LON = -66.9036;
const SIN_LAT = sin(LAT);
const COS_LAT = cos(LAT);
const OBLIQUITY = 23.4393 * R;

const equatorial = (longitude: number, latitude: number) => ({
    ra: atan2(sin(longitude) * cos(OBLIQUITY) - tan(latitude) * sin(OBLIQUITY), cos(longitude)),
    dec: asin(sin(latitude) * cos(OBLIQUITY) + cos(latitude) * sin(OBLIQUITY) * sin(longitude)),
});

const horizontal = (days: number, ra: number, dec: number) => {
    const hour = (280.46062 + 360.98564737 * days + LON) * R - ra;
    return { hour, alt: asin(SIN_LAT * sin(dec) + COS_LAT * cos(dec) * cos(hour)) };
};

type Term = readonly [amplitude: number, phase: number, rate: number];
const series = (T: number, terms: readonly Term[], wave: (x: number) => number) =>
    terms.reduce((sum, [a, b, c]) => sum + a * wave((b + c * T) * R), 0);

const MOON_LONGITUDE: readonly Term[] = [
    [6.29, 135, 477198.87],
    [-1.27, 259.3, -413335.36],
    [0.66, 235.7, 890534.22],
    [0.21, 269.9, 954397.74],
    [-0.19, 357.5, 35999.05],
    [-0.11, 186.5, 966404.03],
];
const MOON_LATITUDE: readonly Term[] = [
    [5.13, 93.3, 483202.02],
    [0.28, 228.2, 960400.89],
    [-0.28, 318.3, 6003.15],
    [-0.17, 217.6, -407332.21],
];
const MOON_PARALLAX: readonly Term[] = [
    [0.0518, 135, 477198.87],
    [0.0095, 259.3, -413335.36],
    [0.0078, 235.7, 890534.22],
    [0.0028, 269.9, 954397.74],
];

/** Ángulo horario en grados, de -180 a 180: negativo al este del meridiano, positivo al oeste. */
const hourDegrees = (hour: number) => ((((hour / R + 180) % 360) + 360) % 360) - 180;

export interface Sky {
    /** Altura sobre el horizonte y ángulo horario, en grados. */
    sun: { alt: number; hour: number };
    /** Además, fracción iluminada (0 a 1) y hacia dónde mira esa parte, desde arriba y antihorario. */
    moon: { alt: number; hour: number; fraction: number; tilt: number };
}

/** El sol y la luna sobre Caracas en un instante (ms desde el epoch). */
export function sky(ms: number): Sky {
    const days = ms / 864e5 - 10957.5;
    const T = days / 36525;
    const g = (357.528 + 0.9856003 * days) * R;
    const sunLongitude = (280.46 + 0.9856474 * days + 1.915 * sin(g) + 0.02 * sin(2 * g)) * R;
    const sunEq = equatorial(sunLongitude, 0);
    const sun = horizontal(days, sunEq.ra, sunEq.dec);

    const moonLongitude = (218.32 + 481267.881 * T + series(T, MOON_LONGITUDE, sin)) * R;
    const moonLatitude = series(T, MOON_LATITUDE, sin) * R;
    const parallax = (0.9508 + series(T, MOON_PARALLAX, cos)) * R;
    const moonEq = equatorial(moonLongitude, moonLatitude);
    const moon = horizontal(days, moonEq.ra, moonEq.dec);

    const raGap = sunEq.ra - moonEq.ra;
    const limb = atan2(
        cos(sunEq.dec) * sin(raGap),
        sin(sunEq.dec) * cos(moonEq.dec) - cos(sunEq.dec) * sin(moonEq.dec) * cos(raGap),
    );
    const parallactic = atan2(
        sin(moon.hour),
        tan(LAT) * cos(moonEq.dec) - sin(moonEq.dec) * cos(moon.hour),
    );
    return {
        sun: { alt: sun.alt / R, hour: hourDegrees(sun.hour) },
        moon: {
            alt: (moon.alt - parallax * cos(moon.alt)) / R,
            hour: hourDegrees(moon.hour),
            fraction: (1 - cos(moonLongitude - sunLongitude)) / 2,
            tilt: (limb - parallactic) / R,
        },
    };
}
