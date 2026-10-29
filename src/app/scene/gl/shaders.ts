// Prototipo #40: shaders de la Escena WebGL. Un solo pase de pantalla completa compone cielo,
// nubes, crestas, cabinas, ciudad y calle; un segundo pase instanciado dibuja la gente y los carros.
import { DAY, NIGHT, NIGHT_LIGHTS } from '../palette';

const v3 = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => (x / 255).toFixed(4));
    return `vec3(${c.join(', ')})`;
};

export const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const SCENE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform float uHeight;
uniform float uNight;
uniform float uDusk;
uniform sampler2D tFarD, tAvilaD, tCityD, tTowersD;
uniform sampler2D tFarN, tAvilaN, tCityN, tTowersN;
uniform sampler2D tCityL, tTowersL, tNoise, tMacaw;
uniform vec4 uShift;
uniform vec4 uParallax;
uniform vec2 uClouds;
uniform float uSkyHigh;
uniform vec3 uMoon;
uniform vec3 uCabin0, uCabin1, uCabin2;
uniform vec4 uMacaw;
uniform float uFront;
uniform vec2 uMist;
uniform vec2 uStreet;

const vec3 DAY_TOP = ${v3(DAY.skyTop)};
const vec3 DAY_BOTTOM = ${v3(DAY.skyBottom)};
const vec3 DAY_HIGH = ${v3(DAY.skyHigh)};
const vec3 NIGHT_TOP = ${v3(NIGHT.skyTop)};
const vec3 NIGHT_BOTTOM = ${v3(NIGHT.skyBottom)};
const vec3 NIGHT_HIGH = ${v3(NIGHT.skyHigh)};
const vec3 DUSK_TOP = vec3(0.17, 0.2, 0.42);
const vec3 DUSK_BOTTOM = vec3(1.0, 0.58, 0.36);
const vec3 MOON = ${v3(NIGHT_LIGHTS.moon)};
const vec3 LAMP = ${v3(NIGHT_LIGHTS.window)};
const vec3 CABIN_D = ${v3(DAY.cabin)};
const vec3 CABIN_N = ${v3(NIGHT.cabin)};
const vec3 CABIN_WIN_D = ${v3(DAY.cabinWindow)};
const vec3 CABIN_WIN_N = ${v3(NIGHT.cabinWindow)};
const vec3 CABLE_D = ${v3(DAY.cable)};
const vec3 CABLE_N = ${v3(NIGHT.cable)};

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdRound(vec2 p, vec2 b, float r) { return sdBox(p, b - r) - r; }

// Composición de adelante hacia atrás: cuando un píxel ya quedó opaco (calle, ciudad, montaña),
// no se calcula nada de lo que hay detrás. Es lo que más pesa con WebGL por software.
vec4 acc = vec4(0.0);
void put(vec3 c, float a) {
    acc.rgb += (1.0 - acc.a) * a * c;
    acc.a += (1.0 - acc.a) * a;
}
void glow(vec3 e) { acc.rgb += (1.0 - acc.a) * e; }
bool opaque() { return acc.a > 0.996; }

float noise1(vec2 q) { return texture(tNoise, q).r; }
float noise2(vec2 q) { return texture(tNoise, q).r * 0.7 + texture(tNoise, q * 3.1 + 0.37).g * 0.3; }

bool inside(vec2 uv) { return uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0; }

vec2 layerUv(vec2 p, float shift, float par) { return (p - vec2(par, shift)) / uRes; }

vec4 sampleLayer(sampler2D d, sampler2D n, vec2 uv) {
    if (uNight < 0.001) return texture(d, uv);
    if (uNight > 0.999) return texture(n, uv);
    return mix(texture(d, uv), texture(n, uv), uNight);
}

// Borde iluminado de una cresta, solo en el atardecer: opaca aquí y transparente hacia el sol.
float rim(sampler2D d, vec2 uv, float a) {
    if (uDusk < 0.01) return 0.0;
    return a * (1.0 - texture(d, uv + vec2(-2.5, -3.0) / uRes).a);
}

