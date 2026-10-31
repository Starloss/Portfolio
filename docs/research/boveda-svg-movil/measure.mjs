// Mide el costo de un cambio de tema (giro de 3,6 s) sobre un build de producción.
// Uso: node lab/measure.mjs --base http://127.0.0.1:4317 --render gpu|software --dpr 3 --turns 6 \
//        --out results.json [--only id1,id2] [--shots dir]
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

import { CONFIGS } from './configs.mjs';

const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i < 0 ? fallback : process.argv[i + 1];
};
const BASE = arg('base', 'http://127.0.0.1:4317');
const RENDER = arg('render', 'gpu');
const DPR = Number(arg('dpr', 3));
const TURNS = Number(arg('turns', 6));
const OUT = arg('out', 'results.json');
const ONLY = arg('only', '');
const SHOTS = arg('shots', '');
const WINDOW_MS = 3600;
const DUMP = process.argv.includes('--dump');

const CATEGORIES = [
    'toplevel',
    'devtools.timeline',
    'disabled-by-default-devtools.timeline',
    'disabled-by-default-devtools.timeline.frame',
    'blink.animations',
    'cc',
    'benchmark',
    'viz',
];

const LABELS = {
    FunctionCall: 'script',
    EvaluateScript: 'script',
    'v8.compile': 'script',
    FireAnimationFrame: 'script',
    TimerFire: 'script',
    EventDispatch: 'script',
    RunMicrotasks: 'script',
    FireIdleCallback: 'script',
    MinorGC: 'gc',
    MajorGC: 'gc',
    UpdateLayoutTree: 'style',
    ParseAuthorStyleSheet: 'style',
    Layout: 'layout',
    PrePaint: 'prepaint',
    Paint: 'paint',
    Layerize: 'paint',
    Commit: 'paint',
    UpdateLayer: 'paint',
    UpdateLayerTree: 'paint',
};

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    if (!s.length) return 0;
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

function threadNames(events) {
    const names = new Map();
    for (const e of events) {
        if (e.ph === 'M' && e.name === 'thread_name') names.set(`${e.pid}:${e.tid}`, e.args.name);
    }
    return names;
}

/** Tiempo propio por etiqueta en el hilo principal: cada instante cuenta para el evento más interno. */
function selfTimes(events, from, to) {
    const spans = events
        .filter((e) => e.ph === 'X' && e.dur !== undefined && e.ts < to && e.ts + e.dur > from)
        .sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    const out = {};
    const stack = [];
    const add = (label, us) => {
        out[label] = (out[label] ?? 0) + us;
    };
    const close = (until) => {
        while (stack.length && stack[stack.length - 1].end <= until) {
            const top = stack.pop();
            const self = Math.max(0, Math.min(top.end, to) - Math.max(top.start, from)) - top.child;
            if (top.label) add(top.label, Math.max(0, self));
            const parent = stack[stack.length - 1];
            if (parent) parent.child += Math.max(0, Math.min(top.end, to) - Math.max(top.start, from));
        }
    };
    for (const e of spans) {
        close(e.ts);
        const parent = stack[stack.length - 1];
        const label = LABELS[e.name] ?? parent?.label ?? (e.name === 'RunTask' ? 'other' : null);
        stack.push({ start: e.ts, end: e.ts + e.dur, label, child: 0 });
    }
    close(Infinity);
    return out;
}

