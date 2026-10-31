// PROTOTIPO desechable (ticket "Texto y ubicación del indicador de Caracas"): nunca se mergea.
// Tres formas del indicador en ?ind=a|b|c, sobre los estados de Clima del prototipo anterior.
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useI18n } from '@lib/i18n';

import { useBoveda } from '../prototype-boveda/store';
import type { Estado } from '../prototype-clima/clima';
import { useClima } from '../prototype-clima/store';

type Variant = 'a' | 'b' | 'c';
export interface IndicadorControls {
    variant: Variant;
    clock: 'h24' | 'locale';
    unit: 'c' | 'locale' | 'both';
    label: 'corto' | 'frase';
    source: 'nombre' | 'datos';
    noWeather: boolean;
}

function read(): IndicadorControls {
    const q = new URLSearchParams(window.location.search);
    return {
        variant: (q.get('ind') as Variant) ?? 'a',
        clock: (q.get('reloj') as IndicadorControls['clock']) ?? 'locale',
        unit: (q.get('unidad') as IndicadorControls['unit']) ?? 'locale',
        label: (q.get('etiqueta') as IndicadorControls['label']) ?? 'corto',
        source: (q.get('fuente') as IndicadorControls['source']) ?? 'nombre',
        noWeather: q.get('sinclima') === '1',
    };
}

let state = read();
const listeners = new Set<() => void>();

export function setIndicador(patch: Partial<IndicadorControls>) {
    state = { ...state, ...patch };
    const q = new URLSearchParams(window.location.search);
    q.set('ind', state.variant);
    q.set('reloj', state.clock);
    q.set('unidad', state.unit);
    q.set('etiqueta', state.label);
    q.set('fuente', state.source);
    q.set('sinclima', state.noWeather ? '1' : '0');
    window.history.replaceState(null, '', `?${q.toString()}`);
    listeners.forEach((l) => l());
}

export const useIndicador = () =>
    useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => state,
    );

const WORDS: Record<'es' | 'en', Record<'corto' | 'frase', Record<Estado, string>>> = {
    es: {
        corto: {
            despejado: 'despejado',
            parcial: 'parcial',
            nublado: 'nublado',
            lluvia: 'lluvia',
            tormenta: 'tormenta',
        },
        frase: {
            despejado: 'cielo despejado',
            parcial: 'algunas nubes',
            nublado: 'cielo nublado',
            lluvia: 'está lloviendo',
            tormenta: 'hay tormenta',
        },
    },
    en: {
        corto: {
            despejado: 'clear',
            parcial: 'partly cloudy',
            nublado: 'cloudy',
            lluvia: 'rain',
            tormenta: 'storm',
        },
        frase: {
            despejado: 'clear skies',
            parcial: 'a few clouds',
            nublado: 'cloudy skies',
            lluvia: "it's raining",
            tormenta: "there's a storm",
        },
    },
};

const ICONS: Record<Estado, string> = {
    despejado: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
    parcial: 'M8 4v2M3 9h2M4.5 5.5 6 7M11 7a4 4 0 0 0-6 4M8 19h9a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0 2 6Z',
    nublado: 'M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18Z',
    lluvia: 'M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 14ZM8 18l-1 3M12 18l-1 3M16 18l-1 3',
    tormenta: 'M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 14ZM13 12l-3 5h4l-3 5',
};

const Icon: React.FC<{ estado: Estado }> = ({ estado }) => (
    <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', verticalAlign: '-3px' }}
    >
        <path d={ICONS[estado]} />
    </svg>
);

const TEMP_C = 27;

function useTexts() {
    const { locale } = useI18n();
    const c = useIndicador();
    const clima = useClima();
    const boveda = useBoveda();
    const en = locale === 'en';
    const hour = boveda?.hour ?? 14;
    const h = Math.floor(hour);
    const min = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
    const time =
        c.clock === 'locale' && en
            ? `${h % 12 || 12}:${min} ${h < 12 ? 'AM' : 'PM'}`
            : `${String(h).padStart(2, '0')}:${min}`;
    const f = `${Math.round((TEMP_C * 9) / 5 + 32)} °F`;
    const temp =
        c.unit === 'both'
            ? `${TEMP_C} °C / ${f}`
            : c.unit === 'locale' && en
              ? f
              : `${TEMP_C} °C`;
    const estado = clima?.estado ?? 'nublado';
    return {
        c,
        en,
        time,
        temp,
        estado,
        word: WORDS[en ? 'en' : 'es'][c.label][estado],
        sourceLabel: c.source === 'nombre' ? 'Open-Meteo' : en ? 'data: Open-Meteo' : 'datos: Open-Meteo',
    };
}

/** El Clima entra un poco después de pintar, como cuando llega de la API. */
function useWeatherArrived(off: boolean) {
    const [arrived, setArrived] = useState(false);
    useEffect(() => {
        if (off) return;
        const t = window.setTimeout(() => setArrived(true), 900);
        return () => window.clearTimeout(t);
    }, [off]);
    return !off && arrived;
}