vec3 cloudColor(float lit) {
    vec3 top = mix(mix(vec3(1.0), vec3(0.55, 0.62, 0.8), uNight), vec3(1.0, 0.8, 0.62), uDusk);
    vec3 under = mix(mix(vec3(0.7, 0.77, 0.86), vec3(0.12, 0.16, 0.27), uNight), vec3(0.82, 0.42, 0.42), uDusk);
    return mix(under, top, lit);
}

vec3 mistColor() {
    return mix(mix(vec3(0.94, 0.96, 1.0), vec3(0.3, 0.37, 0.55), uNight), vec3(1.0, 0.74, 0.64), uDusk);
}

float mist(vec2 p, float center, float halfH, float scale, float speed) {
    float g = (p.y - center) / halfH;
    g = exp(-g * g);
    if (g < 0.03) return 0.0;
    return smoothstep(0.42, 0.72, noise1(vec2(p.x + uTime * speed, p.y * 3.0) / scale)) * g;
}

void lights(sampler2D tex, vec2 uv, vec2 local) {
#ifdef NO_LIGHTS
    return;
#endif
    if (uNight < 0.01) return;
    vec2 cell = floor(local / vec2(26.0, 20.0));
    float h = hash(cell);
    float flick = (0.72 + 0.28 * sin(uTime * (0.5 + h * 2.0) + h * 30.0)) * step(0.06, fract(h * 7.0 + uTime * 0.015));
    glow((texture(tex, uv).rgb * flick + textureLod(tex, uv, 4.0).rgb * 3.0) * uNight);
}

void cabin(vec2 p, vec3 c) {
    vec2 l = (p - c.xy) / c.z;
    if (c.z <= 0.0 || abs(l.x) > 7.0 || l.y < -1.0 || l.y > 18.0) return;
    float aa = 1.0 / c.z;
    float win = 1.0 - smoothstep(-aa, aa, sdRound(l - vec2(0.0, 10.5), vec2(3.5, 1.5), 1.0));
    float body = 1.0 - smoothstep(-aa, aa, sdRound(l - vec2(0.0, 11.5), vec2(5.0, 4.5), 2.5));
    float line = step(abs(l.x), 0.5) * step(0.0, l.y) * step(l.y, 7.0);
    put(mix(CABIN_WIN_D, CABIN_WIN_N, uNight), win * 0.9);
    put(mix(CABIN_D, CABIN_N, uNight), body);
    put(mix(CABLE_D, CABLE_N, uNight), line);
}