function analyse(events, label) {
    const names = threadNames(events);
    const threadOf = (e) => names.get(`${e.pid}:${e.tid}`) ?? '';
    const clicks = events.filter(
        (e) => e.name === 'EventDispatch' && e.args?.data?.type === 'click',
    );
    if (!clicks.length) throw new Error(`${label}: sin click en la traza`);
    const click = clicks[0];
    const pid = click.pid;
    const tid = click.tid;
    const from = click.ts;
    const to = from + WINDOW_MS * 1000;
    const inWindow = (e) => e.ts >= from && e.ts < to;
    const main = events.filter((e) => e.pid === pid && e.tid === tid);
    const self = selfTimes(main, from, to);

    const tasks = main.filter((e) => e.name === 'RunTask' && e.ph === 'X' && inWindow(e));
    const long = tasks.filter((e) => e.dur > 50000);
    const firstTask = tasks.length ? Math.max(...tasks.slice(0, 3).map((e) => e.dur)) / 1000 : 0;

    const ofThread = (re) =>
        events
            .filter(
                (e) =>
                    e.ph === 'X' &&
                    e.name === 'ThreadControllerImpl::RunTask' &&
                    re.test(threadOf(e)) &&
                    (e.pid === pid || !/^Compositor$/.test(threadOf(e))) &&
                    inWindow(e),
            )
            .reduce((a, e) => a + e.dur, 0) / 1000;
    const raster = events
        .filter((e) => e.ph === 'X' && e.pid === pid && /^(RasterTask|ImageDecodeTask)$/.test(e.name) && inWindow(e))
        .reduce((a, e) => a + e.dur, 0);

    // Fotogramas: el veredicto del propio Chromium (PipelineReporter), comienzo async.
    const reporters = events.filter(
        (e) =>
            e.name === 'PipelineReporter' &&
            e.pid === pid &&
            e.ph === 'b' &&
            inWindow(e) &&
            e.args?.frame_reporter,
    );
    const states = {};
    for (const r of reporters) {
        const s = r.args.frame_reporter.state ?? 'unknown';
        states[s] = (states[s] ?? 0) + 1;
    }
    // ALL: el fotograma llevó todo lo pedido. PARTIAL: salió, pero sin la actualización del hilo
    // principal que iba en él. DROPPED: no salió.
    const presented = states.STATE_PRESENTED_ALL ?? 0;
    const partial = states.STATE_PRESENTED_PARTIAL ?? 0;
    const dropped = states.STATE_DROPPED ?? 0;
    const smoothnessBad = reporters.filter((r) => {
        const f = r.args.frame_reporter;
        return f.affects_smoothness && f.state !== 'STATE_PRESENTED_ALL';
    }).length;

    const draws = events
        .filter((e) => e.name === 'DrawFrame' && e.pid === pid && inWindow(e))
        .map((e) => e.ts)
        .sort((a, b) => a - b);
    const droppedEvents = events.filter((e) => e.name === 'DroppedFrame' && e.pid === pid && inWindow(e)).length;
    const gaps = draws.slice(1).map((t, i) => (t - draws[i]) / 1000);
    const rafs = main
        .filter((e) => e.name === 'FireAnimationFrame' && e.ph === 'X' && inWindow(e))
        .map((e) => e.ts);
    const mainFrames = main
        .filter((e) => e.name === 'Commit' && inWindow(e))
        .map((e) => e.ts);
    const mainGaps = mainFrames.slice(1).map((t, i) => (t - mainFrames[i]) / 1000);

    const animations = {};
    for (const e of events) {
        if (e.name !== 'Animation') continue;
        const d = e.args?.data;
        if (!d || d.compositeFailed === undefined) continue;
        const key = `${d.displayName ?? d.name ?? '?'}|fail=${d.compositeFailed}|${(d.unsupportedProperties ?? []).join('+')}`;
        animations[key] = (animations[key] ?? 0) + 1;
    }
    const ms = (k) => round((self[k] ?? 0) / 1000);
    return {
        scriptMs: ms('script'),
        styleMs: ms('style'),
        layoutMs: ms('layout'),
        prepaintMs: ms('prepaint'),
        paintMs: ms('paint'),
        gcMs: ms('gc'),
        otherMs: ms('other'),
        mainBusyMs: round(tasks.reduce((a, e) => a + e.dur, 0) / 1000),
        longTasks: long.length,
        tbtMs: round(long.reduce((a, e) => a + (e.dur - 50000), 0) / 1000),
        maxTaskMs: round(Math.max(0, ...tasks.map((e) => e.dur)) / 1000),
        firstTaskMs: round(firstTask),
        rasterMs: round(raster / 1000),
        compositorBusyMs: round(ofThread(/^Compositor$/)),
        vizBusyMs: round(ofThread(/VizCompositor/)),
        gpuBusyMs: round(ofThread(/CrGpuMain/)),
        frameStates: states,
        framesPresented: presented,
        framesPartial: partial,
        framesDropped: dropped,
        framesBadSmoothness: smoothnessBad,
        droppedFrameEvents: droppedEvents,
        draws: draws.length,
        drawGapsOver25ms: gaps.filter((g) => g > 25).length,
        maxDrawGapMs: round(Math.max(0, ...gaps)),
        commits: mainFrames.length,
        commitGapsOver25ms: mainGaps.filter((g) => g > 25).length,
        rafs: rafs.length,
        animations,
    };
}

