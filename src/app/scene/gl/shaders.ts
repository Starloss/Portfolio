// Shaders de la Escena WebGL. Cada capa es un pase que se compone sobre el anterior, en el mismo
// orden que las capas de la Escena SVG, más los efectos que la SVG no tiene: nubes y niebla con
// volumen, la luz del atardecer y el amanecer, la ciudad nocturna viva y el parallax con el mouse.
// Todo sale en alfa premultiplicado; las luces suman (alfa 0).
import { DAY, NIGHT, NIGHT_LIGHTS } from '../palette';

const rgba = (color: string) => {
    if (color.startsWith('#')) {
        const n = parseInt(color.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
    }
    const [r, g, b, a] = color.match(/[\d.]+/g)!.map(Number);
    return [r, g, b, a * 255];
};
const vec = (color: string, size: 3 | 4) =>
    `vec${size}(${rgba(color)
        .slice(0, size)
        .map((x) => (x / 255).toFixed(4))
        .join(', ')})`;

// Las coordenadas de pantalla van en px CSS, con el origen arriba a la izquierda, como en la SVG.
const SCREEN = /* glsl */ `
uniform vec2 uRes;
uniform float uDpr;
vec2 screen() { return vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr; }
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
`;

// Ruido en mosaico (noise.ts) y los colores de nubes y niebla, que viran con la Noche y el atardecer.
const ATMOSPHERE = /* glsl */ `
uniform sampler2D tNoise;
uniform float uTime;
uniform float uNight;
uniform float uDusk;
float noise1(vec2 q) { return texture(tNoise, q).r; }
float noise2(vec2 q) { return texture(tNoise, q).r * 0.7 + texture(tNoise, q * 3.1 + 0.37).g * 0.3; }
vec3 cloudColor(float lit) {
    vec3 top = mix(mix(vec3(1.0), vec3(0.55, 0.62, 0.8), uNight), vec3(1.0, 0.8, 0.62), uDusk);
    vec3 under = mix(mix(vec3(0.7, 0.77, 0.86), vec3(0.12, 0.16, 0.27), uNight), vec3(0.82, 0.42, 0.42), uDusk);
    return mix(under, top, lit);
}
`;

export const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

/** Cielo de Día y de Noche, el oscurecimiento sobre las nubes y, en el cambio, el sol bajo. */
export const SKY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
${ATMOSPHERE}
uniform float uSkyHigh;

const vec3 DAY_TOP = ${vec(DAY.skyTop, 3)};
const vec3 DAY_BOTTOM = ${vec(DAY.skyBottom, 3)};
const vec3 DAY_HIGH = ${vec(DAY.skyHigh, 3)};
const vec3 NIGHT_TOP = ${vec(NIGHT.skyTop, 3)};
const vec3 NIGHT_BOTTOM = ${vec(NIGHT.skyBottom, 3)};
const vec3 NIGHT_HIGH = ${vec(NIGHT.skyHigh, 3)};
const vec3 DUSK_TOP = vec3(0.17, 0.2, 0.42);
const vec3 DUSK_BOTTOM = vec3(1.0, 0.58, 0.36);

void main() {
    vec2 p = screen();
    float t = p.y / uRes.y;
    vec3 sky = mix(mix(DAY_TOP, DAY_BOTTOM, t), mix(NIGHT_TOP, NIGHT_BOTTOM, t), uNight);
    sky = mix(sky, mix(DUSK_TOP, DUSK_BOTTOM, smoothstep(0.0, 0.85, t)), uDusk * 0.85);
    sky = mix(sky, mix(DAY_HIGH, NIGHT_HIGH, uNight), uSkyHigh * max(0.0, 1.0 - t / 0.75));
    if (uDusk > 0.01) {
        // El sol bajo a la izquierda, con su resplandor y rayos que giran despacio.
        vec2 sun = vec2(0.12 * uRes.x, 0.6 * uRes.y);
        float d = length(p - sun) / uRes.y;
        sky += vec3(1.0, 0.55, 0.25) * uDusk * (exp(-d * 5.0) * 0.55 + smoothstep(0.04, 0.035, d));
        float rays = noise1(vec2(atan(p.y - sun.y, p.x - sun.x) * 0.3, uTime * 0.004));
        sky += vec3(1.0, 0.72, 0.42) * uDusk * smoothstep(0.5, 0.8, rays) * exp(-d * 2.2) * 0.3;
    }
    outColor = vec4(sky, 1.0);
}
`;

/** La luna con su resplandor, encima de las estrellas como en la SVG. */
export const MOON_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform float uNight;
uniform vec3 uMoon;

const vec3 MOON = ${vec(NIGHT_LIGHTS.moon, 3)};
const vec3 MOON_GLOW = vec3(1.0, 0.945, 0.769);

void main() {
    float d = length(screen() - uMoon.xy);
    // box-shadow: 0 0 28px rgba(255, 241, 196, 0.45): el disco desenfocado con sigma 14. En el
    // borde queda la mitad de la opacidad y hacia afuera cae como la función de error.
    float z = max(d - uMoon.z, 0.0) / (14.0 * 1.41421);
    // tanh de un número grande da NaN en algunas GPUs: a partir de 4 ya vale 1.
    z = min(z, 4.0);
    float glow = 0.45 * 0.5 * (1.0 - tanh(1.12838 * z + 0.10213 * z * z * z));
    float disc = smoothstep(uMoon.z + 0.75, uMoon.z - 0.75, d);
    float a = (disc + (1.0 - disc) * glow) * uNight * step(0.0, uMoon.z - 0.5);
    vec3 c = mix(MOON_GLOW, MOON, disc);
    outColor = vec4(c * a, a);
}
`;

/**
 * Una capa rasterizada: la de Día y la de Noche, mezcladas en el cambio de tema, corridas
 * `uOffset` px (el Viaje en y, el parallax en x). `uTwinkle` hace titilar las estrellas por celdas,
 * como sus grupos en la SVG, y `uRim` ilumina el borde de una cresta en el atardecer.
 */
export const LAYER_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform sampler2D tDay;
uniform sampler2D tNight;
uniform float uNight;
uniform float uDusk;
uniform vec2 uOffset;
uniform float uOpacity;
uniform float uTwinkle;
uniform float uRim;

void main() {
    vec2 uv = (screen() - uOffset) / uRes;
    if (uv.y < 0.0 || uv.y > 1.0) discard;
    // En x, el parallax deja ver el borde: se estira la última columna en vez de cortar.
    uv.x = clamp(uv.x, 0.0, 1.0);
    vec4 c = mix(texture(tDay, uv), texture(tNight, uv), uNight) * uOpacity;
    if (uRim > 0.0 && uDusk > 0.01) {
        // Opaca aquí y transparente hacia el sol (arriba a la izquierda): el borde que da a la luz.
        float edge = c.a * (1.0 - texture(tDay, uv + vec2(-2.5, -3.0) / uRes).a);
        c.rgb += vec3(1.0, 0.62, 0.3) * uDusk * uRim * edge;
    }
    if (uTwinkle >= 0.0) {
        // Tres grupos desfasados 1,7 s, de 0,85 a 0,25 de opacidad cada 5 s.
        float group = floor(hash(floor(screen() / 24.0)) * 3.0);
        float phase = fract((uTwinkle - group * 1.7) / 5.0);
        // Keyframes 0,85 → 0,25 → 0,85, con ease-in-out en cada tramo (smoothstep se le parece).
        float k = phase < 0.5 ? smoothstep(0.0, 1.0, phase * 2.0) : smoothstep(1.0, 0.0, phase * 2.0 - 1.0);
        c *= mix(0.85, 0.25, k);
    }
    outColor = c;
}
`;

/**
 * Las ventanas encendidas de Noche: titilan por celdas, cada una a su ritmo y alguna se apaga un
 * rato, y brillan alrededor (un nivel chico de mipmap es un desenfoque barato). Suman luz.
 */
export const LIGHTS_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform sampler2D tLights;
uniform float uNight;
uniform float uTime;
uniform vec2 uOffset;

void main() {
    vec2 local = screen() - uOffset;
    vec2 uv = local / uRes;
    if (uNight < 0.01 || uv.y < 0.0 || uv.y > 1.0) discard;
    uv.x = clamp(uv.x, 0.0, 1.0);
    float h = hash(floor(local / vec2(26.0, 20.0)));
    float flicker = (0.72 + 0.28 * sin(uTime * (0.5 + h * 2.0) + h * 30.0))
        * step(0.06, fract(h * 7.0 + uTime * 0.015));
    vec3 light = texture(tLights, uv).rgb * flicker + textureLod(tLights, uv, 4.0).rgb * 3.0;
    outColor = vec4(light * uNight, 0.0);
}
`;

/** Nubes lejanas con volumen: una franja de ruido que baja con la cámara, como las de la SVG. */
export const CLOUDS_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
${ATMOSPHERE}
uniform vec2 uClouds;
uniform float uParallax;

void main() {
    vec2 p = screen();
    float top = uClouds.x + 0.08 * uRes.y;
    float span = 0.47 * uRes.y;
    float band = smoothstep(top, top + span * 0.35, p.y) * (1.0 - smoothstep(top + span * 0.6, top + span, p.y));
    if (band <= 0.0 || uClouds.y <= 0.0) discard;
    float n = noise2(vec2(p.x - uParallax + uTime * 7.0, p.y * 2.2) / 1500.0);
    float d = smoothstep(0.56, 0.7, n) * band * uClouds.y * 0.85 * mix(0.9, 0.5, uNight);
    outColor = vec4(cloudColor(smoothstep(0.56, 0.8, n) * (1.0 - 0.5 * (p.y - top) / span)) * d, d);
}
`;

/** Niebla pegada a una cresta: una franja que se deshilacha con el ruido y deriva. */
export const MIST_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
${ATMOSPHERE}
uniform vec2 uMist;
uniform vec3 uFlow;

void main() {
    vec2 p = screen();
    float g = (p.y - uMist.x) / uMist.y;
    g = exp(-g * g);
    if (g < 0.03) discard;
    float m = smoothstep(0.42, 0.72, noise1(vec2(p.x + uTime * uFlow.y, p.y * 3.0) / uFlow.x)) * g;
    vec3 color = mix(mix(vec3(0.94, 0.96, 1.0), vec3(0.3, 0.37, 0.55), uNight), vec3(1.0, 0.74, 0.64), uDusk);
    float a = m * uFlow.z * (1.0 - 0.4 * uNight);
    outColor = vec4(color * a, a);
}
`;

/** Las nubes que atraviesa la cámara al bajar del Hero: van delante de todo. */
export const FRONT_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
${ATMOSPHERE}
uniform float uFront;
uniform float uHeight;
uniform float uParallax;

void main() {
    if (uFront < 0.001) discard;
    vec2 p = screen();
    vec2 q = vec2(p.x * 0.8 + uTime * 6.0 - uParallax * 2.0, p.y * 1.6 + uHeight * uRes.y * 1.8) / 1600.0;
    float n = noise2(q);
    float d = smoothstep(0.62 - 0.16 * uFront, 0.78, n) * uFront * mix(0.85, 0.55, uNight);
    outColor = vec4(cloudColor(smoothstep(0.55, 0.85, n)) * d, d);
}
`;

/** Un sprite en un rectángulo de pantalla (px): las cabinas del Teleférico. */
export const SPRITE_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
uniform vec2 uRes;
uniform vec4 uRect;
out vec2 vUv;
void main() {
    vUv = position;
    vec2 px = uRect.xy + position * uRect.zw;
    gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
}
`;

export const SPRITE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D tDay;
uniform sampler2D tNight;
uniform float uNight;
void main() {
    outColor = mix(texture(tDay, vUv), texture(tNight, vUv), uNight);
}
`;
