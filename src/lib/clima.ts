// El Clima y la hora de Caracas. Los datos salen de Open-Meteo, llamado desde el navegador después
// de pintar (docs/adr/0005); todo lo que depende de la fuente vive en este módulo.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { trackClimaCaida, type ClimaFailure } from '@lib/analytics';
import { whenIdleAfterLoad } from '@lib/idle';

import type { Locale } from '@/content';

const ESTADOS = ['despejado', 'parcial', 'nublado', 'lluvia', 'tormenta'] as const;
export type Estado = (typeof ESTADOS)[number];

export interface Clima {
    estado: Estado;
    /** En grados Celsius. */
    temperatura: number;
}

/** La fuente de los datos y su licencia: lo que muestran el Indicador y el crédito del pie. */
export const CLIMA_SOURCE = {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

const URL_OPEN_METEO =
    'https://api.open-meteo.com/v1/forecast?latitude=10.48&longitude=-66.90&current=temperature_2m,weather_code';
const CACHE_KEY = 'clima-caracas';
const REFRESH_MS = 30 * 60_000;
const CHECK_MS = 60_000;
// Si los refrescos fallan, el último Clima se mantiene hasta aquí; después, el cielo base.
const KEEP_MS = 60 * 60_000;
// ?clima= no trae temperatura: una típica de Caracas, para que el Indicador se vea completo.
const FORCED_TEMPERATURE = 27;

const inRange = (code: number, from: number, to: number) => code >= from && code <= to;

/** El estado de un código WMO de Open-Meteo, o `null` si no se conoce. */
export function estadoFromCode(code: number): Estado | null {
    if (!Number.isInteger(code)) return null;
    if (code === 0 || code === 1) return 'despejado';
    if (code === 2) return 'parcial';
    // La llovizna leve (51) y la niebla cuentan como nublado: si no, llovería casi un tercio del tiempo.
    if (code === 3 || code === 45 || code === 48 || code === 51) return 'nublado';
    if (
        inRange(code, 53, 57) ||
        inRange(code, 61, 67) ||
        inRange(code, 71, 77) ||
        inRange(code, 80, 82) ||
        code === 85 ||
        code === 86
    ) {
        return 'lluvia';
    }
    if (inRange(code, 95, 99)) return 'tormenta';
    return null;
}

function readCache(): (Clima & { at: number }) | null {
    try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { at, estado, temperatura } = JSON.parse(raw) as Clima & { at: number };
        return Date.now() - at < REFRESH_MS && ESTADOS.includes(estado)
            ? { estado, temperatura, at }
            : null;
    } catch {
        return null;
    }
}

function writeCache(clima: Clima) {
    try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ...clima, at: Date.now() }));
    } catch {
        /* ignore */
    }
}

async function fetchClima(): Promise<{ clima: Clima } | { failure: ClimaFailure }> {
    let response: Response;
    try {
        response = await fetch(URL_OPEN_METEO);
    } catch {
        return { failure: 'red' };
    }
    try {
        const body = (await response.json()) as {
            current?: { temperature_2m?: number; weather_code?: number };
        };
        const { temperature_2m: temperatura, weather_code: code } = body.current ?? {};
        const estado = typeof code === 'number' ? estadoFromCode(code) : null;
        if (!response.ok || !estado || typeof temperatura !== 'number') {
            return { failure: 'respuesta' };
        }
        return { clima: { estado, temperatura } };
    } catch {
        return { failure: 'respuesta' };
    }
}

/** Un `?clima=` válido, que sustituye al dato: para pruebas y demostraciones. */
function forcedEstado(search: string): Estado | null {
    const value = new URLSearchParams(search).get('clima');
    return ESTADOS.find((estado) => estado === value) ?? null;
}