const Source: React.FC<{ label: string }> = ({ label }) => (
    <a
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
    >
        {label}
    </a>
);

// A: una línea de texto debajo de la ubicación, dentro de la columna.
const Linea: React.FC = () => {
    const { c, en, time, temp, word, sourceLabel } = useTexts();
    const weather = useWeatherArrived(c.noWeather);
    return (
        <p
            data-indicador="a"
            className="mx-auto max-w-xl text-sm text-ink"
            aria-label={undefined}
        >
            <span className="sr-only">{en ? 'In Caracas: ' : 'En Caracas: '}</span>
            <time>{time}</time>
            {weather && (
                <>
                    {' · '}
                    {temp} · {word} · <Source label={sourceLabel} />
                </>
            )}
        </p>
    );
};

// B: una píldora con icono, como la del rol.
const Pildora: React.FC = () => {
    const { c, en, time, temp, word, estado, sourceLabel } = useTexts();
    const weather = useWeatherArrived(c.noWeather);
    return (
        <p data-indicador="b">
            <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink md:text-sm">
                <span className="sr-only">{en ? 'In Caracas: ' : 'En Caracas: '}</span>
                {weather && <Icon estado={estado} />}
                <time>{time}</time>
                {weather && (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{temp}</span>
                        <span aria-hidden="true">·</span>
                        <span>{word}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-normal">
                            <Source label={sourceLabel} />
                        </span>
                    </>
                )}
            </span>
        </p>
    );
};

// C: un bloque aparte en la esquina del cielo; no toca la columna del Hero en escritorio.
const Esquina: React.FC = () => {
    const { c, time, temp, word, estado, sourceLabel } = useTexts();
    const weather = useWeatherArrived(c.noWeather);
    return (
        <div
            data-indicador="c"
            className="mb-3 text-center text-sm leading-snug text-ink md:absolute md:top-6 md:right-0 md:mb-0 md:text-right"
        >
            <div className="font-semibold">
                Caracas · <time>{time}</time>
            </div>
            {weather && (
                <>
                    <div>
                        <Icon estado={estado} /> {temp} · {word}
                    </div>
                    <div className="text-xs">
                        <Source label={sourceLabel} />
                    </div>
                </>
            )}
        </div>
    );
};

export const IndicadorColumna: React.FC = () => {
    const { variant } = useIndicador();
    const clima = useClima();
    if (!clima) return null;
    if (variant === 'a') return <Linea />;
    if (variant === 'b') return <Pildora />;
    return null;
};

export const IndicadorEsquina: React.FC = () => {
    const { variant } = useIndicador();
    const clima = useClima();
    if (!clima || variant !== 'c') return null;
    return <Esquina />;
};

const NAMES: Record<Variant, string> = { a: 'Línea', b: 'Píldora', c: 'Esquina' };

export const IndicadorBar: React.FC = () => {
    const c = useIndicador();
    const select = { background: '#222', color: '#fff', padding: 2 };
    const label = { display: 'flex', flexDirection: 'column', gap: 2 } as const;
    return (
        <>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Indicador</span>
                <select
                    style={select}
                    value={c.variant}
                    onChange={(e) => setIndicador({ variant: e.target.value as Variant })}
                >
                    {(Object.keys(NAMES) as Variant[]).map((k) => (
                        <option key={k} value={k}>
                            {k.toUpperCase()}: {NAMES[k]}
                        </option>
                    ))}
                </select>
            </label>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Hora</span>
                <select
                    style={select}
                    value={c.clock}
                    onChange={(e) =>
                        setIndicador({ clock: e.target.value as IndicadorControls['clock'] })
                    }
                >
                    <option value="locale">24 h en ES, 12 h en EN</option>
                    <option value="h24">Siempre 24 h</option>
                </select>
            </label>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Temperatura</span>
                <select
                    style={select}
                    value={c.unit}
                    onChange={(e) =>
                        setIndicador({ unit: e.target.value as IndicadorControls['unit'] })
                    }
                >
                    <option value="locale">°C en ES, °F en EN</option>
                    <option value="c">Siempre °C</option>
                    <option value="both">°C y °F</option>
                </select>
            </label>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Texto del Clima</span>
                <select
                    style={select}
                    value={c.label}
                    onChange={(e) =>
                        setIndicador({ label: e.target.value as IndicadorControls['label'] })
                    }
                >
                    <option value="corto">Corto (lluvia)</option>
                    <option value="frase">Frase (está lloviendo)</option>
                </select>
            </label>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Enlace</span>
                <select
                    style={select}
                    value={c.source}
                    onChange={(e) =>
                        setIndicador({ source: e.target.value as IndicadorControls['source'] })
                    }
                >
                    <option value="nombre">Open-Meteo</option>
                    <option value="datos">datos: Open-Meteo</option>
                </select>
            </label>
            <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                    type="checkbox"
                    checked={c.noWeather}
                    onChange={(e) => setIndicador({ noWeather: e.target.checked })}
                />
                Sin Clima (API caída)
            </label>
        </>
    );
};
