// Shaders de la Escena WebGL. Cada capa es un pase que se compone sobre el anterior, en el mismo
// orden que las capas de la Escena SVG. Todo sale en alfa premultiplicado.
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
`;

export const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

/** Cielo de Día y de Noche y el oscurecimiento sobre las nubes. */
export const SKY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform float uNight;
uniform float uSkyHigh;

const vec3 DAY_TOP = ${vec(DAY.skyTop, 3)};
const vec3 DAY_BOTTOM = ${vec(DAY.skyBottom, 3)};
const vec3 DAY_HIGH = ${vec(DAY.skyHigh, 3)};
const vec3 NIGHT_TOP = ${vec(NIGHT.skyTop, 3)};
const vec3 NIGHT_BOTTOM = ${vec(NIGHT.skyBottom, 3)};
const vec3 NIGHT_HIGH = ${vec(NIGHT.skyHigh, 3)};

void main() {
    vec2 p = screen();
    float t = p.y / uRes.y;
    vec3 sky = mix(mix(DAY_TOP, DAY_BOTTOM, t), mix(NIGHT_TOP, NIGHT_BOTTOM, t), uNight);
    sky = mix(sky, mix(DAY_HIGH, NIGHT_HIGH, uNight), uSkyHigh * max(0.0, 1.0 - t / 0.75));
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
 * `uOffset` px. `uTwinkle` hace titilar las estrellas por celdas, como sus grupos en la SVG.
 */
export const LAYER_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform sampler2D tDay;
uniform sampler2D tNight;
uniform float uNight;
uniform vec2 uOffset;
uniform float uOpacity;
uniform float uTwinkle;

float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
    vec2 uv = (screen() - uOffset) / uRes;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
    vec4 c = mix(texture(tDay, uv), texture(tNight, uv), uNight) * uOpacity;
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

/** Las tres nubes lejanas: gradientes radiales como los de CSS, que derivan de lado a lado. */
export const CLOUDS_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform float uNight;
uniform vec4 uCloud0;
uniform vec4 uCloud1;
uniform vec4 uCloud2;
uniform float uOpacity;

const vec4 DAY_CLOUD = ${vec(DAY.cloud, 4)};
const vec4 NIGHT_CLOUD = ${vec(NIGHT.cloud, 4)};

// Cada nube: centro (xy) y semiejes (zw) en px; closest-side de una caja da una elipse.
vec4 acc = vec4(0.0);
void cloud(vec2 p, vec4 c, vec4 color) {
    float d = length((p - c.xy) / c.zw);
    float a = color.a * max(0.0, 1.0 - d);
    acc = vec4(color.rgb * a, a) + acc * (1.0 - a);
}

void main() {
    vec2 p = screen();
    vec4 color = mix(DAY_CLOUD, NIGHT_CLOUD, uNight);
    cloud(p, uCloud0, color);
    cloud(p, uCloud1, color);
    cloud(p, uCloud2, color);
    outColor = acc * uOpacity;
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
