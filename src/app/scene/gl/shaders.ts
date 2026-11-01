// Shaders de la Escena WebGL. Cada capa es un pase que se compone sobre el anterior, en el mismo
// orden que las capas de la Escena SVG, más los efectos que la SVG no tiene: nubes y niebla con
// volumen, la luz del atardecer y el amanecer, la ciudad nocturna viva y el parallax con el mouse.
// Todo sale en alfa premultiplicado; las luces suman (alfa 0).
import { DAY, NIGHT, NIGHT_LIGHTS } from '../palette';
import { PIVOT } from '../vault';

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
// Son sus propios tonos de luz y sombra, no los de palette.ts: allí las nubes son planas.
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

/** Cielo de Día y de Noche, el oscurecimiento sobre las nubes, las estrellas y el sol. */
export const SKY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform float uTime;
uniform float uNight;
uniform float uSkyHigh;
uniform vec3 uSun;
uniform float uSunAlpha;
uniform vec2 uStars;
uniform float uSweep;
uniform vec3 uClima;
uniform float uBoltX;

const vec3 DAY_TOP = ${vec(DAY.skyTop, 3)};
const vec3 DAY_BOTTOM = ${vec(DAY.skyBottom, 3)};
const vec3 DAY_HIGH = ${vec(DAY.skyHigh, 3)};
const vec3 NIGHT_TOP = ${vec(NIGHT.skyTop, 3)};
const vec3 NIGHT_BOTTOM = ${vec(NIGHT.skyBottom, 3)};
const vec3 NIGHT_HIGH = ${vec(NIGHT.skyHigh, 3)};
const vec3 DUSK_BAND = vec3(1.0, 0.56, 0.32);

void main() {
    vec2 p = screen();
    float t = p.y / uRes.y;
    // La Bóveda celeste: el día y la noche son dos mitades del cielo que giran, con el ocaso entre ellas.
    vec2 pivot = vec2(${PIVOT.x.toFixed(3)}, ${PIVOT.y.toFixed(3)}) * uRes;
    float nightHere = uNight;
    float band = 0.0;
    if (uSweep >= 0.0) {
        vec2 toSun = vec2(-sin(uSweep), -cos(uSweep));
        float s = dot((p - pivot) / uRes.y, toSun);
        nightHere = 1.0 - smoothstep(-0.12, 0.12, s);
        band = exp(-(s / 0.14) * (s / 0.14));
    }
    vec3 sky = mix(mix(DAY_TOP, DAY_BOTTOM, t), mix(NIGHT_TOP, NIGHT_BOTTOM, t), nightHere);
    sky = mix(sky, DUSK_BAND, band * 0.9);
    // El Clima: x cobertura, y oscuridad, z la luz del rayo.
    vec3 overcast = mix(vec3(0.63, 0.69, 0.74), vec3(0.055, 0.075, 0.12), nightHere);
    sky = mix(sky, overcast, uClima.x * uClima.x * 0.85);
    sky *= 1.0 - uClima.y * 0.6;
    if (uClima.z > 0.001) {
        float glow = 0.3 * exp(-length(p - vec2(uBoltX * uRes.x, 0.45 * uRes.y)) / (0.28 * uRes.y));
        sky += vec3(0.85, 0.88, 1.0) * uClima.z * (0.14 + glow);
    }
    sky = mix(sky, mix(DAY_HIGH, NIGHT_HIGH, uNight), uSkyHigh * max(0.0, 1.0 - t / 0.75));
    // Las estrellas giran alrededor del mismo punto, y titilan cada una a su ritmo.
    if (uStars.x > 0.001) {
        float c = cos(uStars.y), sn = sin(uStars.y);
        vec2 rel = p - pivot;
        vec2 q = vec2(c * rel.x + sn * rel.y, -sn * rel.x + c * rel.y) / 64.0;
        vec2 id = floor(q);
        float h = hash(id);
        vec2 at = vec2(hash(id + 1.3), hash(id + 2.7));
        float d0 = length(fract(q) - at) * 64.0;
        float star = step(0.76, h) * (1.0 - smoothstep(0.5, 1.5, d0));
        float twinkle = 0.6 + 0.4 * sin(uTime * (0.8 + h * 2.0) + h * 40.0);
        sky += star * twinkle * uStars.x * nightHere * (1.0 - smoothstep(0.55, 0.9, t));
    }
    // El sol: blanco de día, naranja cerca de la franja de ocaso.
    if (uSunAlpha > 0.001) {
        float d = length(p - uSun.xy * uRes);
        vec3 warm = mix(vec3(1.0, 0.93, 0.72), vec3(1.0, 0.55, 0.25), band);
        float glow = exp(-d / (uSun.z * 3.0)) * 0.45;
        sky += warm * uSunAlpha * (glow + 1.0 - smoothstep(uSun.z - 0.75, uSun.z + 0.75, d));
    }
    outColor = vec4(sky, 1.0);
}
`;

/** La luna con su fase y su resplandor, encima de las estrellas como en la SVG. */
export const MOON_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
uniform vec3 uMoon;
uniform float uFraction;
uniform float uRotation;
uniform float uAlpha;

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
    float disc = 1.0 - smoothstep(uMoon.z - 0.75, uMoon.z + 0.75, d);
    // La fase: el borde entre la luz y la sombra, con el disco oscuro apenas visible (como moonPath).
    float ca = cos(uRotation), sa = sin(uRotation);
    vec2 r = (screen() - uMoon.xy) / max(uMoon.z, 1.0);
    r = vec2(ca * r.x + sa * r.y, -sa * r.x + ca * r.y);
    float edge = (1.0 - 2.0 * uFraction) * sqrt(max(0.0, 1.0 - r.y * r.y));
    float lit = smoothstep(-0.03, 0.03, r.x - edge);
    float a = (disc * (0.07 + 0.93 * lit) + (1.0 - disc) * glow * uFraction) * uAlpha * step(0.0, uMoon.z - 0.5);
    vec3 c = mix(MOON_GLOW, MOON, disc);
    outColor = vec4(c * a, a);
}
`;