void street(vec2 p) {
    float H = uStreet.y;
    float top = uStreet.x;
    float s = (p.y - top) / H;
    float x = p.x - uParallax.w;
    // Postes de luz y árboles del bulevar, alternados cada 260 px.
    vec2 lp = vec2(mod(x + 130.0, 260.0) - 130.0, p.y - top);
    vec2 lamp = vec2(0.23 * H, -0.73 * H);
    if (uNight > 0.01) glow(LAMP * uNight * exp(-length(lp - lamp) / (0.09 * H)) * 0.9);
    float post = sdBox(lp - vec2(0.0, -0.25 * H), vec2(0.014 * H, 0.52 * H));
    post = min(post, sdBox(lp - vec2(0.12 * H, -0.765 * H), vec2(0.12 * H, 0.012 * H)));
    post = min(post, sdBox(lp - vec2(0.23 * H, -0.75 * H), vec2(0.045 * H, 0.016 * H)));
    put(mix(vec3(0.16, 0.21, 0.26), vec3(0.012, 0.02, 0.035), uNight), 1.0 - smoothstep(-0.8, 0.8, post));
    vec2 tp = vec2(mod(x, 260.0) - 130.0, p.y - top);
    float tree = min(min(length(tp - vec2(0.0, -0.16 * H)) - 0.22 * H,
                         length(tp - vec2(0.15 * H, -0.08 * H)) - 0.17 * H),
                     length(tp - vec2(-0.16 * H, -0.07 * H)) - 0.16 * H);
    tree = min(tree, sdBox(tp - vec2(0.0, 0.1 * H), vec2(0.02 * H, 0.16 * H)));
    put(mix(vec3(0.17, 0.29, 0.23), vec3(0.01, 0.025, 0.03), uNight), 1.0 - smoothstep(-1.0, 1.0, tree));
    if (uNight > 0.01) {
        vec2 dl = lp - lamp;
        float width = 0.04 * H + max(dl.y, 0.0) * 0.42;
        float cone = (1.0 - smoothstep(width * 0.5, width, abs(dl.x))) * step(0.0, dl.y) * exp(-dl.y / (1.1 * H)) * 0.16;
        vec2 pool = (lp - vec2(lamp.x, 0.62 * H)) / vec2(0.55 * H, 0.22 * H);
        glow(LAMP * uNight * (cone + exp(-dot(pool, pool) * 1.6) * 0.3 * step(0.3, s)));
    }
    if (s > 0.1) {
        vec3 g = mix(vec3(0.47, 0.52, 0.56), vec3(0.06, 0.08, 0.12), uNight);
        if (s > 0.3) g = mix(vec3(0.64, 0.66, 0.68), vec3(0.11, 0.13, 0.17), uNight);
        if (s > 0.33) g = mix(vec3(0.31, 0.34, 0.38), vec3(0.03, 0.045, 0.07), uNight);
        if (s > 0.915) g = mix(vec3(0.64, 0.66, 0.68), vec3(0.11, 0.13, 0.17), uNight);
        if (s > 0.94) g = mix(vec3(0.47, 0.52, 0.56), vec3(0.06, 0.08, 0.12), uNight);
        float dash = step(mod(x, 90.0), 46.0);
        vec3 mark = mix(vec3(0.92, 0.9, 0.8), vec3(0.32, 0.3, 0.24), uNight);
        if (abs(s - 0.535) < 0.006 || abs(s - 0.82) < 0.006) g = mix(g, mark, dash);
        if (abs(s - 0.672) < 0.005 || abs(s - 0.69) < 0.005) g = mix(vec3(0.95, 0.78, 0.2), vec3(0.38, 0.3, 0.08), uNight);
        put(g, 1.0);
    }
}

vec4 finish(vec2 p) {
    #ifdef NO_DITHER
    return vec4(acc.rgb, 1.0);
#else
    return vec4(acc.rgb + (hash(p + fract(uTime)) - 0.5) / 255.0, 1.0);
#endif
}

void main() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
    float t = p.y / uRes.y;
    vec3 horizon = mix(mix(DAY_BOTTOM, NIGHT_BOTTOM, uNight), DUSK_BOTTOM, uDusk * 0.7);

    #ifndef NO_FRONT
    // Nubes que la cámara atraviesa al bajar desde el Hero.
    if (uFront > 0.001) {
        vec2 q = vec2(p.x * 0.8 + uTime * 6.0 - uParallax.w * 2.0, p.y * 1.6 + uHeight * uRes.y * 1.8) / 1600.0;
        float n = noise2(q);
        float d = smoothstep(0.62 - 0.16 * uFront, 0.78, n) * uFront;
        put(cloudColor(smoothstep(0.55, 0.85, n)), d * mix(0.85, 0.55, uNight));
    }

    #endif
    #ifndef NO_STREET
    // Avenida Bolívar, la capa más cercana: entra desde abajo al final del Viaje.
    if (uStreet.x < uRes.y && p.y > uStreet.x - 0.8 * uStreet.y) {
        street(p);
        if (opaque()) { outColor = finish(p); return; }
    }

    #endif
    #ifndef NO_CITY
    // Torres de Parque Central y ciudad, con sus ventanas encendidas de Noche.
    vec2 uvT = layerUv(p, uShift.w, uParallax.z * 1.12);
    if (inside(uvT)) {
        lights(tTowersL, uvT, p - vec2(0.0, uShift.w));
        vec4 c = sampleLayer(tTowersD, tTowersN, uvT);
        put(c.rgb, c.a);
        if (opaque()) { outColor = finish(p); return; }
    }
    vec2 uvC = layerUv(p, uShift.z, uParallax.z);
    if (inside(uvC)) {
        lights(tCityL, uvC, p - vec2(uParallax.z, uShift.z));
        vec4 c = sampleLayer(tCityD, tCityN, uvC);
        put(mix(c.rgb, horizon, 0.05), c.a);
        if (opaque()) { outColor = finish(p); return; }
    }

    #endif
    #ifndef NO_AVILA
    // El Ávila, con la niebla pegada a sus laderas y las cabinas del Teleférico.
