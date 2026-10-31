// PROTOTIPO desechable: la barra flotante para comparar el Clima. Solo aparece con ?clima=.
import React, { useEffect, useState } from 'react';
import { useTheme } from '@lib/theme';

import { setControls, useBoveda } from '../prototype-boveda/store';
import { IndicadorBar } from '../prototype-indicador/Indicador';

import { CLIMA_VARIANTS, climaTarget, ESTADOS, type ClimaVariant } from './clima';
import { setClima, useClima } from './store';

const KEYS: ClimaVariant[] = ['a', 'b', 'c'];
const hhmm = (h: number) =>
    `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;

export const ClimaBar: React.FC = () => {
    const c = useClima();
    const [hidden, setHidden] = useState(false);
    const b = useBoveda();
    const { theme, toggleTheme } = useTheme();
    const cycle = (step: number) => {
        if (c) setClima({ variant: KEYS[(KEYS.indexOf(c.variant) + step + 3) % 3] });
    };
    const shift = (step: number) => {
        if (!c) return;
        const i = ESTADOS.indexOf(c.estado);
        setClima({ estado: ESTADOS[Math.min(4, Math.max(0, i + step))] });
    };
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).closest('input,select,textarea')) return;
            if (e.key === 'h') setHidden((v) => !v);
            if (e.key === 'ArrowLeft') cycle(-1);
            if (e.key === 'ArrowRight') cycle(1);
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                shift(1);
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                shift(-1);
            }
            if (e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
    if (!c || hidden) return null;
    const t = climaTarget(c);
    const q = new URLSearchParams(window.location.search);
    const escena = q.get('escena') ?? 'webgl';
    const button = { background: '#333', color: '#fff', padding: '2px 8px', borderRadius: 4 };
    const label = { display: 'flex', flexDirection: 'column', gap: 2 } as const;
    return (
        <div
            style={{
                position: 'fixed',
                left: '50%',
                bottom: 8,
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: 'min(960px, calc(100vw - 16px))',
                background: 'rgba(10,10,10,.92)',
                color: '#fff',
                font: '12px/1.3 system-ui, sans-serif',
                padding: 8,
                borderRadius: 8,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                alignItems: 'flex-end',
            }}
        >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button type="button" style={button} onClick={() => cycle(-1)}>
                    ←
                </button>
                <b>
                    {c.variant.toUpperCase()} ({CLIMA_VARIANTS[c.variant]})
                </b>
                <button type="button" style={button} onClick={() => cycle(1)}>
                    →
                </button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
                {ESTADOS.map((estado) => (
                    <button
                        key={estado}
                        type="button"
                        onClick={() => setClima({ estado })}
                        style={{
                            ...button,
                            background: estado === c.estado ? '#b45309' : '#333',
                        }}
                    >
                        {estado}
                    </button>
                ))}
            </div>
            <button type="button" style={button} onClick={toggleTheme}>
                {theme === 'dark' ? 'Noche' : 'Día'} (espacio)
            </button>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Tope de oscuridad: {c.topeOscuro.toFixed(2)}</span>
                <input
                    type="range"
                    min={0}
                    max={0.65}
                    step={0.01}
                    value={c.topeOscuro}
                    onChange={(e) => setClima({ topeOscuro: Number(e.target.value) })}
                />
            </label>
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Tope de densidad: {c.topeDensidad.toFixed(2)}</span>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={c.topeDensidad}
                    onChange={(e) => setClima({ topeDensidad: Number(e.target.value) })}
                />
            </label>
            {b && (
                <label style={label}>
                    <span style={{ opacity: 0.7 }}>Hora en Caracas: {hhmm(b.hour)}</span>
                    <input
                        type="range"
                        min={0}
                        max={23.99}
                        step={0.05}
                        value={b.hour}
                        onChange={(e) => setControls({ hour: Number(e.target.value) })}
                    />
                </label>
            )}
            <label style={label}>
                <span style={{ opacity: 0.7 }}>Escena (recarga)</span>
                <select
                    value={escena}
                    onChange={(e) => {
                        q.set('escena', e.target.value);
                        window.location.search = q.toString();
                    }}
                    style={{ background: '#222', color: '#fff', padding: 2 }}
                >
                    <option value="webgl">WebGL</option>
                    <option value="svg">SVG (móvil y reduced-motion)</option>
                </select>
            </label>
            <IndicadorBar />
            <div style={{ flexBasis: '100%', opacity: 0.8 }}>
                ↑ ↓ cambian el estado · h esconde esta barra · Cobertura {t.cover.toFixed(2)} · Oscuridad{' '}
                {t.dark.toFixed(2)} · Lluvia {t.rain.toFixed(2)} · Rayos {t.storm ? 'sí' : 'no'}
            </div>
        </div>
    );
};