/**
 * Una capa rasterizada: la de Día y la de Noche, mezcladas en el cambio de tema, corridas
 * `uOffset` px (el Viaje de cámara en y, el parallax del mouse en x). `uRim` ilumina el borde de
 * una cresta en el atardecer.
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
uniform float uShade;
uniform float uRim;
uniform float uSunSide;
// Lo que mide la capa en px: la pantalla, salvo la calle, que es una franja.
uniform vec2 uSize;

void main() {
    vec2 uv = (screen() - uOffset) / uSize;
    if (uv.y < 0.0 || uv.y > 1.0) discard;
    // En x, el parallax deja ver el borde: se estira la última columna en vez de cortar.
    uv.x = clamp(uv.x, 0.0, 1.0);
    vec4 c = mix(texture(tDay, uv), texture(tNight, uv), uNight) * uOpacity;
    c.rgb *= 1.0 - uShade;
    if (uRim > 0.0 && uDusk > 0.01) {
        // Opaca aquí y transparente hacia el sol (arriba, del lado del sol): el borde que da a la luz.
        float edge = c.a * (1.0 - texture(tDay, uv + vec2(2.5 * uSunSide, -3.0) / uRes).a);
        c.rgb += vec3(1.0, 0.62, 0.3) * uDusk * uRim * edge;
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
uniform float uCell;

void main() {
    vec2 local = screen() - uOffset;
    vec2 uv = local / uRes;
    if (uNight < 0.01 || uv.y < 0.0 || uv.y > 1.0) discard;
    uv.x = clamp(uv.x, 0.0, 1.0);
    // Celdas del tamaño de unas pocas ventanas, que escalan con la Escena (uCell = frame.scale).
    float h = hash(floor(local / (vec2(26.0, 20.0) * uCell)));
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
uniform vec3 uCloudW;

void main() {
    vec2 p = screen();
    // Con más cobertura, hay más nubes y ocupan más cielo; sin ninguna, un cielo despejado.
    float cover = uCloudW.x;
    if (cover <= 0.001) discard;
    // Las nubes de siempre (sin Clima, cobertura 0,25) bajan y se apagan con la cámara. Las del Clima,
    // desde parcial (0,42), siguen ahí desde la calle: están lejos, así que casi no se mueven.
    float stay = smoothstep(0.25, 0.42, cover);
    float shift = uClouds.x * (1.0 - 0.85 * stay);
    float seen = max(uClouds.y, stay);
    float top = shift + (0.08 - 0.3 * cover) * uRes.y;
    float span = (0.47 + 0.75 * cover) * uRes.y;
    float band = smoothstep(top, top + span * 0.35, p.y) * (1.0 - smoothstep(top + span * 0.6, top + span, p.y));
    if (band <= 0.0 || seen <= 0.0) discard;
    float n = noise2(vec2(p.x - uParallax + uTime * 7.0, p.y * 1.9) / 1100.0);
    float lo = mix(0.68, 0.3, cover);
    float d = smoothstep(lo, lo + 0.13, n) * band * seen * smoothstep(0.0, 0.1, cover) * mix(0.92, 0.5 + 0.28 * cover, uNight);
    // El rayo también se ve dentro de las nubes: si no, un cielo cubierto lo taparía.
    vec3 lit = cloudColor(smoothstep(lo, lo + 0.34, n)) * (1.0 - uCloudW.y * 0.6) + vec3(0.85, 0.88, 1.0) * uCloudW.z * 0.35;
    outColor = vec4(lit * d, d);
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
uniform float uMistBoost;

void main() {
    vec2 p = screen();
    float g = (p.y - uMist.x) / uMist.y;
    g = exp(-g * g);
    if (g < 0.03) discard;
    float m = smoothstep(0.42, 0.72, noise1(vec2(p.x + uTime * uFlow.y, p.y * 3.0) / uFlow.x)) * g;
    vec3 color = mix(mix(vec3(0.94, 0.96, 1.0), vec3(0.3, 0.37, 0.55), uNight), vec3(1.0, 0.74, 0.64), uDusk);
    float a = min(1.0, m * uFlow.z * (1.0 - 0.4 * uNight) * (1.0 + uMistBoost));
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

/** La lluvia, en dos planos de gotas, y la línea del rayo. Cada pase usa solo una de las dos. */
export const CLIMA_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;
${SCREEN}
${ATMOSPHERE}
uniform float uRain;
uniform vec3 uBolt;