#ifndef NO_MIST
    put(mistColor(), mist(p, uMist.x + uShift.y, uMist.y, 1100.0, -4.0) * 0.55 * (1.0 - 0.4 * uNight));
#endif
#ifndef NO_CABINS
    cabin(p, uCabin0);
    cabin(p, uCabin1);
    cabin(p, uCabin2);
#endif
    vec2 uvA = layerUv(p, uShift.y, uParallax.y);
    if (inside(uvA)) {
        vec4 c = sampleLayer(tAvilaD, tAvilaN, uvA);
        vec3 rimCol = vec3(1.0, 0.62, 0.3) * uDusk;
        put(mix(c.rgb, horizon, 0.1 * (1.0 - 0.5 * uNight)) + rimCol * rim(tAvilaD, uvA, c.a), c.a);
        if (opaque()) { outColor = finish(p); return; }
    }

    #endif
    #ifndef NO_FAR
    // Cresta lejana, con niebla de distancia.
#ifndef NO_MIST
    put(mistColor(), mist(p, uMist.x + uShift.x - 0.08 * uRes.y, uMist.y, 1300.0, 5.0) * 0.4 * (1.0 - 0.4 * uNight));
#endif
    vec2 uvF = layerUv(p, uShift.x, uParallax.x);
    if (inside(uvF)) {
        vec4 c = sampleLayer(tFarD, tFarN, uvF);
        vec3 rimCol = vec3(1.0, 0.6, 0.28) * 0.8 * uDusk;
        put(mix(c.rgb, horizon, 0.32 * (1.0 - 0.5 * uNight)) + rimCol * rim(tFarD, uvF, c.a), c.a);
        if (opaque()) { outColor = finish(p); return; }
    }

    #endif
    #ifndef NO_CLOUDS
    // Nubes de fondo: bajan con la cámara, como en la Escena SVG.
    float top = uClouds.x + 0.08 * uRes.y;
    float span = 0.47 * uRes.y;
    float band = smoothstep(top, top + span * 0.35, p.y) * (1.0 - smoothstep(top + span * 0.6, top + span, p.y));
    if (band > 0.0 && uClouds.y > 0.0) {
        float n = noise2(vec2(p.x + uTime * 7.0, p.y * 2.2) / 1500.0);
        float d = smoothstep(0.56, 0.7, n) * band * uClouds.y * 0.85;
        put(cloudColor(smoothstep(0.56, 0.8, n) * (1.0 - 0.5 * (p.y - top) / span)), d * mix(0.9, 0.5, uNight));
    }

    #endif
    // Guacamayas (solo de Día).
    if (uNight < 0.99) {
        vec2 muv = (p - uMacaw.xy) / uMacaw.zw;
        if (inside(muv)) {
            vec4 m = texture(tMacaw, muv);
            put(m.rgb, m.a * (1.0 - uNight));
        }
    }

    // Cielo: Día, Noche y, en el cambio, un atardecer o amanecer con sol bajo a la izquierda.
    vec3 sky = mix(mix(DAY_TOP, DAY_BOTTOM, t), mix(NIGHT_TOP, NIGHT_BOTTOM, t), uNight);
    sky = mix(sky, mix(DUSK_TOP, DUSK_BOTTOM, smoothstep(0.0, 0.85, t)), uDusk * 0.85);
    sky = mix(sky, mix(DAY_HIGH, NIGHT_HIGH, uNight), uSkyHigh * (1.0 - smoothstep(0.0, 0.75, t)));
