// PROTOTIPO desechable: la barra flotante para comparar la Bóveda celeste. Solo aparece con ?boveda=.
import React, { useEffect } from 'react';
import { useTheme } from '@lib/theme';

import { restOf, VARIANTS, type Variant } from './sim';
import { setControls, useBoveda } from './store';

const KEYS: Variant[] = ['a', 'b', 'c'];
const hhmm = (h: number) =>
    `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;

function Pick<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: Record<T, string>;
    onChange: (v: T) => void;
}) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ opacity: 0.7 }}>{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                style={{ background: '#222', color: '#fff', padding: 2 }}
            >
                {(Object.keys(options) as T[]).map((k) => (
                    <option key={k} value={k}>
                        {options[k]}
                    </option>
                ))}
            </select>
        </label>
    );
}

export const PrototypeBar: React.FC = () => {
    const c = useBoveda();
    const { theme, toggleTheme } = useTheme();
    const cycle = (step: number) => {
        if (!c) return;
        const i = KEYS.indexOf(c.variant);
        setControls({ variant: KEYS[(i + step + KEYS.length) % KEYS.length] });
    };
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).closest('input,select,textarea')) return;
            if (e.key === 'ArrowLeft') cycle(-1);
            if (e.key === 'ArrowRight') cycle(1);
            if (e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
    if (!c) return null;
    const rest = restOf({ ...c, minX: 0 });
    const q = new URLSearchParams(window.location.search);
    const escena = q.get('escena') ?? 'auto';
    const button = { background: '#333', color: '#fff', padding: '2px 8px', borderRadius: 4 };
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
                boxShadow: '0 4px 20px rgba(0,0,0,.5)',
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
                    {c.variant.toUpperCase()} ({VARIANTS[c.variant].name})
                </b>
                <button type="button" style={button} onClick={() => cycle(1)}>
                    →
                </button>
                <button
                    type="button"
                    style={{ ...button, background: '#b45309' }}
                    onClick={toggleTheme}
                >
                    Girar (espacio)
                </button>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ opacity: 0.7 }}>Hora en Caracas: {hhmm(c.hour)}</span>
                <input
                    type="range"
                    min={0}
                    max={23.99}
                    step={0.05}
                    value={c.hour}
                    onChange={(e) => setControls({ hour: Number(e.target.value) })}
                />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ opacity: 0.7 }}>Fase lunar: {c.phase.toFixed(2)}</span>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={c.phase}
                    onChange={(e) => setControls({ phase: Number(e.target.value) })}
                />
            </label>
            <Pick
                label="Noche sin luna"
                value={c.moonRule}
                options={{ real: 'Sin luna', respaldo: 'Luna de respaldo' }}
                onChange={(moonRule) => setControls({ moonRule })}
            />
            <Pick
                label="Día con el sol puesto"
                value={c.sunRule}
                options={{
                    fija: 'Se desliza a fija',
                    horizonte: 'Queda en el horizonte',
                    sinsol: 'Día sin sol',
                }}
                onChange={(sunRule) => setControls({ sunRule })}
            />
            <Pick
                label="Arco y texto"
                value={c.arc}
                options={{
                    sobre: 'Pasa sobre el título',
                    completo: 'Pasa detrás del texto',
                    derecha: 'Solo a la derecha',
                }}
                onChange={(arc) => setControls({ arc })}
            />
            <Pick
                label="La UI cambia"
                value={c.ui}
                options={{ inicio: 'Al empezar', mitad: 'A la mitad', final: 'Al terminar' }}
                onChange={(ui) => setControls({ ui })}
            />
            <Pick
                label="Escena (recarga)"
                value={escena as 'auto' | 'svg' | 'webgl'}
                options={{ auto: 'Detectar', svg: 'SVG', webgl: 'WebGL' }}
                onChange={(v) => {
                    if (v === 'auto') q.delete('escena');
                    else q.set('escena', v);
                    window.location.search = q.toString();
                }}
            />
            <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                    type="checkbox"
                    checked={c.reduced}
                    onChange={(e) => setControls({ reduced: e.target.checked })}
                />
                reduced-motion
            </label>
            <div style={{ flexBasis: '100%', opacity: 0.8 }}>
                Tema: {theme === 'dark' ? 'Noche' : 'Día'} · Sol ({rest.sunUp ? 'arriba' : 'abajo'}
                ): {rest.sun.why} · Luna ({rest.moonUp ? 'arriba' : 'abajo'}): {rest.moon.why}
            </div>
        </div>
    );
};