export function createClimaStore({
    search,
    onFailure,
}: {
    search: string;
    onFailure: (failure: ClimaFailure) => void;
}) {
    const forced = forcedEstado(search);
    let current: Clima | null = forced && { estado: forced, temperatura: FORCED_TEMPERATURE };
    let started = false;
    let fetchedAt = 0;
    let shownAt = 0;
    let reported = false;
    let interval = 0;
    const listeners = new Set<() => void>();

    const notify = () => listeners.forEach((listener) => listener());
    const show = (clima: Clima, at: number) => {
        current = clima;
        shownAt = at;
        notify();
    };

    const load = async () => {
        fetchedAt = Date.now();
        const result = await fetchClima();
        if ('clima' in result) {
            writeCache(result.clima);
            show(result.clima, Date.now());
            return;
        }
        if (!reported) {
            reported = true;
            onFailure(result.failure);
        }
        if (current && Date.now() - shownAt >= KEEP_MS) {
            current = null;
            notify();
        }
    };

    // Se revisa seguido, y solo pide si el dato ya cumplió su edad y la pestaña está a la vista.
    const refresh = () => {
        if (!document.hidden && Date.now() - fetchedAt >= REFRESH_MS) void load();
    };

    return {
        forced: forced !== null,
        getSnapshot: () => current,
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        start() {
            if (started || forced) return;
            started = true;
            const cached = readCache();
            if (cached) {
                fetchedAt = cached.at;
                show({ estado: cached.estado, temperatura: cached.temperatura }, cached.at);
            } else {
                void load();
            }
            interval = window.setInterval(refresh, CHECK_MS);
            document.addEventListener('visibilitychange', refresh);
        },
        stop() {
            started = false;
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', refresh);
        },
    };
}

export const climaStore = createClimaStore({
    search: window.location.search,
    // Con la hora forzada es una prueba o una demostración: no se cuenta.
    onFailure: (failure) => {
        if (document.documentElement.dataset.horaForzada === undefined) trackClimaCaida(failure);
    },
});

/** El Clima de Caracas; hasta que llega o si falla, `null`. */
export function useClima(): Clima | null {
    useEffect(() => whenIdleAfterLoad(climaStore.start), []);
    return useSyncExternalStore(climaStore.subscribe, climaStore.getSnapshot);
}

// ---------- La hora de Caracas ----------

const CARACAS_OFFSET_MS = 4 * 3_600_000;

export interface CaracasClock {
    hour: number;
    minute: number;
}

/** La hora de Caracas en un instante: UTC-4 fija, porque `Intl` cuesta caro la primera vez. */
export function caracasClock(ms: number): CaracasClock {
    const minutes = Math.floor((ms - CARACAS_OFFSET_MS) / 60_000);
    const inDay = ((minutes % 1440) + 1440) % 1440;
    return { hour: Math.floor(inDay / 60), minute: inDay % 60 };
}

/** El instante de Caracas: el que forzó ?hora= (lo deja el script de index.html) o el reloj. */
export const caracasNow = () => Number(document.documentElement.dataset.horaForzada) || Date.now();

/** La hora de Caracas ahora: cambia justo al cambiar el minuto, y al volver a la pestaña. */
export function useCaracasClock(): CaracasClock {
    const [clock, setClock] = useState(() => caracasClock(caracasNow()));
    useEffect(() => {
        const tick = () => setClock(caracasClock(caracasNow()));
        let interval = 0;
        const timeout = window.setTimeout(
            () => {
                tick();
                interval = window.setInterval(tick, 60_000);
            },
            60_000 - (Date.now() % 60_000),
        );
        // Con la pestaña oculta, el navegador retrasa los temporizadores.
        document.addEventListener('visibilitychange', tick);
        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', tick);
        };
    }, []);
    return clock;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatHour({ hour, minute }: CaracasClock, locale: Locale): string {
    if (locale === 'es') return `${pad(hour)}:${pad(minute)}`;
    return `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function formatTemperature(celsius: number, locale: Locale): string {
    return locale === 'es'
        ? `${Math.round(celsius)} °C`
        : `${Math.round((celsius * 9) / 5 + 32)} °F`;
}