#ifndef NO_SKYFX
        if (uDusk > 0.01) {
        vec2 sun = vec2(0.12 * uRes.x, 0.6 * uRes.y);
        float sd = length(p - sun) / uRes.y;
        sky += vec3(1.0, 0.55, 0.25) * uDusk * (exp(-sd * 5.0) * 0.55 + smoothstep(0.04, 0.035, sd));
        float rays = noise1(vec2(atan(p.y - sun.y, p.x - sun.x) * 0.3, uTime * 0.004));
        sky += vec3(1.0, 0.72, 0.42) * uDusk * smoothstep(0.5, 0.8, rays) * exp(-sd * 2.2) * 0.3;
    }
    if (uNight > 0.01) {
        vec2 cell = floor(p / 34.0);
        float h = hash(cell);
        if (h > 0.9) {
            vec2 sp = (cell + vec2(hash(cell + 1.3), hash(cell + 7.1))) * 34.0;
            float r = h > 0.985 ? 1.5 : 0.8;
            float tw = 0.55 + 0.45 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
            sky += vec3(1.0) * smoothstep(r + 0.8, r - 0.4, length(p - sp)) * tw * uNight * (1.0 - uDusk) * (1.0 - t * 0.7);
        }
        if (uMoon.z > 0.0) {
            float d = length(p - uMoon.xy);
            float disc = smoothstep(uMoon.z + 1.0, uMoon.z - 1.0, d);
            sky = mix(sky, MOON, disc * uNight);
            sky += MOON * 0.3 * exp(-max(d - uMoon.z, 0.0) / 22.0) * uNight * (1.0 - disc);
        }
    }
#endif
        put(sky, 1.0);
    outColor = finish(p);
}
`;

export const AGENT_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 aAnchor;
in vec2 aSize;
in vec4 aMeta;
in vec3 aColor;
uniform vec2 uRes;
uniform float uShiftX;
out vec2 vLocal;
out vec2 vSize;
out vec4 vMeta;
out vec3 vColor;
void main() {
    float kind = aMeta.x;
    vec2 local;
    if (kind > 3.5) {
        local = vec2(position.x, position.y - 0.5) * aSize;
    } else {
        float padX = kind > 2.5 ? 2.4 : 1.15;
        local = vec2(position.x * aSize.x * padX, mix(-0.06, 1.06, position.y) * aSize.y);
    }
    vec2 screen = aAnchor + vec2(local.x + uShiftX, kind > 3.5 ? local.y : -local.y);
    gl_Position = vec4(screen.x / uRes.x * 2.0 - 1.0, 1.0 - screen.y / uRes.y * 2.0, 0.0, 1.0);
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
        float r = length(p) / (0.5 * w);
        float a = exp(-r * r * 4.0) * 0.8 + smoothstep(0.35, 0.18, r);
        outColor = vec4(vColor * a * vMeta.w, 0.0);
        return;
    }
    if (kind > 3.5) {
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
    vec3 sil = mix(vec3(0.15, 0.19, 0.24), vec3(0.01, 0.015, 0.025), uNight);
    // Los carriles de atrás se ven un poco más claros, por la distancia.
    sil = mix(sil, mix(vec3(0.31, 0.34, 0.38), vec3(0.03, 0.045, 0.07), uNight), (1.0 - smoothstep(0.5, 0.75, vMeta.w)) * 0.25);
    float body = 1.0 - smoothstep(-0.5, 0.5, d);
    float wn = (1.0 - smoothstep(-0.5, 0.5, win)) * body;
    vec3 winDay = mix(sil, vec3(0.72, 0.8, 0.88), 0.35);
    vec3 winNight = vec3(1.0, 0.82, 0.45) * (kind > 0.5 && kind < 1.5 ? 0.85 : 0.12);
    vec3 c = mix(sil, mix(winDay, winNight, uNight), wn);
    outColor = vec4(c * body, body);
}
`;

export const FLAT_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform float uTime;
out vec4 outColor;
void main() {
    outColor = vec4(0.4, 0.6, 0.8 + 0.1 * sin(uTime), 1.0);
}
`;