float streaks(vec2 p, float width, float speed, float density) {
    vec2 q = vec2(p.x + p.y * 0.13, p.y);
    float col = floor(q.x / width);
    float h = hash(vec2(col, 7.0));
    float along = (q.y - uTime * speed * (0.8 + 0.4 * h) + h * 900.0) / (120.0 + 160.0 * h);
    float y = fract(along);
    float on = step(1.0 - density, hash(vec2(col, floor(along))));
    float across = 1.0 - abs(fract(q.x / width) - 0.5) * 2.0;
    return on * smoothstep(0.0, 0.04, y) * (1.0 - smoothstep(0.04, 0.3, y)) * smoothstep(0.3, 0.8, across);
}

void main() {
    vec2 p = screen();
    float a = 0.0;
    if (uRain > 0.001) {
        a = (streaks(p, 7.0, 900.0, 0.5 * uRain) * 0.5 + streaks(p + 13.0, 4.0, 620.0, 0.5 * uRain) * 0.28) * 0.6;
    }
    vec3 color = mix(vec3(0.82, 0.88, 0.95), vec3(0.5, 0.6, 0.76), uNight) * a;
    if (uBolt.y > 0.001) {
        float x = uBolt.x * uRes.x
            + (noise1(vec2(p.y / 1400.0, uBolt.z)) - 0.5) * 420.0
            + (noise1(vec2(p.y / 300.0, uBolt.z + 0.37)) - 0.5) * 90.0;
        float d = abs(p.x - x);
        float reach = 1.0 - smoothstep(0.55, 0.75, p.y / uRes.y);
        color += vec3(0.92, 0.94, 1.0) * uBolt.y * reach * (exp(-d / 1.6) + 0.22 * exp(-d / 20.0));
    }
    if (a <= 0.0 && uBolt.y <= 0.001) discard;
    outColor = vec4(color, a);
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

/**
 * La gente y los vehículos de la Avenida Bolívar, y sus luces: una instancia por cada uno
 * (agents.ts). El quad se apoya en el suelo y crece hacia arriba; las luces se centran.
 */
export const AGENT_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 aAnchor;
in vec2 aSize;
in vec4 aMeta;
in vec3 aColor;
uniform vec2 uRes;
out vec2 vLocal;
out vec2 vSize;
out vec4 vMeta;
out vec3 vColor;
void main() {
    float kind = aMeta.x;
    vec2 local;
    if (kind > 3.5) {
        local = vec2(position.x - 0.5, position.y - 0.5) * aSize;
    } else {
        // Margen para los peatones, que abren las piernas, y para las ruedas.
        float padX = kind > 2.5 ? 2.4 : 1.15;
        local = vec2((position.x - 0.5) * aSize.x * padX, mix(-0.06, 1.06, position.y) * aSize.y);
    }
    vec2 px = aAnchor + vec2(local.x, kind > 3.5 ? local.y : -local.y);
    gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
    vLocal = vec2(local.x * aMeta.y, local.y);
    vSize = aSize;
    vMeta = aMeta;
    vColor = aColor;
}
`;

export const AGENT_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vLocal;
in vec2 vSize;
in vec4 vMeta;
in vec3 vColor;
uniform float uNight;
uniform float uTime;
out vec4 outColor;

const vec3 SIL_DAY = ${vec(DAY.vehicle, 3)};
const vec3 SIL_NIGHT = ${vec(NIGHT.vehicle, 3)};
const vec3 WIN_DAY = ${vec(DAY.vehicleWindow, 3)};
const vec3 WIN_NIGHT = ${vec(NIGHT.vehicleWindow, 3)};
const vec3 BUS_WIN_NIGHT = ${vec(NIGHT.busWindow, 3)};

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdRound(vec2 p, vec2 b, float r) { return sdBox(p, b - r) - r; }
float sdCap(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

void main() {
    float kind = vMeta.x;
    vec2 p = vLocal;
    float w = vSize.x;
    float h = vSize.y;
    if (kind > 4.5) {
        // Faro o luz trasera: un punto con resplandor. Suma luz.
        float r = length(p) / (0.5 * w);
        float a = exp(-r * r * 4.0) * 0.8 + 1.0 - smoothstep(0.18, 0.35, r);
        outColor = vec4(vColor * a * vMeta.w, 0.0);
        return;
    }
    if (kind > 3.5) {
        // El haz de los faros sobre el asfalto, que se abre y se apaga a lo lejos.
        float u = (p.x + 0.5 * w) / w;
        float spread = mix(0.1, 0.55, u);
        float v = p.y / (0.5 * h);
        float a = (1.0 - smoothstep(spread * 0.35, spread, abs(v))) * (1.0 - u) * (1.0 - u) * smoothstep(0.0, 0.05, u);
        outColor = vec4(vColor * a * 0.32 * vMeta.w, 0.0);
        return;
    }
    float d = 1e5;
    float win = 1e5;
    if (kind < 0.5) {
        d = sdRound(p - vec2(0.0, 0.36 * h), vec2(0.5 * w, 0.2 * h), 0.12 * h);
        vec2 q = p - vec2(-0.06 * w, 0.68 * h);
        q.x -= q.y * 0.55;
        d = min(d, sdRound(q, vec2(0.27 * w, 0.2 * h), 0.14 * h));
        win = sdRound(q - vec2(0.0, 0.01 * h), vec2(0.21 * w, 0.11 * h), 0.06 * h);
        win = max(win, -sdBox(p - vec2(-0.04 * w, 0.68 * h), vec2(0.015 * w, 0.3 * h)));
        d = min(d, length(p - vec2(0.31 * w, 0.14 * h)) - 0.15 * h);
        d = min(d, length(p - vec2(-0.31 * w, 0.14 * h)) - 0.15 * h);
    } else if (kind < 1.5) {
        d = sdRound(p - vec2(0.0, 0.54 * h), vec2(0.5 * w, 0.42 * h), 0.1 * h);
        win = sdBox(p - vec2(0.03 * w, 0.68 * h), vec2(0.44 * w, 0.11 * h));
        float cell = 0.12 * w;
        float toPillar = cell * 0.5 - abs(mod(p.x + 0.5 * w, cell) - cell * 0.5);
        win = max(win, -(toPillar - 0.01 * w));
        d = min(d, length(p - vec2(0.33 * w, 0.13 * h)) - 0.13 * h);
        d = min(d, length(p - vec2(-0.33 * w, 0.13 * h)) - 0.13 * h);
    } else if (kind < 2.5) {
        d = length(p - vec2(0.33 * w, 0.17 * h)) - 0.17 * h;
        d = min(d, length(p - vec2(-0.33 * w, 0.17 * h)) - 0.17 * h);
        d = min(d, sdCap(p, vec2(-0.3 * w, 0.3 * h), vec2(0.3 * w, 0.38 * h), 0.07 * h));
        d = min(d, sdCap(p, vec2(-0.05 * w, 0.45 * h), vec2(0.06 * w, 0.78 * h), 0.1 * h));
        d = min(d, length(p - vec2(0.1 * w, 0.9 * h)) - 0.1 * h);
        d = min(d, sdCap(p, vec2(0.06 * w, 0.72 * h), vec2(0.3 * w, 0.55 * h), 0.04 * h));
        d = min(d, sdCap(p, vec2(-0.02 * w, 0.45 * h), vec2(0.12 * w, 0.25 * h), 0.05 * h));
    } else {
        // Un peatón caminando: piernas y brazos que van y vienen, con un leve rebote.
        float t = uTime * 4.2 + vMeta.z;
        float sw = sin(t) * 0.42;
        p.y -= abs(cos(t)) * 0.015 * h;
        vec2 hip = vec2(0.0, 0.5 * h);
        vec2 sh = vec2(0.0, 0.76 * h);
        d = length(p - vec2(0.0, 0.9 * h)) - 0.075 * h;
        d = min(d, sdCap(p, hip + vec2(0.0, 0.04 * h), vec2(0.0, 0.78 * h), 0.085 * h));
        d = min(d, sdCap(p, hip, hip + vec2(sin(sw), -cos(sw)) * 0.48 * h, 0.04 * h));
        d = min(d, sdCap(p, hip, hip + vec2(sin(-sw), -cos(-sw)) * 0.48 * h, 0.04 * h));
        d = min(d, sdCap(p, sh, sh + vec2(sin(-sw * 0.8), -cos(sw * 0.8)) * 0.33 * h, 0.03 * h));
        d = min(d, sdCap(p, sh, sh + vec2(sin(sw * 0.8), -cos(sw * 0.8)) * 0.33 * h, 0.03 * h));
    }
    vec3 sil = mix(SIL_DAY, SIL_NIGHT, uNight);
    float body = 1.0 - smoothstep(-0.5, 0.5, d);
    float wn = (1.0 - smoothstep(-0.5, 0.5, win)) * body;
    vec3 window = mix(WIN_DAY, kind > 0.5 && kind < 1.5 ? BUS_WIN_NIGHT : WIN_NIGHT, uNight);
    outColor = vec4(mix(sil, window, wn) * body, body);
}
`;