async function trace(cdp, run) {
    const events = [];
    const onData = (d) => events.push(...d.value);
    cdp.on('Tracing.dataCollected', onData);
    await cdp.send('Tracing.start', {
        transferMode: 'ReportEvents',
        traceConfig: { recordMode: 'recordAsMuchAsPossible', includedCategories: CATEGORIES },
    });
    await run();
    const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
    await cdp.send('Tracing.end');
    await done;
    cdp.off('Tracing.dataCollected', onData);
    return events;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
    channel: 'chromium',
    headless: true,
    args:
        RENDER === 'gpu'
            ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
            : ['--disable-gpu'],
});
const browserCdp = await browser.newBrowserCDPSession();
const info = await browserCdp.send('SystemInfo.getInfo');
const environment = {
    render: RENDER,
    dpr: DPR,
    version: browser.version(),
    gpu: info.gpu.devices.map((d) => d.deviceString).join(' / '),
    gpuRasterization: info.gpu.featureStatus?.gpu_compositing,
    rasterization: info.gpu.featureStatus?.rasterization,
    turns: TURNS,
};
console.log(JSON.stringify(environment));

{
    const probe = await browser.newPage();
    environment.webglRenderer = await probe.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl');
        if (!gl) return 'sin WebGL';
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    await probe.close();
    console.log(environment.webglRenderer);
}
const results = {};
const selected = ONLY ? CONFIGS.filter((c) => ONLY.split(',').includes(c.id)) : CONFIGS;
for (const config of selected) {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: DPR,
        isMobile: true,
        hasTouch: true,
        colorScheme: 'light',
        locale: 'es-VE',
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
        window.__long = [];
        window.__events = [];
        new PerformanceObserver((l) => {
            for (const e of l.getEntries()) window.__long.push(e.duration);
        }).observe({ type: 'longtask', buffered: true });
        new PerformanceObserver((l) => {
            for (const e of l.getEntries())
                window.__events.push({ name: e.name, duration: e.duration });
        }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`${BASE}${config.url}`, { waitUntil: 'networkidle' });
    await sleep(2000);

    if (config.scroll) {
        await page.evaluate(
            (f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f),
            config.scroll,
        );
        await sleep(1000);
    }
    const toggle = page.getByRole('button', { name: /^(Oscuro|Claro|Dark|Light)$/ }).first();

    const turns = [];
    let night = false;
    for (let i = 0; i < TURNS; i++) {
        await page.evaluate(() => {
            window.__long.length = 0;
            window.__events.length = 0;
        });
        const events = await trace(cdp, async () => {
            await sleep(300);
            await toggle.click({ noWaitAfter: true });
            await sleep(WINDOW_MS + 700);
        });
        night = !night;
        if (DUMP && i === 0) {
            const names = {};
            for (const e of events) names[e.name] = (names[e.name] ?? 0) + 1;
            writeFileSync(`dump-${config.id}.json`, JSON.stringify(names, null, 1));
            const sample = events.filter((e) => e.name === 'PipelineReporter').slice(0, 3);
            console.log(JSON.stringify(sample).slice(0, 1500));
        }
        const metrics = analyse(events, config.id);
        const page_ = await page.evaluate(() => ({
            long: window.__long.slice(),
            events: window.__events.slice(),
        }));
        metrics.direction = night ? 'to-night' : 'to-day';
        metrics.apiLongTasks = page_.long.length;
        metrics.apiLongMaxMs = round(Math.max(0, ...page_.long));
        metrics.inpLikeMs = round(
            Math.max(
                0,
                ...page_.events
                    .filter((e) => /click|pointer|key/.test(e.name))
                    .map((e) => e.duration),
            ),
        );
        turns.push(metrics);
        await sleep(800);
    }

    // Una vuelta más, ya sin traza, para ver capas y foto a mitad del giro.
    const layers = {};
    const layerCdp = await context.newCDPSession(page);
    await layerCdp.send('DOM.enable');
    await layerCdp.send('LayerTree.enable');
    let lastLayers = [];
    layerCdp.on('LayerTree.layerTreeDidChange', (e) => {
        if (e.layers) lastLayers = e.layers;
    });
    await toggle.click({ noWaitAfter: true });
    await sleep(1800);
    const snapshot = lastLayers.slice();
    if (SHOTS) {
        mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({ path: `${SHOTS}/${config.id}-mid.png` });
    }
    await sleep(2600);
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${config.id}-end.png` });
    layers.count = snapshot.length;
    layers.megapixels = round(
        snapshot.filter((l) => l.drawsContent).reduce((a, l) => a + l.width * l.height, 0) / 1e6,
        2,
    );
    layers.largest = snapshot
        .filter((l) => l.drawsContent)
        .map((l) => `${Math.round(l.width)}x${Math.round(l.height)}`)
        .sort((a, b) => {
            const area = (s) => s.split('x').reduce((x, y) => x * y, 1);
            return area(b) - area(a);
        })
        .slice(0, 4);
    await layerCdp.detach();

    const stars = await page.evaluate(() => {
        const circles = [
            ...document.querySelectorAll('[data-part="boveda-css"] circle, [data-part="prototipo-boveda"] circle'),
        ];
        const visible = circles.filter((c) => {
            const r = c.getBoundingClientRect();
            return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
        }).length;
        return { total: circles.length, visible, dom: document.querySelectorAll('*').length };
    });

    const numeric = Object.keys(turns[0]).filter((k) => typeof turns[0][k] === 'number');
    const summarize = (list) =>
        Object.fromEntries(numeric.map((k) => [k, round(median(list.map((t) => t[k])))]));
    results[config.id] = {
        url: config.url,
        note: config.note,
        median: summarize(turns),
        toNight: summarize(turns.filter((t) => t.direction === 'to-night')),
        toDay: summarize(turns.filter((t) => t.direction === 'to-day')),
        worstTbtMs: Math.max(...turns.map((t) => t.tbtMs)),
        worstInpMs: Math.max(...turns.map((t) => t.inpLikeMs)),
        worstMaxTaskMs: Math.max(...turns.map((t) => t.maxTaskMs)),
        frameStates: turns.map((t) => t.frameStates),
        animations: turns[0].animations,
        layers,
        stars,
    };
    const m = results[config.id].median;
    console.log(
        `${config.id.padEnd(22)} script ${m.scriptMs} style ${m.styleMs} layout ${m.layoutMs} pre ${m.prepaintMs} paint ${m.paintMs} busy ${m.mainBusyMs} long ${m.longTasks} tbt ${m.tbtMs} maxT ${m.maxTaskMs} inp ${m.inpLikeMs} raster ${m.rasterMs} comp ${m.compositorBusyMs} viz ${m.vizBusyMs} gpu ${m.gpuBusyMs} all ${m.framesPresented} part ${m.framesPartial} drop ${m.framesDropped} bad ${m.framesBadSmoothness} commits ${m.commits} draws ${m.draws} gap>25 ${m.drawGapsOver25ms} max ${m.maxDrawGapMs}`,
    );
    writeFileSync(OUT, JSON.stringify({ environment, results }, null, 1));
    await context.close();
}
await browser.close();
